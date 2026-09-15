"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MiningStatsCardProps {
  minerId: string
}

export function MiningStatsCard({ minerId }: MiningStatsCardProps) {
  const [stats, setStats] = useState<{ blocks?: number; firstHashTime?: number; bestHash?: number; totalHashes?: number } | null>(null)

  useEffect(() => {
    fetch(`/api/miners/${minerId}/aggregate`)
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {})
  }, [minerId])

  if (!stats) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Mining Statistics</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground text-sm">Loading...</CardContent>
      </Card>
    )
  }

  const uptime = stats.firstHashTime
    ? Math.floor((Date.now() - stats.firstHashTime) / 1000)
    : 0
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Mining Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Blocks Found</div>
            <div className="font-mono">{stats.blocks ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Best Hash</div>
            <div className="font-mono">{stats.bestHash?.toLocaleString() ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Hashes</div>
            <div className="font-mono">{stats.totalHashes?.toLocaleString() ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tracking</div>
            <div className="font-mono">{days}d {hours}h</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
