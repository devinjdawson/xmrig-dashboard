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

function formatXMR(atomic: number | string): string {
  const num = typeof atomic === "string" ? parseFloat(atomic) : atomic
  if (!num) return "0"
  return `${(num / 1e12).toFixed(4)} XMR`
}

function timeAgo(ts: number): string {
  const secs = Math.floor(Date.now() / 1000) - ts
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
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
  const uptimeSecs = Math.floor((Date.now() / 1000) - (info.start_time || 0))
  const days = Math.floor(uptimeSecs / 86400)
  const hours = Math.floor((uptimeSecs % 86400) / 3600)

  const syncHeight = data.syncInfo?.height ?? info.height
  const targetHeight = data.syncInfo?.target_height ?? 0
  const isSyncing = targetHeight > 0 && syncHeight < targetHeight
  const syncPct = targetHeight > 0 ? Math.min(100, (syncHeight / targetHeight) * 100) : 100

  const lastBlock = data.lastBlock?.block_header
  const hardFork = data.hardFork
  const conns = data.connections?.connections

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

        {isSyncing && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Sync Progress</span>
              <span>{syncPct.toFixed(2)}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${syncPct}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {syncHeight.toLocaleString()} / {targetHeight.toLocaleString()}
            </div>
          </div>
        )}

        {lastBlock && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Last Block</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Height</div>
                <div className="font-mono">{lastBlock.height?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reward</div>
                <div className="font-mono">{formatXMR(lastBlock.reward)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Difficulty</div>
                <div className="font-mono">{formatDifficulty(lastBlock.difficulty)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Age</div>
                <div className="font-mono">{lastBlock.timestamp ? timeAgo(lastBlock.timestamp) : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Size / Weight</div>
                <div className="font-mono">{((lastBlock.block_size || 0) / 1024).toFixed(1)}KB / {((lastBlock.block_weight || 0) / 1024).toFixed(1)}KB</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Hash</div>
                <div className="font-mono text-xs truncate">{lastBlock.hash || "—"}</div>
              </div>
            </div>
          </div>
        )}

        {hardFork && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Hard Fork</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Version</div>
                <div className="font-mono">{hardFork.version ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Enabled</div>
                <div className="font-mono">
                  <Badge variant={hardFork.enabled ? "success" : "secondary"}>
                    {hardFork.enabled ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">State</div>
                <div className="font-mono">{hardFork.state ?? "—"}</div>
              </div>
            </div>
          </div>
        )}

        {Array.isArray(conns) && conns.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2 font-medium">
              Connections ({conns.length})
            </div>
            <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
              {conns.slice(0, 8).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2 font-mono">
                  <Badge variant={c.incoming ? "outline" : "secondary"} className="text-[10px]">
                    {c.incoming ? "IN" : "OUT"}
                  </Badge>
                  <span className="truncate">{c.ip || c.address || c.host || "unknown"}</span>
                  <span className="text-muted-foreground ml-auto">{c.port}{c.rpc_port ? ` (rpc:${c.rpc_port})` : ""}</span>
                </div>
              ))}
              {conns.length > 8 && (
                <div className="text-muted-foreground text-center">+{conns.length - 8} more</div>
              )}
            </div>
          </div>
        )}

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
