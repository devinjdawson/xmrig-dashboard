"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface P2PoolCardProps {
  url: string
  enabled: boolean
}

interface DiagnosticResult {
  url: string
  status: number | null
  ok: boolean
  error: string | null
  responseSnippet: string | null
  timing: number
}

interface P2PoolData {
  stats: any
  blocks: any[]
  network: any
  p2p: any
  error: string | null
  diagnostics?: DiagnosticResult[]
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
  const [data, setData] = useState<P2PoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  useEffect(() => {
    if (!enabled || !url) {
      setLoading(false)
      return
    }
    let active = true

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/p2pool?url=${encodeURIComponent(url)}`)
        const json = await res.json()
        if (active) setData(json)
      } catch (e: any) {
        if (active) setData({
          stats: null,
          blocks: [],
          network: null,
          p2p: null,
          error: e.message || "Failed to fetch statistics",
          diagnostics: []
        })
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 60000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [url, enabled])

  const handleTest = async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch(`/api/p2pool?url=${encodeURIComponent(url)}&test=true`)
      const json = await res.json()
      setData({
        stats: null,
        blocks: [],
        network: null,
        p2p: null,
        error: json.error || null,
        diagnostics: json.diagnostics || []
      })
      setShowDiagnostics(true)
    } catch (e: any) {
      setData({
        stats: null,
        blocks: [],
        network: null,
        p2p: null,
        error: e.message || "Test failed",
        diagnostics: []
      })
    } finally {
      setLoading(false)
    }
  }

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
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="secondary">P2Pool</Badge>
            <Badge variant="outline">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data?.error || !data?.stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="secondary">P2Pool</Badge>
            <Badge variant="destructive">Error</Badge>
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant="outline" onClick={handleTest} disabled={loading}>
                Test
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setLoading(true)
                  fetch(`/api/p2pool?url=${encodeURIComponent(url)}`)
                    .then(r => r.json())
                    .then(d => setData(d))
                    .finally(() => setLoading(false))
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="font-mono text-xs whitespace-pre-wrap">{data?.error || "Failed to fetch stats"}</div>
          </div>

          {data?.diagnostics && data.diagnostics.length > 0 && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
              >
                {showDiagnostics ? "Hide" : "Show"} connection diagnostics
              </Button>
              {showDiagnostics && (
                <div className="mt-2 space-y-2 border rounded p-3 bg-muted/30">
                  {data.diagnostics.map((diag, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant={diag.ok ? "success" : "destructive"}>
                          {diag.status ? `${diag.status}` : "FAIL"}
                        </Badge>
                        <span className="font-mono truncate">{diag.url}</span>
                        <span className="text-muted-foreground ml-auto">{diag.timing}ms</span>
                      </div>
                      {diag.error && (
                        <div className="text-xs text-destructive ml-8">{diag.error}</div>
                      )}
                      {diag.responseSnippet && (
                        <pre className="text-[10px] bg-background p-2 rounded overflow-x-auto max-h-24 ml-8">{diag.responseSnippet}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!data?.diagnostics?.length && (
            <Button size="sm" variant="outline" onClick={handleTest} className="w-full">
              Run connection test
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const s = data.stats.pool_statistics || {}
  const net = data.network || {}
  const p2p = data.p2p || {}
  const workers = Array.isArray(s.workers) ? s.workers : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">P2Pool</Badge>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{url}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setLoading(true)
                fetch(`/api/p2pool?url=${encodeURIComponent(url)}`)
                  .then(r => r.json())
                  .then(d => setData(d))
                  .finally(() => setLoading(false))
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Pool Hashrate</div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums">{formatHashrate(s.hashRate ?? s.hash_rate_15m)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Miners</div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums">{s.miners ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Sidechain Diff</div>
            <div className="text-lg font-bold tracking-tight tabular-nums">{s.sidechainDifficulty ? Number(s.sidechainDifficulty).toLocaleString() : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Network Height</div>
            <div className="text-lg font-bold tracking-tight tabular-nums">{net.height?.toLocaleString() ?? "—"}</div>
          </div>
        </div>

        {(s.hashrate_15m || s.average_effort || workers.length > 0) && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Stratum</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">15m Hashrate</div>
                <div className="text-xl font-bold tracking-tight tabular-nums">{formatHashrate(s.hashrate_15m)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg Effort</div>
                <div className="text-xl font-bold tracking-tight tabular-nums">{s.average_effort?.toFixed(1) ?? "—"}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Workers</div>
                <div className="text-xl font-bold tracking-tight tabular-nums">{workers.length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Shares</div>
                <div className="font-mono">
                  {s.shares_found ?? 0} / {s.total_stratum_shares ?? 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {p2p.connections != null && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2 font-medium">P2P Network</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Connections</div>
                <div className="font-mono">{p2p.connections}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Peer List</div>
                <div className="font-mono">{p2p.peer_list_size ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="font-mono">
                  {p2p.uptime ? `${Math.floor(p2p.uptime / 60)}m` : "—"}
                </div>
              </div>
            </div>
          </div>
        )}

        {data.blocks?.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2">Recent Blocks ({data.blocks.length})</div>
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