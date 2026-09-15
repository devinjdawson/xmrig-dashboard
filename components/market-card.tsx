"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, DollarSign, Bitcoin } from "lucide-react"

interface HistoricalPoint {
  ts: number
  price: number
}

interface MarketSnapshot {
  price: {
    usd: number
    btc: number
    usd_24h_change: number
    btc_24h_change: number
    usd_market_cap: number
    ts: number
  } | null
  network: {
    difficulty: string
    height: number
    target: number
    tx_pool_size: number
    incoming_connections: number
    outgoing_connections: number
    block_size_limit: number
    ts: number
  } | null
  history: HistoricalPoint[]
  priceError: string | null
  networkError: string | null
  historyError: string | null
  profitability: {
    hashrate: number
    xmrPerDay: number
    usdPerDay: number
    xmrPerMonth: number
    usdPerMonth: number
    networkHashrate: number
  } | null
  generatedAt: number
}

interface MarketCardProps {
  moneroUrl?: string
  moneroUser?: string
  moneroPass?: string
  initialHashrate?: number
}

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toPrecision(4)}`
}

function formatBtc(n: number): string {
  if (n >= 0.01) return `${n.toFixed(4)} BTC`
  return `${n.toPrecision(4)} BTC`
}

function formatHashrate(h: number): string {
  if (!h) return "0 H/s"
  if (h >= 1e12) return `${(h / 1e12).toFixed(2)} TH/s`
  if (h >= 1e9) return `${(h / 1e9).toFixed(2)} GH/s`
  if (h >= 1e6) return `${(h / 1e6).toFixed(2)} MH/s`
  if (h >= 1e3) return `${(h / 1e3).toFixed(2)} KH/s`
  return `${h.toFixed(2)} H/s`
}

function formatDifficulty(d: string): string {
  const n = parseFloat(d)
  if (!n) return "—"
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}G`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString()
}

function formatPercent(p: number): string {
  const sign = p >= 0 ? "+" : ""
  return `${sign}${p.toFixed(2)}%`
}

function formatXmr(x: number): string {
  if (x === 0) return "0 XMR"
  if (x < 0.001) return `${(x * 1000).toFixed(4)} mXMR`
  return `${x.toFixed(4)} XMR`
}

function Sparkline({ points, color }: { points: HistoricalPoint[]; color: string }) {
  if (!points || points.length < 2) {
    return <div className="h-16 w-full flex items-center justify-center text-xs text-muted-foreground">No history</div>
  }
  const width = 300
  const height = 64
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const stepX = width / (points.length - 1)
  const path = points
    .map((p, i) => {
      const x = i * stepX
      const y = height - ((p.price - min) / range) * height
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" strokeOpacity="0.1" />
    </svg>
  )
}

export function MarketCard({ moneroUrl, moneroUser, moneroPass, initialHashrate = 0 }: MarketCardProps) {
  const [data, setData] = useState<MarketSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [hashrateInput, setHashrateInput] = useState<string>(String(initialHashrate))
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (moneroUrl) params.set("moneroUrl", moneroUrl)
      if (moneroUser) params.set("user", moneroUser)
      if (moneroPass) params.set("pass", moneroPass)
      const h = parseFloat(hashrateInput) || 0
      if (h > 0) params.set("hashrate", String(h))
      const res = await fetch(`/api/market?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [moneroUrl, moneroUser, moneroPass, hashrateInput])

  if (loading && !data) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bitcoin className="h-4 w-4" />
            <Badge variant="secondary">Monero Market</Badge>
            <Badge variant="outline">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-6 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !data?.price) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bitcoin className="h-4 w-4" />
            <Badge variant="secondary">Monero Market</Badge>
            <Badge variant="destructive">Error</Badge>
            <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="font-mono text-xs">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const price = data?.price
  const network = data?.network
  const history = data?.history ?? []
  const trendColor = (price?.usd_24h_change ?? 0) >= 0 ? "#16a34a" : "#dc2626"

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-4 w-4" />
            <span>Monero Market</span>
            {price && <Badge variant={price.usd_24h_change >= 0 ? "success" : "destructive"}>{formatPercent(price.usd_24h_change)}</Badge>}
            {data?.priceError && <Badge variant="destructive">price failed</Badge>}
            {data?.networkError && <Badge variant="destructive">network failed</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {data?.generatedAt && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(data.generatedAt).toLocaleTimeString()}
              </span>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={load} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> USD Price
            </div>
            <div className="text-2xl font-extrabold tabular-nums tracking-tight">
              {price ? formatPrice(price.usd) : "—"}
            </div>
            <div className={`text-xs font-medium ${price?.usd_24h_change && price.usd_24h_change >= 0 ? "text-green-500" : "text-red-500"}`}>
              {price ? formatPercent(price.usd_24h_change) : "—"}
              {price?.usd_24h_change && price.usd_24h_change >= 0
                ? <TrendingUp className="inline h-3 w-3 ml-1" />
                : <TrendingDown className="inline h-3 w-3 ml-1" />}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">BTC Price</div>
            <div className="text-2xl font-extrabold tabular-nums tracking-tight">
              {price ? formatBtc(price.btc) : "—"}
            </div>
            <div className={`text-xs ${price?.btc_24h_change && price.btc_24h_change >= 0 ? "text-green-500" : "text-red-500"}`}>
              {price ? formatPercent(price.btc_24h_change) : "—"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Block Height</div>
            <div className="text-2xl font-extrabold tabular-nums tracking-tight">{network?.height.toLocaleString() ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {network ? `${network.outgoing_connections}↓ ${network.incoming_connections}↑` : "—"} peers
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Difficulty</div>
            <div className="text-2xl font-extrabold tabular-nums tracking-tight">{network ? formatDifficulty(network.difficulty) : "—"}</div>
            <div className="text-xs text-muted-foreground">
              {network?.tx_pool_size ? `${network.tx_pool_size} in mempool` : "— mempool"}
            </div>
          </div>
        </div>

        {history.length > 1 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-1 text-xs text-muted-foreground">
              <span>7D Price Chart</span>
              <span className="font-mono">
                ${Math.min(...history.map((h) => h.price)).toFixed(2)} – ${Math.max(...history.map((h) => h.price)).toFixed(2)}
              </span>
            </div>
            <Sparkline points={history} color={trendColor} />
          </div>
        )}

        <div className="border-t pt-3">
          <div className="text-xs text-muted-foreground mb-2">Profitability Calculator</div>
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Your Hashrate (H/s)</Label>
              <Input
                type="number"
                value={hashrateInput}
                onChange={(e) => setHashrateInput(e.target.value)}
                placeholder="e.g. 1500"
                className="h-8 text-sm"
              />
            </div>
            {data?.profitability ? (
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Daily</div>
                  <div className="font-mono font-medium">{formatXmr(data.profitability.xmrPerDay)}</div>
                  <div className="text-muted-foreground">{formatPrice(data.profitability.usdPerDay)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Monthly</div>
                  <div className="font-mono font-medium">{formatXmr(data.profitability.xmrPerMonth)}</div>
                  <div className="text-muted-foreground">{formatPrice(data.profitability.usdPerMonth)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Network</div>
                  <div className="font-mono font-medium">{formatHashrate(data.profitability.networkHashrate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Your Share</div>
                  <div className="font-mono font-medium">
                    {((data.profitability.hashrate / data.profitability.networkHashrate) * 100).toPrecision(3)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-xs text-muted-foreground italic">
                Enter your total hashrate above to see estimated daily/monthly earnings.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
