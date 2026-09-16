"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RollingNumber } from "@/components/ui/rolling-number"
import { HashrateGauge } from "@/components/hashrate-gauge"
import { Activity, CircleDot, Server, Timer } from "lucide-react"
import type { XmrigSummary } from "@/lib/xmrig/types"

interface MinerSummaryProps {
  summary: XmrigSummary | null
  loading?: boolean
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatUptimeSeconds(seconds: number): number {
  // returns the largest whole unit value for the rolling number
  if (seconds >= 86400) return Math.floor(seconds / 86400)
  if (seconds >= 3600) return Math.floor(seconds / 3600)
  return Math.floor(seconds / 60)
}

function uptimeUnit(seconds: number): string {
  if (seconds >= 86400) return "d"
  if (seconds >= 3600) return "h"
  return "m"
}

export function MinerSummary({ summary, loading }: MinerSummaryProps) {
  if (loading || !summary) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-8 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-16 animate-pulse rounded-xl border border-border bg-muted" />
      </div>
    )
  }

  const sharesGood = summary.results?.shares_good ?? 0
  const sharesTotal = summary.results?.shares_total ?? 0
  const acceptRate =
    sharesTotal > 0
      ? ((sharesGood / sharesTotal) * 100).toFixed(1)
      : "0.0"
  const uptime = summary.connection?.uptime ?? 0
  const ping = summary.connection?.ping ?? 0
  const failures = summary.connection?.failures ?? 0
  const pool = summary.connection?.pool ?? "—"
  // XMRig "failures" is a cumulative disconnect counter since startup, not current state.
  // The live signal is connection.uptime: duration of the current active connection.
  const connected = uptime > 0 || (summary.hashrate?.total?.[0] ?? 0) > 0

  // Best 10 hashes for a compact sparkline-like display
  const bestResults = (summary.results?.best ?? []).slice(0, 10)

  return (
    <div className="space-y-3">
      {/** Top row: dial + 2 stat cards, all 1:1:1 on md+, stacked on mobile */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <HashrateGauge
          current={summary.hashrate?.total?.[0]}
          max={summary.hashrate?.highest}
        />

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 space-y-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5" />
              Shares
            </CardTitle>
            <Badge variant={Number(acceptRate) >= 95 ? "success" : Number(acceptRate) >= 80 ? "secondary" : "destructive"}>
              {acceptRate}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums tracking-tight text-foreground">
              <span className="text-4xl font-extrabold">
                <RollingNumber value={sharesGood} decimals={0} />
              </span>
              <span className="text-muted-foreground text-xl font-normal mx-1">/</span>
              <span className="text-lg text-muted-foreground font-medium">
                <RollingNumber value={sharesTotal} decimals={0} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Good / Total
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 space-y-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Uptime
            </CardTitle>
            <Badge variant={connected ? "success" : "destructive"}>
              {connected ? "Healthy" : "Down"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold tracking-tight text-foreground">
              <RollingNumber
                value={formatUptimeSeconds(uptime)}
                decimals={0}
                suffix={uptimeUnit(uptime)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Ping <span className="font-mono">{ping}ms</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/** Best hashes strip */}
      {bestResults.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Best Hashes</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {bestResults.map((h, i) => (
                <span
                  key={i}
                  className="text-[11px] font-mono bg-secondary/60 px-1.5 py-0.5 rounded"
                >
                  {h.toLocaleString()}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/** Pool info as its own line at the bottom */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Pool
          </CardTitle>
          <Badge variant={connected ? "success" : "destructive"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-mono truncate">{pool}</div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Current Diff</div>
              <div className="font-mono">{(summary.results?.diff_current ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Time</div>
              <div className="font-mono">{summary.results?.avg_time ?? 0}s</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Hashes</div>
              <div className="font-mono">{(summary.results?.hashes_total ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Failures</div>
              <div className="font-mono">{failures}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
