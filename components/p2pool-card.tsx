"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface P2PoolCardProps {
  url: string
  enabled: boolean
}

function formatHashrate(h: number): string {
  if (!h) return "0 H/s"
  if (h >= 1e12) return `${(h / 1e12).toFixed(2)} TH/s`
  if (h >= 1e9) return `${(h / 1e9).toFixed(2)} GH/s`
  if (h >= 1e6) return `${(h / 1e6).toFixed(2)} MH/s`
  if (h >= 1e3) return `${(h / 1e3).toFixed(2)} KH/s`
  return `${h.toFixed(2)} H/s`
}

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() / 1000) - ts)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export function P2PoolCard({ url, enabled }: P2PoolCardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled || !url) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    fetch(`/api/p2pool?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => { if (active) setData(d) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [url, enabled])

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="secondary">P2Pool</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add P2Pool URL in Network Settings to enable.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Badge variant="secondary">P2Pool</Badge></CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading...</CardContent>
      </Card>
    )
  }

  if (data?.error || !data?.stats) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Badge variant="secondary">P2Pool</Badge></CardTitle></CardHeader>
        <CardContent className="text-sm text-destructive">{data?.error || "Failed to fetch stats"}</CardContent>
      </Card>
    )
  }

  const s = data.stats
  const ps = s.pool_statistics || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">P2Pool</Badge>
            <Badge variant="success">Connected</Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{url}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Pool Hashrate</div>
            <div className="font-mono">{formatHashrate(ps.hash_rate_15m)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Miners</div>
            <div className="font-mono">{ps.miners ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Difficulty</div>
            <div className="font-mono">{ps.sidechain_difficulty ? Number(ps.sidechain_difficulty).toLocaleString() : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Last Block</div>
            <div className="font-mono">
              {ps.last_block_found_time ? timeAgo(ps.last_block_found_time) : "—"}
            </div>
          </div>
        </div>

        {data.blocks?.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Recent Blocks</div>
            <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
              {data.blocks.slice(0, 5).map((b: any, i: number) => (
                <div key={i} className="flex justify-between font-mono">
                  <span className="truncate">#{b.height} · {b.hash?.slice(0, 12)}...</span>
                  <span className="text-muted-foreground">{timeAgo(b.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
