import { NextRequest, NextResponse } from "next/server"

export interface P2PoolStats {
  pool_statistics: {
    hash_rate_15m: number
    miners: number
    total_hashes: number
    last_block_found_time: number
    last_block_found_height: number
    round_hashes: number
    sidechain_difficulty: string
  }
}

export interface P2PoolBlock {
  height: number
  hash: string
  timestamp: number
  miner: string
  reward: number
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 })
  }

  const baseUrl = url.replace(/\/$/, "")

  try {
    const [localRes, globalRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/pool/stats`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/pool/blocks`, { cache: "no-store" }),
    ])

    let stats = null
    let blocks: any[] = []

    if (localRes.status === "fulfilled" && localRes.value.ok) {
      stats = await localRes.value.json()
    }

    if (globalRes.status === "fulfilled" && globalRes.value.ok) {
      const rawBlocks = await globalRes.value.json()
      blocks = Array.isArray(rawBlocks) ? rawBlocks.slice(0, 20) : []
    }

    return NextResponse.json({ stats, blocks, error: null })
  } catch (e: any) {
    return NextResponse.json({ stats: null, blocks: [], error: e.message }, { status: 503 })
  }
}
