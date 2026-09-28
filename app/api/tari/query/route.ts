import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"

const HEX64 = /^[0-9a-fA-F]{64}$/
const DIGITS = /^\d{1,15}$/

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

  return NextResponse.json(
    { error: "Provide one of: height, time, utxo, block, or tx_nonce+tx_sig" },
    { status: 400 },
  )
}
