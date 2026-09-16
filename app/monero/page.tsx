"use client"

import { useCallback, useEffect, useState } from "react"
import { WorkspaceShell } from "@/components/workspace-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { loadEndpoints } from "@/lib/network-endpoints"
import { formatXmr, timeAgo, formatUptime, formatNum, formatCount } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function Stat({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${mono ? "font-mono break-all" : ""}`}>{value}</div>
    </div>
  )
}

export default function MoneroDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const ep = loadEndpoints()
    if (!ep.moneroUrl) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ url: ep.moneroUrl })
      if (ep.moneroUser) params.set("user", ep.moneroUser)
      if (ep.moneroPass) params.set("pass", ep.moneroPass)
      const res = await fetch(`/api/monero?${params}`)
      const json = await res.json()
      if (json?.info) {
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

  const info = data?.info || null
  const fee = data?.feeEstimate || null
  const altBlocks = Array.isArray(data?.altBlocks) ? data.altBlocks : []
  const syncInfo = data?.syncInfo || null
  const lastBlock = data?.lastBlock?.block_header || null
  const hardFork = data?.hardFork || null
  const conns = Array.isArray(data?.connections?.connections) ? data.connections.connections : []

  const synced = info ? Boolean(info.synchronized ?? info.synced) : false
  const netLabel = info?.mainnet ? "mainnet" : info?.testnet ? "testnet" : info?.stagenet ? "stagenet" : "—"
  const uptime = info?.start_time ? Math.floor(Date.now() / 1000 - info.start_time) : 0
  const syncHeight = syncInfo?.height ?? info?.height ?? 0
  const targetHeight = syncInfo?.target_height ?? info?.target_height ?? 0
  const isSyncing = targetHeight > syncHeight && targetHeight > 0
  const syncPct = targetHeight > 0 ? Math.min(100, (syncHeight / targetHeight) * 100) : 100

  return (
    <WorkspaceShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Monero Node</h1>
          {info && <Badge variant={synced ? "success" : "warning"}>{synced ? "Synced" : "Syncing"}</Badge>}
          {info && <Badge variant="secondary">{netLabel}</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {!loading && !info && !error && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No Monero node configured. Open Network Settings to add a node RPC URL.
          </CardContent>
        </Card>
      )}

      {error && !info && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive break-words">{error}</CardContent>
        </Card>
      )}

      {info && isSyncing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Sync progress</span>
              <span>{syncPct.toFixed(2)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${syncPct}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-mono tabular-nums">
              {formatNum(syncHeight)} / {formatNum(targetHeight)}
            </div>
          </CardContent>
        </Card>
      )}

      {info && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chain Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[11px] text-muted-foreground">Height</div>
                <div className="text-2xl font-extrabold tabular-nums">{formatNum(info.height ?? 0)}</div>
              </div>
              <Stat label="Difficulty" value={formatCount(Number(info.difficulty ?? 0))} />
              <Stat label="Target Height" value={formatNum(info.target_height ?? info.height ?? 0)} />
              <Stat label="Block Target" value={`${info.target ?? 0}s`} />
              <Stat label="Status" value={info.status ?? "—"}/>
              <Stat label="Version" value={info.version ?? "—"} mono />
              <Stat label="Node Uptime" value={formatUptime(uptime)} />
              <Stat label="Adjusted Time" value={timeAgo(info.adjusted_time ?? 0)} />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Top Block: <span className="font-mono break-all">{info.top_block_hash ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {info && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Outgoing" value={formatNum(info.outgoing_connections_count ?? 0)} />
                <Stat label="Incoming" value={formatNum(info.incoming_connections_count ?? 0)} />
                <Stat label="White Peerlist" value={formatNum(info.white_peerlist_size ?? 0)} />
                <Stat label="Grey Peerlist" value={formatNum(info.grey_peerlist_size ?? 0)} />
              </div>
            </CardContent>
          </Card>
        )}

        {info && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Transactions & Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Tx Pool Size" value={formatNum(info.tx_pool_size ?? 0)} />
                <Stat label="Total Tx Count" value={formatNum(info.tx_count ?? 0)} />
                <Stat label="Alt Blocks" value={formatNum(altBlocks.length)} />
                <Stat label="Cumulative Difficulty" value={formatCount(Number(info.cumulative_difficulty ?? 0))} />
                <Stat label="Block Weight Limit" value={formatNum(info.block_weight_limit ?? 0)} />
                <Stat label="Block Weight Median" value={formatNum(info.block_weight_median ?? 0)} />
              </div>
            </CardContent>
          </Card>
        )}

        {fee && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Fee Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Fee / kB" value={formatXmr(fee.fee_per_kb ?? 0)} />
                <Stat label="Fee / byte" value={fee.fee_per_byte != null ? formatNum(fee.fee_per_byte) : "—"} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Untrusted: {String(fee.untrusted ?? false)}
              </p>
            </CardContent>
          </Card>
        )}

        {hardFork && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Hard Fork</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Version" value={hardFork.version ?? "—"} />
                <Stat
                  label="Enabled"
                  value={
                    <Badge variant={hardFork.enabled ? "success" : "secondary"}>
                      {hardFork.enabled ? "Yes" : "No"}
                    </Badge>
                  }
                />
                <Stat label="State" value={hardFork.state ?? "—"} />
                <Stat label="Earliest Height" value={formatNum(hardFork.earliest_height ?? 0)} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {lastBlock && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Last Block</CardTitle>
            <Badge variant="secondary">#{formatNum(lastBlock.height ?? 0)}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Reward" value={formatXmr(lastBlock.reward ?? 0)} />
              <Stat label="Difficulty" value={formatCount(Number(lastBlock.difficulty ?? 0))} />
              <Stat label="Age" value={timeAgo(lastBlock.timestamp ?? 0)} />
              <Stat label="Transactions" value={formatNum(lastBlock.num_txes ?? 0)} />
              <Stat
                label="Size / Weight"
                value={`${formatNum(lastBlock.block_size ?? 0)} / ${formatNum(lastBlock.block_weight ?? 0)}`}
              />
              <Stat label="PoW Hash" value={lastBlock.pow_hash ?? "—"} mono />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Hash: <span className="font-mono break-all">{lastBlock.hash ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {conns.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Peer Connections</CardTitle>
            <Badge variant="secondary">{conns.length}</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Port</TableHead>
                  <TableHead className="text-right">Height</TableHead>
                  <TableHead className="text-right">Live</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conns.slice(0, 12).map((c: any, i: number) => (
                  <TableRow key={c.peer_id ?? i}>
                    <TableCell>
                      <Badge variant={c.incoming ? "secondary" : "outline"}>
                        {c.incoming ? "IN" : "OUT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.ip || c.host || c.address || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.port ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNum(c.height ?? 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUptime(c.live_time ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {altBlocks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Alt Blocks</CardTitle>
            <Badge variant="warning">{altBlocks.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {altBlocks.slice(0, 10).map((h: string) => (
                <div key={h} className="font-mono text-xs break-all text-muted-foreground">
                  {h}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  )
}
