import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"

const HEX64 = /^[0-9a-fA-F]{64}$/
const DIGITS = /^\d{1,15}$/
const HASH_LIST = /^[0-9a-fA-F]{64}(,[0-9a-fA-F]{64})*$/

async function tariRequest(baseUrl: string, path: string): Promise<{ data?: any; error?: string; status?: number }> {
  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
  } catch (e: any) {
    return { error: e?.message || "Failed to reach Tari node", status: 502 }
  }
  let body: any = null
  const text = await res.text()
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!res.ok) {
    const msg = body && typeof body === "object" && body.error ? String(body.error) : `HTTP ${res.status}`
    return { error: msg, status: res.status }
  }
  return { data: body }
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  const sp = req.nextUrl.searchParams
  const url = sp.get("url")
  if (!url) return NextResponse.json({ error: "url parameter required" }, { status: 400 })
  const base = url.replace(/\s+/g, "").replace(/\/$/, "")

  const height = sp.get("height")
  const time = sp.get("time")
  const utxo = sp.get("utxo")
  const block = sp.get("block")
  const txNonce = sp.get("tx_nonce")
  const txSig = sp.get("tx_sig")

  if (height != null) {
    if (!DIGITS.test(height)) return NextResponse.json({ error: "Invalid height" }, { status: 400 })
    const r = await tariRequest(base, `/get_header_by_height?height=${height}`)
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "header", data: r.data })
  }

  if (time != null) {
    if (!DIGITS.test(time)) return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 })
    const r = await tariRequest(base, `/get_height_at_time?time=${time}`)
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "height_at_time", data: r.data })
  }

  if (utxo != null) {
    if (!HEX64.test(utxo)) return NextResponse.json({ error: "Invalid UTXO hash (need 64 hex chars)" }, { status: 400 })
    const r = await tariRequest(base, `/fetch_utxo?utxo=${utxo}`)
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "utxo", data: r.data })
  }

  if (block != null) {
    if (!HEX64.test(block)) return NextResponse.json({ error: "Invalid block hash (need 64 hex chars)" }, { status: 400 })
    const r = await tariRequest(base, `/get_utxos_by_block?header_hash=${block}`)
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "block_utxos", data: r.data })
  }

  if (txNonce != null || txSig != null) {
    if (!txNonce || !txSig) {
      return NextResponse.json({ error: "Both tx_nonce and tx_sig are required" }, { status: 400 })
    }
    if (!HEX64.test(txNonce) || !HEX64.test(txSig)) {
      return NextResponse.json({ error: "Invalid excess signature parts (need 64 hex chars each)" }, { status: 400 })
    }
    const r = await tariRequest(base, `/transactions?excess_sig_nonce=${txNonce}&excess_sig_sig=${txSig}`)
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "transaction", data: r.data })
  }

  const mined = sp.get("mined")
  if (mined != null) {
    if (!HASH_LIST.test(mined) || mined.split(",").length > 50) {
      return NextResponse.json(
        { error: "mined must be 1-50 comma-separated 64-hex hashes" },
        { status: 400 },
      )
    }
    const version = sp.get("mined_version") ?? "1"
    if (version !== "1" && version !== "2") {
      return NextResponse.json({ error: "mined_version must be 1 or 2" }, { status: 400 })
    }
    const r = await tariRequest(base, `/get_utxos_mined_info?hashes=${mined}&version=${version}`)
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "mined_utxos", data: r.data })
  }

  const spent = sp.get("spent")
  const spentHeader = sp.get("spent_header")
  if (spent != null || spentHeader != null) {
    if (!spent || !spentHeader) {
      return NextResponse.json({ error: "Both spent and spent_header are required" }, { status: 400 })
    }
    if (!HASH_LIST.test(spent) || spent.split(",").length > 50) {
      return NextResponse.json(
        { error: "spent must be 1-50 comma-separated 64-hex hashes" },
        { status: 400 },
      )
    }
    if (!HEX64.test(spentHeader)) {
      return NextResponse.json({ error: "spent_header must be a 64-hex hash" }, { status: 400 })
    }
    const version = sp.get("spent_version") ?? "0"
    if (version !== "0" && version !== "1") {
      return NextResponse.json({ error: "spent_version must be 0 or 1" }, { status: 400 })
    }
    const r = await tariRequest(
      base,
      `/get_utxos_deleted_info?hashes=${spent}&must_include_header=${spentHeader}&version=${version}`,
    )
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "spent_utxos", data: r.data })
  }

  const commitment = sp.get("commitment")
  if (commitment != null) {
    if (!HEX64.test(commitment)) {
      return NextResponse.json({ error: "Invalid commitment (need 64 hex chars)" }, { status: 400 })
    }
    const r = await tariRequest(base, `/generate_burn_output_proof?commitment=${commitment}`)
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "burn_proof", data: r.data })
  }

  const syncStart = sp.get("sync_start")
  if (syncStart != null) {
    if (!HEX64.test(syncStart)) {
      return NextResponse.json({ error: "sync_start must be a 64-hex header hash" }, { status: 400 })
    }
    const limit = sp.get("sync_limit") ?? "25"
    const page = sp.get("sync_page") ?? "0"
    if (!/^\d{1,5}$/.test(limit) || Number(limit) < 1 || Number(limit) > 500) {
      return NextResponse.json({ error: "sync_limit must be 1-500" }, { status: 400 })
    }
    if (!/^\d{1,10}$/.test(page)) {
      return NextResponse.json({ error: "sync_page must be a non-negative integer" }, { status: 400 })
    }
    const r = await tariRequest(
      base,
      `/sync_utxos_by_block?start_header_hash=${syncStart}&limit=${limit}&page=${page}`,
    )
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 502 })
    return NextResponse.json({ mode: "sync_utxos", data: r.data })
  }

  return NextResponse.json(
    {
      error:
        "Provide one of: height, time, utxo, block, tx_nonce+tx_sig, mined, spent+spent_header, commitment, or sync_start",
    },
    { status: 400 },
  )
}
