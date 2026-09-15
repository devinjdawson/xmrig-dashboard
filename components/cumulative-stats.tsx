"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Miner } from "@/lib/xmrig/types"

interface CumulativeStatsProps {
  miners: Miner[]
  selectedMiners?: Set<string>
  title?: string
  compact?: boolean
}

function formatHashrate(hps: number | null | undefined): string {
  if (hps == null || isNaN(hps)) return "0.00 H/s"
  if (hps >= 1000000) return `${(hps / 1000000).toFixed(2)} MH/s`
  if (hps >= 1000) return `${(hps / 1000).toFixed(2)} KH/s`
  return `${hps.toFixed(2)} H/s`
}

function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return "0m"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function CumulativeStats({ miners, selectedMiners, title = "Cumulative Stats", compact }: CumulativeStatsProps) {
  const activeMiners = selectedMiners
    ? miners.filter((m) => selectedMiners.has(m.id) && m.lastSummary && !m.error)
    : miners.filter((m) => m.lastSummary && !m.error)

  const totalHashrate = activeMiners.reduce((sum, m) =>
    sum + (m.lastSummary?.hashrate?.total?.[0] ?? 0), 0)

  const totalSharesGood = activeMiners.reduce((sum, m) =>
    sum + (m.lastSummary?.results?.shares_good ?? 0), 0)

  const totalSharesTotal = activeMiners.reduce((sum, m) =>
    sum + (m.lastSummary?.results?.shares_total ?? 0), 0)

  const totalUptime = activeMiners.reduce((sum, m) =>
    sum + (m.lastSummary?.connection?.uptime ?? 0), 0)

  const avgAcceptRate = totalSharesTotal > 0
    ? ((totalSharesGood / totalSharesTotal) * 100).toFixed(1)
    : "0.0"

  const onlineCount = miners.filter((m) => m.lastSummary && !m.error).length

  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="font-mono">{formatHashrate(totalHashrate)}</span>
        <span>{totalSharesGood}/{totalSharesTotal} shares ({avgAcceptRate}%)</span>
        <span>{onlineCount}/{miners.length} online</span>
        <span className="text-muted-foreground">{formatUptime(totalUptime)} combined</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Hashrate</p>
            <p className="text-3xl font-extrabold tracking-tight">{formatHashrate(totalHashrate)}</p>
            <p className="text-xs text-muted-foreground">
              {activeMiners.length} of {selectedMiners?.size ?? miners.length} selected miners
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Shares</p>
            <p className="text-3xl font-extrabold tracking-tight">{totalSharesGood}/{totalSharesTotal}</p>
            <p className="text-xs text-muted-foreground">{avgAcceptRate}% accept rate</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-3xl font-extrabold tracking-tight">{formatUptime(totalUptime)}</p>
            <p className="text-xs text-muted-foreground">Combined</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Miners Online</p>
            <p className="text-3xl font-extrabold tracking-tight">{onlineCount}/{miners.length}</p>
            <p className="text-xs text-muted-foreground">Active devices</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
