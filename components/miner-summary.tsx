import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { XmrigSummary } from "@/lib/xmrig/types"

interface MinerSummaryProps {
  summary: XmrigSummary | null
  loading?: boolean
}

function formatHashrate(hps: number): string {
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

export function MinerSummary({ summary, loading }: MinerSummaryProps) {
  if (loading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  const totalHashrate = summary.hashrate.total[0]
  const pool = summary.connection.pool
  const acceptRate =
    summary.results.shares_total > 0
      ? ((summary.results.shares_good / summary.results.shares_total) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Hashrate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHashrate(totalHashrate)}</div>
          <p className="text-xs text-muted-foreground">
            Highest: {formatHashrate(summary.hashrate.highest)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Shares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.results.shares_good}/{summary.results.shares_total}
          </div>
          <p className="text-xs text-muted-foreground">Accept rate: {acceptRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatUptime(summary.connection.uptime)}</div>
          <p className="text-xs text-muted-foreground">
            Ping: {summary.connection.ping}ms · Failures: {summary.connection.failures}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-mono">{pool}</div>
          <Badge variant={summary.connection.failures > 0 ? "destructive" : "success"} className="mt-1">
            {summary.connection.failures > 0 ? "Disconnected" : "Connected"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}