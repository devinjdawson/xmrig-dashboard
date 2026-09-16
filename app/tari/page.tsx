"use client"

import { useCallback, useEffect, useState } from "react"
import { WorkspaceShell } from "@/components/workspace-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RefreshCw } from "lucide-react"
import { loadEndpoints } from "@/lib/network-endpoints"
import { timeAgo, formatUptime, formatNum, formatCount } from "@/lib/format"

function Stat({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${mono ? "font-mono break-all" : ""}`}>{value}</div>
    </div>
  )
}

export default function TariDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const ep = loadEndpoints()
    if (!ep.tariUrl) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/tari?url=${encodeURIComponent(ep.tariUrl)}`)
      const json = await res.json()
      if (json?.tipInfo) {
        setData(json)
        setError(null)
      } else {
        setData(null)
        setError(json?.error || `HTTP ${res.status}`)
      }
    } catch (e: any) {
      setData(null)
      setError(e?.message || "Failed to fetch")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [load])

  const tip = data?.tipInfo || null
  const meta = tip?.metadata || {}
  const syncInfo = data?.syncInfo || null
  const networkState = data?.networkState || null
  const mempool = data?.mempoolStats || null
  const peers = Array.isArray(data?.peers?.connected_peers) ? data.peers.connected_peers : []
  const headers = Array.isArray(data?.headers?.headers) ? data.headers.headers : []
  const version = data?.version || null
  const identity = data?.identity || null

  const synced = tip?.is_synced ?? false
  const peerCount = networkState?.num_peers ?? peers.length ?? 0

  return (
    <WorkspaceShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Tari Node</h1>
          {tip && <Badge variant={synced ? "success" : "warning"}>{synced ? "Synced" : "Syncing"}</Badge>}
          {version && <Badge variant="secondary">v{version.version ?? version}</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {!loading && !tip && !error && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No Tari node configured. Open Network Settings to add a Tari base node HTTP API URL.
          </CardContent>
        </Card>
      )}

      {error && !tip && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive break-words">{error}</CardContent>
        </Card>
      )}

      {!synced && syncInfo && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground mb-2">Sync Status</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Tip Height" value={formatNum(Number(syncInfo.tip_height ?? meta.best_block_height ?? 0))} />
              <Stat label="Local Height" value={formatNum(Number(syncInfo.local_height ?? 0))} />
              <Stat label="Sync State" value={syncInfo.state ?? syncInfo.sync_state ?? "—"} />
              <Stat
                label="Progress"
                value={
                  syncInfo.tip_height && syncInfo.local_height
                    ? `${((Number(syncInfo.local_height) / Number(syncInfo.tip_height)) * 100).toFixed(1)}%`
                    : "—"
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {tip && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chain Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[11px] text-muted-foreground">Block Height</div>
                <div className="text-2xl font-extrabold tabular-nums">{formatNum(Number(meta.best_block_height ?? 0))}</div>
              </div>
              <Stat label="Accumulated Difficulty" value={formatCount(Number(meta.accumulated_difficulty ?? 0))} />
              <Stat label="Synced" value={synced ? "Yes" : "No"} />
              <Stat label="Version" value={version?.version ?? version ?? "—"} mono />
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>Tip Hash: <span className="font-mono break-all">{meta.best_block_hash ?? tip.tip_hash ?? "—"}</span></div>
              {identity && (
                <div>Node ID: <span className="font-mono break-all">{identity.public_key ?? identity.node_id ?? "—"}</span></div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {networkState && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Network State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Peers" value={formatNum(networkState.num_peers ?? peerCount)} />
                <Stat label="Connections" value={formatNum(networkState.num_connections ?? 0)} />
                <Stat label="Network Difficulty" value={formatCount(Number(networkState.network_difficulty ?? 0))} />
                <Stat label="Estimated Hash Rate" value={formatCount(Number(networkState.estimated_hash_rate ?? 0))} />
              </div>
            </CardContent>
          </Card>
        )}

        {mempool && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Mempool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Unconfirmed Txs" value={formatNum(mempool.unconfirmed_txs ?? mempool.unconfirmed_transactions ?? 0)} />
                <Stat label="Unconfirmed Weight" value={formatNum(mempool.unconfirmed_weight ?? 0)} />
                <Stat label="Reorg Txs" value={formatNum(mempool.reorg_txs ?? 0)} />
                <Stat label="Orphan Txs" value={formatNum(mempool.orphan_txs ?? 0)} />
              </div>
            </CardContent>
          </Card>
        )}

        {!networkState && !mempool && tip && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Peer Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <Stat label="Connected Peers" value={formatNum(peerCount)} />
            </CardContent>
          </Card>
        )}
      </div>

      {peers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Connected Peers</CardTitle>
            <Badge variant="secondary">{peers.length}</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Features</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peers.slice(0, 20).map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">
                      {Array.isArray(p.addresses) ? p.addresses[0] : p.address ?? p.net_address ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">{p.user_agent ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {p.features != null ? String(p.features) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {headers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Recent Headers</CardTitle>
            <Badge variant="secondary">{headers.length}</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Height</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((h: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="tabular-nums">{formatNum(h.height ?? h.header?.height ?? 0)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {(h.hash ?? h.header?.hash ?? "—").slice(0, 16)}...
                    </TableCell>
                    <TableCell className="text-xs">
                      {h.timestamp ?? h.header?.timestamp
                        ? timeAgo(Number(h.timestamp ?? h.header?.timestamp))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCount(Number(h.difficulty ?? h.header?.difficulty ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  )
}
