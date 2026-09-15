"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MoneroCardProps {
  url: string
  user: string
  pass: string
  enabled: boolean
}

function formatDifficulty(n: number | string): string {
  const num = typeof n === "string" ? parseFloat(n) : n
  if (!num) return "0"
  if (num >= 1e15) return `${(num / 1e15).toFixed(2)}PH`
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}TH`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}GH`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}MH`
  return num.toLocaleString()
}

export function MoneroCard({ url, user, pass, enabled }: MoneroCardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled || !url) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const params = new URLSearchParams({ url, user, pass })
    fetch(`/api/monero?${params}`)
      .then((r) => r.json())
      .then((d) => { if (active) setData(d) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [url, user, pass, enabled])

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="secondary">Monero Node</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add monerod RPC URL in Network Settings to enable.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Badge variant="secondary">Monero Node</Badge></CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading...</CardContent>
      </Card>
    )
  }

  if (data?.error || !data?.info) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Badge variant="secondary">Monero Node</Badge></CardTitle></CardHeader>
        <CardContent className="text-sm text-destructive">{data?.error || "Failed to fetch info"}</CardContent>
      </Card>
    )
  }

  const info = data.info
  const network = info.mainnet ? "mainnet" : info.testnet ? "testnet" : info.stagenet ? "stagenet" : "unknown"
  const synced = !info.synchronized || info.synchronized === true
  const uptimeSecs = Math.floor((Date.now() / 1000) - (info.start_time || 0))
  const days = Math.floor(uptimeSecs / 86400)
  const hours = Math.floor((uptimeSecs % 86400) / 3600)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Monero Node</Badge>
            <Badge variant={info.status === "OK" ? "success" : "destructive"}>
              {info.status === "OK" ? "Online" : info.status}
            </Badge>
            <Badge variant="outline">{network}</Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{url}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Height</div>
            <div className="font-mono">{info.height?.toLocaleString() ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Difficulty</div>
            <div className="font-mono">{formatDifficulty(info.difficulty)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Connections (in/out)</div>
            <div className="font-mono">{info.incoming_connections_count} / {info.outgoing_connections_count}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tx Pool</div>
            <div className="font-mono">{info.tx_pool_size}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Peers</div>
            <div className="font-mono">{info.white_peerlist_size}W / {info.grey_peerlist_size}G</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Uptime</div>
            <div className="font-mono">{days}d {hours}h</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground">Version</div>
            <div className="font-mono text-xs">{info.version || "—"}</div>
          </div>
        </div>

        {data.altBlocks?.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              <Badge variant="warning">Alt Blocks</Badge> ({data.altBlocks.length})
            </div>
            <div className="text-xs space-y-1 max-h-16 overflow-y-auto font-mono">
              {data.altBlocks.slice(0, 4).map((h: string) => (
                <div key={h} className="truncate">{h}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
