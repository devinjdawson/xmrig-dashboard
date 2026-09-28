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
import { Input } from "@/components/ui/input"

const LOOKUP_MODES = ["height", "time", "utxo", "block", "tx"] as const
type LookupMode = (typeof LOOKUP_MODES)[number]
const LOOKUP_LABELS: Record<LookupMode, string> = {
  height: "Block height",
  time: "Timestamp",
  utxo: "UTXO hash",
  block: "Block hash",
  tx: "Tx excess sig",
}
const LOOKUP_PLACEHOLDERS: Record<LookupMode, string> = {
  height: "e.g. 2000000",
  time: "Unix seconds, e.g. 1700000000",
  utxo: "64-hex output hash",
  block: "64-hex header hash",
  tx: "Public nonce (64-hex)",
}

function formatHugeNumber(n: number | string): string {
  const num = typeof n === "string" ? Number(n) : n
  if (!num || isNaN(num) || !isFinite(num)) return "—"
  if (num >= 1e36) return `${(num / 1e36).toFixed(2)}V`
  if (num >= 1e33) return `${(num / 1e33).toFixed(2)}Dc`
  if (num >= 1e30) return `${(num / 1e30).toFixed(2)}No`
  if (num >= 1e27) return `${(num / 1e27).toFixed(2)}Oc`
  if (num >= 1e24) return `${(num / 1e24).toFixed(2)}Sp`
  if (num >= 1e21) return `${(num / 1e21).toFixed(2)}Sx`
  if (num >= 1e18) return `${(num / 1e18).toFixed(2)}Qi`
  if (num >= 1e15) return `${(num / 1e15).toFixed(2)}Qa`
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toLocaleString()
}

function formatTari(tariAtomics: number | string | undefined | null): string {
  const num = typeof tariAtomics === "string" ? Number(tariAtomics) : tariAtomics
  if (num == null || isNaN(num) || !isFinite(num)) return "—"
  return (num / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 })
}

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
  const [wallet, setWallet] = useState<any>(null)
  const [walletConfigured, setWalletConfigured] = useState(false)
  const [lookupMode, setLookupMode] = useState<LookupMode>("height")
  const [lookupValue, setLookupValue] = useState("")
  const [lookupSig, setLookupSig] = useState("")
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupBusy, setLookupBusy] = useState(false)
  const [tariConfigured, setTariConfigured] = useState(false)

  const runLookup = useCallback(async () => {
    const ep = loadEndpoints()
    if (!ep.tariUrl || !lookupValue.trim()) return
    setLookupBusy(true)
    setLookupError(null)
    setLookupResult(null)
    try {
      const params = new URLSearchParams({ url: ep.tariUrl })
      const v = lookupValue.trim()
      if (lookupMode === "height") params.set("height", v)
      else if (lookupMode === "time") params.set("time", v)
      else if (lookupMode === "utxo") params.set("utxo", v)
      else if (lookupMode === "block") params.set("block", v)
      else {
        params.set("tx_nonce", v)
        params.set("tx_sig", lookupSig.trim())
      }
      const res = await fetch(`/api/tari/query?${params}`)
      const json = await res.json()
      if (!res.ok || json?.error) setLookupError(json?.error || `HTTP ${res.status}`)
      else setLookupResult(json)
    } catch (e: any) {
      setLookupError(e?.message || "Lookup failed")
    } finally {
      setLookupBusy(false)
    }
  }, [lookupMode, lookupValue, lookupSig])

  const load = useCallback(async () => {
    const ep = loadEndpoints()
    setWalletConfigured(Boolean(ep.tariWalletUrl))
    setTariConfigured(Boolean(ep.tariUrl))
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
    if (ep.tariWalletUrl) {
      try {
        const res = await fetch(`/api/tari/wallet?url=${encodeURIComponent(ep.tariWalletUrl)}`)
        const json = await res.json()
        setWallet(json?.state ? json : null)
      } catch {
        setWallet(null)
      }
    } else {
      setWallet(null)
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
  const feeBuckets = Array.isArray(data?.feeStats?.stats) ? data.feeStats.stats : []
  const peers = Array.isArray(data?.peers?.connected_peers) ? data.peers.connected_peers : []
  const headers = Array.isArray(data?.headers?.headers) ? data.headers.headers : []
  const version = data?.version || null
  const identity = data?.identity || null
  const updateInfo = data?.updateInfo || null
  const updateAvailable = updateInfo
    ? Boolean(updateInfo.update_available ?? updateInfo.available ?? updateInfo.is_update_available)
    : false
  const walletState = wallet?.state || null
  const walletVersion = wallet?.version || null
  const walletPeers = walletState?.connected_peers
  const walletPeerCount =
    typeof walletPeers === "number" ? walletPeers : Array.isArray(walletPeers) ? walletPeers.length : 0
  const walletSyncHeight = Number(walletState?.blocks_synced ?? 0)
  const walletTargetHeight = Number(walletState?.target_block_height ?? walletSyncHeight ?? 0)
  const walletSynced =
    walletTargetHeight > 0 && walletSyncHeight >= walletTargetHeight

  const synced = tip?.is_synced ?? false
  const peerCount = networkState?.num_peers ?? peers.length ?? 0

  return (
    <WorkspaceShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Tari Node</h1>
          {tip && <Badge variant={synced ? "success" : "warning"}>{synced ? "Synced" : "Syncing"}</Badge>}
          {version && <Badge variant="secondary">v{version.version ?? version}</Badge>}
          {updateAvailable && <Badge variant="warning">Update available</Badge>}
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

      {walletConfigured && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Tari Wallet</CardTitle>
            {wallet ? (
              <div className="flex items-center gap-2">
                <Badge variant={walletSynced ? "success" : "warning"}>
                  {walletSynced ? "Synced" : `${formatNum(walletSyncHeight)}/${formatNum(walletTargetHeight)}`}
                </Badge>
                <Badge variant="secondary">
                  v{walletVersion?.version ?? walletVersion ?? "—"}
                </Badge>
                <Badge variant="outline">{formatNum(walletPeerCount)} peers</Badge>
              </div>
            ) : (
              <Badge variant="destructive">Offline</Badge>
            )}
          </CardHeader>
          <CardContent>
            {wallet ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[11px] text-muted-foreground">Available</div>
                  <div className="text-2xl font-extrabold tabular-nums">
                    {formatTari(walletState?.available_balance)} <span className="text-sm font-bold">T</span>
                  </div>
                </div>
                <Stat label="Timelocked" value={`${formatTari(walletState?.timelocked_balance)} T`} />
                <Stat label="Pending Incoming" value={`${formatTari(walletState?.pending_incoming_balance)} T`} />
                <Stat label="Pending Outgoing" value={`${formatTari(walletState?.pending_outgoing_balance)} T`} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Wallet gateway unreachable at the configured URL. It is the Tari wallet's JSON-RPC HTTP gateway
                (the grpcurl interface, default port 18143).
              </p>
            )}
          </CardContent>
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
              <Stat label="Accumulated Difficulty" value={formatHugeNumber(meta.accumulated_difficulty ?? 0)} />
              <Stat label="Version" value={version?.version ?? version ?? "—"} mono />
              <div>
                <div className="text-[11px] text-muted-foreground">Sync Status</div>
                <div>
                  <Badge variant={synced ? "success" : "warning"}>{synced ? "Synced" : "Syncing"}</Badge>
                </div>
              </div>
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

        {feeBuckets.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Mempool Fee Stats</CardTitle>
              <Badge variant="secondary">per gram</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeBuckets.slice(0, 10).map((b: any, i: number) => (
                    <TableRow key={b.order ?? i}>
                      <TableCell className="tabular-nums">#{(b.order ?? i) + 1}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNum(Number(b.min_fee_per_gram ?? 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNum(Number(b.avg_fee_per_gram ?? 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNum(Number(b.max_fee_per_gram ?? 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-[11px] text-muted-foreground mt-2">
                Atomic units per gram (1 T = 1,000,000 atomic). Higher buckets are mined faster.
              </p>
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
      {tariConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chain Lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {LOOKUP_MODES.map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={lookupMode === m ? "default" : "outline"}
                  onClick={() => {
                    setLookupMode(m)
                    setLookupResult(null)
                    setLookupError(null)
                  }}
                >
                  {LOOKUP_LABELS[m]}
                </Button>
              ))}
            </div>
            <form
              className="flex gap-2 flex-col md:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                runLookup()
              }}
            >
              <Input
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                placeholder={LOOKUP_PLACEHOLDERS[lookupMode]}
                className="font-mono text-xs"
              />
              {lookupMode === "tx" && (
                <Input
                  value={lookupSig}
                  onChange={(e) => setLookupSig(e.target.value)}
                  placeholder="Signature (64-hex)"
                  className="font-mono text-xs"
                />
              )}
              <Button type="submit" size="sm" disabled={lookupBusy || !lookupValue.trim()}>
                {lookupBusy ? "Querying..." : "Query"}
              </Button>
            </form>

            {lookupError && <div className="text-sm text-destructive break-words">{lookupError}</div>}

            {lookupResult && (
              <div className="space-y-3">
                {typeof lookupResult.data === "number" ? (
                  <Stat label="Height at time" value={formatNum(lookupResult.data)} />
                ) : lookupResult.data && typeof lookupResult.data === "object" ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(lookupResult.data.height ?? lookupResult.data.mined_at_height) != null && (
                      <Stat label="Height" value={formatNum(Number(lookupResult.data.height ?? lookupResult.data.mined_at_height))} />
                    )}
                    {lookupResult.data.hash != null && <Stat label="Hash" value={String(lookupResult.data.hash).slice(0, 24)} mono />}
                    {lookupResult.data.timestamp != null && <Stat label="Age" value={timeAgo(Number(lookupResult.data.timestamp))} />}
                    {lookupResult.data.difficulty != null && (
                      <Stat label="Difficulty" value={formatCount(Number(lookupResult.data.difficulty))} />
                    )}
                    {lookupResult.data.confirmations != null && (
                      <Stat label="Confirmations" value={formatNum(Number(lookupResult.data.confirmations))} />
                    )}
                    {lookupResult.data.prev_hash != null && <Stat label="Prev Hash" value={String(lookupResult.data.prev_hash).slice(0, 24)} mono />}
                  </div>
                ) : null}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Raw JSON</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] whitespace-pre-wrap break-all">
                    {JSON.stringify(lookupResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  )
}
