"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { XmrigConfig } from "@/lib/xmrig/types"

interface MinerConfigProps {
  config: XmrigConfig | null
  loading?: boolean
}

function downloadConfig(config: XmrigConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "config.json"
  a.click()
  URL.revokeObjectURL(url)
}

export function MinerConfig({ config, loading }: MinerConfigProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 bg-accent rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!config) {
    return <div className="text-muted-foreground">No configuration available.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => downloadConfig(config)}>
          Download Config
        </Button>
      </div>
      <ScrollArea className="h-full max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setting</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Algorithm</TableCell>
              <TableCell>{config.algo || "default"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">API Port</TableCell>
              <TableCell>{config.api?.port}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">API Restricted</TableCell>
              <TableCell>{config.api?.restricted ? "Yes" : "No"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">API IPv6</TableCell>
              <TableCell>{config.api?.ipv6 ? "Yes" : "No"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Donation Level</TableCell>
              <TableCell>{config["donate-level"]} %</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Pools</TableCell>
              <TableCell>
                {config.pools?.map((p, i) => (
                  <div key={i} className="mb-1">
                    <div className="font-medium">{p.url}</div>
                    <div className="text-sm text-muted-foreground">{p.pass || "x"}</div>
                  </div>
                ))}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Retries</TableCell>
              <TableCell>{config.retries ?? 5}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Retry Pause</TableCell>
              <TableCell>{config["retry-pause"]}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>

      <div>
        <h4 className="text-sm font-medium mb-2">Raw Configuration</h4>
        <ScrollArea className="h-64 rounded-md border p-3">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(config, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}
