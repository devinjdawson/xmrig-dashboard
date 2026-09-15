"use client"

import { HashrateChart } from "./hashrate-chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { XmrigThreadsResponse } from "@/lib/xmrig/types"

interface MinerThreadsProps {
  threads: XmrigThreadsResponse | null
  loading?: boolean
}

export function MinerThreads({ threads, loading }: MinerThreadsProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-accent rounded-md animate-pulse" />
        ))}
      </div>
    )
  }

  if (!threads) {
    return <div className="text-muted-foreground">No thread data available.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {threads.threads.length} threads • {threads.memory ? `${(threads.memory / 1024 / 1024).toFixed(2)} MB` : "Memory: N/A"}
        </span>
      </div>
      <ScrollArea className="h-full max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CPU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Power Mode</TableHead>
              <TableHead className="text-right">Hashrate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {threads.threads.map((t, i) => (
              <TableRow key={i}>
              <TableCell className="font-medium">Core {t.affine_to_cpu ?? i}</TableCell>
              <TableCell>{t.type || "CPU"}</TableCell>
              <TableCell>{t.soft_aes ? "Soft AES" : "Hardware AES"}</TableCell>
                <TableCell className="text-right font-mono">
                  {t.hashrate[0].toFixed(2)} H/s
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
