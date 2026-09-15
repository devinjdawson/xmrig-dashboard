"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { XmrigThreadsResponse } from "@/lib/xmrig/types"

interface MinerThreadsProps {
  threads: XmrigThreadsResponse | null
  loading?: boolean
  error?: string | null
}

export function MinerThreads({ threads, loading, error }: MinerThreadsProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-accent rounded-md animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive text-sm p-4">
        {error}
      </div>
    )
  }

  if (!threads || !threads.threads || threads.threads.length === 0) {
    return <div className="text-muted-foreground">No thread data available.</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {threads.threads.length} threads active
      </div>
      <ScrollArea className="h-64">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CPU</TableHead>
              <TableHead>10s (H/s)</TableHead>
              <TableHead>60s (H/s)</TableHead>
              <TableHead>15m (H/s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {threads.threads.map((t: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">Core {t.cpu}</TableCell>
                <TableCell>{t.hashrate[0]?.toFixed(2) ?? "—"}</TableCell>
                <TableCell>{t.hashrate[1]?.toFixed(2) ?? "—"}</TableCell>
                <TableCell>{t.hashrate[2]?.toFixed(2) ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}