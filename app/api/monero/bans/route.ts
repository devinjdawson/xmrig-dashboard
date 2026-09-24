import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, requireAuth } from "@/lib/api-auth"

interface BanEntry {
  host: string
  ban: boolean
  seconds: number
}

// monerod's JSON-RPC set_bans accepts "host" as A.B.C.D or an integer ip.
// We restrict to IPv4/IPv6 text hosts; the daemon validates reachability of the format.
const HOST_RE = /^[0-9a-fA-F:.]{1,64}$/

function parseRpcAuth(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user") || process.env.MONERO_RPC_USER || ""
  const pass = req.nextUrl.searchParams.get("pass") || process.env.MONERO_RPC_PASS || ""
  if (!user) return undefined
  return { user, pass }
}

function cleanUrl(raw: string): string | null {
  const url = (raw || "").replace(/\s+/g, "").replace(/\/$/, "")
  return url || null
}

async function moneroRpc(url: string, method: string, params: any, auth?: { user: string; pass: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth) {
    headers["Authorization"] = "Basic " + Buffer.from(`${auth.user}:${auth.pass}`).toString("base64")
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${url}/json_rpc`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: "xmrig-dashboard", method, params }),
      cache: "no-store",
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`monerod HTTP ${res.status}`)
    const json = await res.json()
    if (json.error) throw new Error(json.error.message || `RPC error ${json.error.code}`)
    return json.result
  } finally {
    clearTimeout(timer)
  }
}

export async function GET(req: NextRequest) {
  // Read-only bans need an authenticated viewer (any role); mutations are admin-only.
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  const url = cleanUrl(req.nextUrl.searchParams.get("url") || process.env.MONERO_RPC_URL || "")
  if (!url) return NextResponse.json({ error: "url parameter required" }, { status: 400 })

  try {
    const result = await moneroRpc(url, "get_bans", {}, parseRpcAuth(req))
    return NextResponse.json({ bans: Array.isArray(result?.bans) ? result.bans : [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const url = cleanUrl(req.nextUrl.searchParams.get("url") || process.env.MONERO_RPC_URL || "")
  if (!url) return NextResponse.json({ error: "url parameter required" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const action = body?.action
  const host = typeof body?.host === "string" ? body.host.trim() : ""

  if (!HOST_RE.test(host)) {
    return NextResponse.json({ error: "Invalid host (expected an IP address)" }, { status: 400 })
  }
  if (action !== "ban" && action !== "unban") {
    return NextResponse.json({ error: "action must be 'ban' or 'unban'" }, { status: 400 })
  }

  let seconds = Number(body?.seconds ?? 0)
  if (action === "ban") {
    if (!Number.isFinite(seconds) || seconds < 1 || seconds > 86400 * 7) {
      return NextResponse.json({ error: "seconds must be between 1 and 604800" }, { status: 400 })
    }
  } else {
    seconds = 0
  }

  try {
    await moneroRpc(url, "set_bans", { bans: [{ host, ban: action === "ban", seconds }] }, parseRpcAuth(req))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}
