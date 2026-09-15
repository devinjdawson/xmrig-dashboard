import { NextRequest, NextResponse } from "next/server"

interface MoneroInfo {
  height: number
  difficulty: string
  target: number
  target_height: number
  tx_pool_size: number
  tx_count: number
  incoming_connections_count: number
  outgoing_connections_count: number
  white_peerlist_size: number
  grey_peerlist_size: number
  mainnet: boolean
  testnet: boolean
  stagenet: boolean
  top_block_hash: string
  cumulative_difficulty: string
  block_size_limit: number
  block_weight_limit: number
  block_size_median: number
  block_weight_median: number
  adjusted_time: number
  start_time: number
  version: string
  status: "OK" | string
}

interface MoneroBlockHeader {
  height: number
  hash: string
  timestamp: number
  difficulty: number
  reward: number
  nonce: number
  miner_tx_hash: string
}

async function rpc(
  url: string,
  method: string,
  params: any = {},
  auth?: { user: string; pass: string },
): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth) {
    headers["Authorization"] = "Basic " + Buffer.from(`${auth.user}:${auth.pass}`).toString("base64")
  }
  const res = await fetch(`${url}/json_rpc`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: "kilo", method, params }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || "RPC error")
  return json.result
}

async function rpcRaw(
  url: string,
  method: string,
  body: any = {},
  auth?: { user: string; pass: string },
): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth) {
    headers["Authorization"] = "Basic " + Buffer.from(`${auth.user}:${auth.pass}`).toString("base64")
  }
  const res = await fetch(`${url}/${method}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  const user = req.nextUrl.searchParams.get("user") || undefined
  const pass = req.nextUrl.searchParams.get("pass") || undefined
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

  const cleanedUrl = url.replace(/\s+/g, "").replace(/\/$/, "")
  const auth = user ? { user, pass: pass || "" } : undefined

  try {
    const [info, feeEstimate, altBlocks] = await Promise.allSettled([
      rpc(cleanedUrl, "get_info", {}, auth),
      rpcRaw(cleanedUrl, "get_fee_estimate", {}, auth),
      rpcRaw(cleanedUrl, "get_alt_blocks_hashes", {}, auth).then((r) => r.blks_hashes || []),
    ])

    const result: any = {
      info: info.status === "fulfilled" ? info.value : null,
      feeEstimate: feeEstimate.status === "fulfilled" ? feeEstimate.value : null,
      altBlocks: altBlocks.status === "fulfilled" ? altBlocks.value : [],
      error: info.status === "rejected" ? info.reason?.message : null,
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ info: null, error: e.message }, { status: 503 })
  }
}
