"use client"

import { useCallback, useEffect, useState } from "react"
import { WorkspaceShell } from "@/components/workspace-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { loadEndpoints } from "@/lib/network-endpoints"
import { formatXmr, timeAgo, formatUptime, formatNum, formatCount } from "@/lib/format"

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

  const synced = info ? Boolean(info.synchronized ?? info.synced) : false
  const netLabel = info?.mainnet ? "mainnet" : info?.testnet ? "testnet" : info?.stagenet ? "stagenet" : "—"
  const uptime = info?.start_time ? Math.floor(Date.now() / 1000 - info.start_time) : 0
  const syncProgress =
    info && info.target_height > info.height && info.target_height > 0
      ? ((info.height / info.target_height) * 100).toFixed(1)
      : "100"

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

      {info && !synced && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Sync progress</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${syncProgress}%` }} />
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
      </div>
    </WorkspaceShell>
  )
}
