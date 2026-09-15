"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Miner } from "@/lib/xmrig/types"

interface CumulativeStatsProps {
  miners: Miner[]
  selectedMiners: Set<string>
}

function formatHashrate(hps: number): string {
  if (hps >= 1000000) return `${(hps / 1000000).toFixed(2)} MH/s`
  if (hps >= 1000) return `${(hps / 1000).toFixed(2)} KH/s`
  return `${hps.toFixed(2)} H/s`
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function CumulativeStats({ miners, selectedMiners }: CumulativeStatsProps) {
  const activeMiners = miners.filter((m) => selectedMiners.has(m.id) && m.lastSummary && !m.error)
  
  const totalHashrate = activeMiners.reduce((sum, m) => 
    sum + (m.lastSummary?.hashrate.total[0] ?? 0), 0)
  
  const totalSharesGood = activeMiners.reduce((sum, m) => 
    sum + (m.lastSummary?.results.shares_good ?? 0), 0)
  
  const totalSharesTotal = activeMiners.reduce((sum, m) => 
    sum + (m.lastSummary?.results.shares_total ?? 0), 0)
  
  const totalUptime = activeMiners.reduce((sum, m) => 
    sum + (m.lastSummary?.connection.uptime ?? 0), 0)
  
  const avgAcceptRate = totalSharesTotal > 0 
    ? ((totalSharesGood / totalSharesTotal) * 100).toFixed(1)
    : "0.0"
  
  const onlineCount = miners.filter((m) => m.lastSummary && !m.error).length
  const selectedCount = selectedMiners.size

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cumulative Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Hashrate</p>
            <p className="text-2xl font-bold">{formatHashrate(totalHashrate)}</p>
            <p className="text-xs text-muted-foreground">
              {activeMiners.length} of {selectedCount} selected miners
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Shares</p>
            <p className="text-2xl font-bold">{totalSharesGood}/{totalSharesTotal}</p>
            <p className="text-xs text-muted-foreground">{avgAcceptRate}% accept rate</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold">{formatUptime(totalUptime)}</p>
            <p className="text-xs text-muted-foreground">Combined</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Miners Online</p>
            <p className="text-2xl font-bold">{onlineCount}/{miners.length}</p>
            <p className="text-xs text-muted-foreground">Active devices</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}