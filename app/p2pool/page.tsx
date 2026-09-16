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
import { formatHashrate, formatXmr, timeAgo, formatUptime, formatNum, formatCount } from "@/lib/format"

interface WorkerRow {
  addr: string
  uptime: number
  diff: number
  autodiff: number
  user: string
}

function parseWorker(s: string): WorkerRow | null {
  const p = s.split(",")
  if (p.length < 5) return null
  return {
    addr: p[0],
    uptime: Number(p[1]),
    diff: Number(p[2]),
    autodiff: Number(p[3]),
    user: p[4],
  }
}

function Stat({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  )
}

export default function P2PoolDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const ep = loadEndpoints()
      const qs = ep.p2poolUrl ? `?url=${encodeURIComponent(ep.p2poolUrl)}` : ""
      const res = await fetch(`/api/p2pool${qs}`)
      const json = await res.json()
      if (json?.stats || json?.stratum) {
        setData(json)
        setError(json.error || null)
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

  const poolStats = data?.stats?.pool_statistics || null
  const stratum = data?.stratum || null
  const network = data?.network || null
  const p2p = data?.p2p || null
  const config = data?.config || null
  const blocks: any[] = Array.isArray(data?.blocks) ? data.blocks : []
  const workers = ((stratum?.workers ?? []) as string[])
    .map(parseWorker)
    .filter((w): w is WorkerRow => w !== null)

  return (
    <WorkspaceShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">P2Pool</h1>
          {data?.source && (
            <Badge variant="secondary">{data.source === "local" ? "Data Files" : "HTTP API"}</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {error && !data && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-destructive whitespace-pre-wrap break-words">{String(error).slice(0, 1000)}</div>
            <p className="text-xs text-muted-foreground mt-3">
              Set P2POOL_API_DIR on the server (P2Pool started with --data-api) or configure the P2Pool API URL in
              Network Settings.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !data && !error && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No P2Pool data configured. Open Network Settings to add a P2Pool API URL.
          </CardContent>
        </Card>
      )}

      {poolStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pool Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[11px] text-muted-foreground">Pool Hashrate</div>
                <div className="text-2xl font-extrabold tabular-nums">{formatHashrate(poolStats.hashRate ?? 0)}</div>
              </div>
              <Stat label="Miners" value={formatNum(poolStats.miners ?? 0)} />
              <Stat label="Sidechain Height" value={formatNum(poolStats.sidechainHeight ?? 0)} />
              <Stat label="Sidechain Difficulty" value={formatCount(poolStats.sidechainDifficulty ?? 0)} />
              <Stat label="Total Blocks Found" value={formatNum(poolStats.totalBlocksFound ?? 0)} />
              <Stat label="Last Block Height" value={formatNum(poolStats.lastBlockFound ?? 0)} />
              <Stat label="Last Block Found" value={timeAgo(poolStats.lastBlockFoundTime ?? 0)} />
              <Stat label="PPLNS Window" value={formatNum(poolStats.pplnsWindowSize ?? 0)} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {stratum && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Local Stratum</CardTitle>
              <Badge variant="success">{formatNum(stratum.connections ?? 0)} conn</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Hashrate 15m" value={formatHashrate(stratum.hashrate_15m ?? 0)} />
                <Stat label="Hashrate 1h" value={formatHashrate(stratum.hashrate_1h ?? 0)} />
                <Stat label="Hashrate 24h" value={formatHashrate(stratum.hashrate_24h ?? 0)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Shares Found" value={formatNum(stratum.shares_found ?? 0)} />
                <Stat label="Shares Failed" value={formatNum(stratum.shares_failed ?? 0)} />
                <Stat label="Total Stratum Shares" value={formatNum(stratum.total_stratum_shares ?? 0)} />
                <Stat label="Avg Effort" value={`${((stratum.average_effort ?? 0) * 100).toFixed(1)}%`} />
                <Stat label="Current Effort" value={`${((stratum.current_effort ?? 0) * 100).toFixed(1)}%`} />
                <Stat label="Block Reward Share" value={`${(stratum.block_reward_share_percent ?? 0).toFixed(2)}%`} />
              </div>
              <div className="text-xs text-muted-foreground">
                Wallet: <span className="font-mono break-all">{stratum.wallet ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {p2p && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">P2P Status</CardTitle>
              <Badge variant="secondary">{formatUptime(p2p.uptime ?? 0)} uptime</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Connections" value={formatNum(p2p.connections ?? 0)} />
                <Stat label="Incoming" value={formatNum(p2p.incoming_connections ?? 0)} />
                <Stat label="Peer List Size" value={formatNum(p2p.peer_list_size ?? 0)} />
                <Stat label="ZMQ Last Active" value={timeAgo(p2p.zmq_last_active ?? 0)} />
              </div>
            </CardContent>
          </Card>
        )}

        {network && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monero Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Height" value={formatNum(network.height ?? 0)} />
                <Stat label="Difficulty" value={formatCount(network.difficulty ?? 0)} />
                <Stat label="Block Reward" value={formatXmr(network.reward ?? 0)} />
                <Stat label="Tip Age" value={timeAgo(network.timestamp ?? 0)} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Tip: <span className="font-mono break-all">{network.hash ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pool Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Pool Fee" value={`${config.fee ?? 0}%`} />
                <Stat label="Min Payment" value={formatXmr(config.minPaymentThreshold ?? 0)} />
              </div>
              {Array.isArray(config.ports) && config.ports.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {config.ports.map((p: any) => (
                    <Badge key={p.port} variant="outline">
                      :{p.port}
                      {p.tls ? " (TLS)" : ""}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {workers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Connected Workers</CardTitle>
            <Badge variant="secondary">{workers.length}</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead className="text-right">Difficulty</TableHead>
                  <TableHead className="text-right">Auto Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((w, i) => (
                  <TableRow key={`${w.addr}-${i}`}>
                    <TableCell className="font-mono text-xs">{w.user}</TableCell>
                    <TableCell className="font-mono text-xs">{w.addr}</TableCell>
                    <TableCell className="tabular-nums">{formatUptime(w.uptime)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNum(w.diff)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatHashrate(w.autodiff)}/s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {blocks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Recent Blocks</CardTitle>
            <Badge variant="secondary">{blocks.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {blocks.slice(0, 20).map((b: any, i: number) => (
                <div key={i} className="font-mono text-xs break-all text-muted-foreground">
                  {typeof b === "string" ? b : JSON.stringify(b)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  )
}
