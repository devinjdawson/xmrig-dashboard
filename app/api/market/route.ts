import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"

interface PriceData {
  usd: number
  btc: number
  usd_24h_change: number
  btc_24h_change: number
  usd_market_cap: number
  ts: number
}

interface NetworkData {
  difficulty: string
  height: number
  target: number
  tx_pool_size: number
  incoming_connections: number
  outgoing_connections: number
  block_size_limit: number
  ts: number
}

interface HistoricalPoint {
  ts: number
  price: number
}

interface MarketSnapshot {
  price: PriceData | null
  network: NetworkData | null
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

const BLOCK_TARGET_SECONDS = 120
const DAYS = 7

async function rpcCall(moneroUrl: string, user: string, pass: string, method: string, params: any = {}): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (user) headers["Authorization"] = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
  const res = await fetch(`${moneroUrl.replace(/\/$/, "")}/json_rpc`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: "xmrig-dashboard", method, params }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || "RPC error")
  return json.result
}

const PUBLIC_MONEROD_ENDPOINTS = [
  "https://xmr-node.cakewallet.com:18081",
  "https://node.xmr.to:18081",
  "https://monerod.xmr-tw.org:18089",
]

async function fetchNetwork(userMoneroUrl: string, user: string, pass: string): Promise<NetworkData> {
  const urls = [userMoneroUrl, ...PUBLIC_MONEROD_ENDPOINTS].filter(Boolean)

  for (const url of urls) {
    try {
      const info = await rpcCall(url, user, pass, "get_info")
      return {
        difficulty: String(info.difficulty ?? 0),
        height: info.height ?? 0,
        target: info.target ?? BLOCK_TARGET_SECONDS,
        tx_pool_size: info.tx_pool_size ?? 0,
        incoming_connections: info.incoming_connections_count ?? 0,
        outgoing_connections: info.outgoing_connections_count ?? 0,
        block_size_limit: info.block_size_limit ?? 0,
        ts: Date.now(),
      }
    } catch (e: any) {
      if (url === userMoneroUrl) continue
    }
  }
  throw new Error("All Monerod endpoints failed")
}

async function fetchPrice(): Promise<PriceData> {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd,btc&include_24hr_change=true&include_market_cap=true"
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "XMRig-Dashboard/1.0" },
  })
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`)
  const json = await res.json()
  const m = json.monero
  if (!m) throw new Error("No Monero data in response")
  return {
    usd: m.usd ?? 0,
    btc: m.btc ?? 0,
    usd_24h_change: m.usd_24h_change ?? 0,
    btc_24h_change: m.btc_24h_change ?? 0,
    usd_market_cap: m.usd_market_cap ?? 0,
    ts: Date.now(),
  }
}

async function fetchHistory(): Promise<HistoricalPoint[]> {
  const url = `https://api.coingecko.com/api/v3/coins/monero/market_chart?vs_currency=usd&days=${DAYS}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "XMRig-Dashboard/1.0" },
  })
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`)
  const json = await res.json()
  const prices: [number, number][] = json.prices ?? []
  // Downsample to ~50 points for the chart
  const step = Math.max(1, Math.floor(prices.length / 50))
  const out: HistoricalPoint[] = []
  for (let i = 0; i < prices.length; i += step) {
    out.push({ ts: prices[i][0], price: prices[i][1] })
  }
  if (prices.length > 0) {
    const last = prices[prices.length - 1]
    if (!out.length || out[out.length - 1].ts !== last[0]) {
      out.push({ ts: last[0], price: last[1] })
    }
  }
  return out
}

function computeProfitability(hashrate: number, network: NetworkData, price: PriceData, blockRewardXmr = 0.6): MarketSnapshot["profitability"] {
  if (!hashrate || !network.difficulty) return null
  const networkDifficulty = parseFloat(network.difficulty)
  const targetSeconds = network.target || BLOCK_TARGET_SECONDS
  const networkHashrate = networkDifficulty / targetSeconds

  const blocksPerDay = (86400 / targetSeconds)
  const xmrPerDay = (hashrate / networkHashrate) * blocksPerDay * blockRewardXmr
  return {
    hashrate,
    xmrPerDay,
    usdPerDay: xmrPerDay * price.usd,
    xmrPerMonth: xmrPerDay * 30,
    usdPerMonth: xmrPerDay * 30 * price.usd,
    networkHashrate,
  }
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  const moneroUrl = req.nextUrl.searchParams.get("moneroUrl") ?? ""
  const user = req.nextUrl.searchParams.get("user") ?? ""
  const pass = req.nextUrl.searchParams.get("pass") ?? ""
  const hashrate = parseFloat(req.nextUrl.searchParams.get("hashrate") ?? "0") || 0

  const [priceRes, networkRes, historyRes] = await Promise.allSettled([
    fetchPrice(),
    fetchNetwork(moneroUrl, user, pass),
    fetchHistory(),
  ])

  const price = priceRes.status === "fulfilled" ? priceRes.value : null
  const network = networkRes.status === "fulfilled" ? networkRes.value : null
  const history = historyRes.status === "fulfilled" ? historyRes.value : []

  const snapshot: MarketSnapshot = {
    price,
    network,
    history,
    priceError: priceRes.status === "rejected" ? (priceRes.reason?.message || "Failed") : null,
    networkError: networkRes.status === "rejected" ? (networkRes.reason?.message || "Failed") : null,
    historyError: historyRes.status === "rejected" ? (historyRes.reason?.message || "Failed") : null,
    profitability:
      price && network && hashrate > 0
        ? computeProfitability(hashrate, network, price)
        : null,
    generatedAt: Date.now(),
  }

  return NextResponse.json(snapshot)
}
