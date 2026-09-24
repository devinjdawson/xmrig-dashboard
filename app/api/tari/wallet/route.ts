import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"

async function tariFetch(baseUrl: string, path: string): Promise<any> {
  const res = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 })
  }

  const base = url.replace(/\s+/g, "").replace(/\/$/, "")

  try {
    const [version, connectivity, state] = await Promise.allSettled([
      tariFetch(base, "/get_version"),
      tariFetch(base, "/check_connectivity"),
      tariFetch(base, "/get_state"),
    ])

    const firstError =
      state.status === "rejected"
        ? state.reason?.message || "Failed to reach Tari wallet"
        : null

    return NextResponse.json({
      version: version.status === "fulfilled" ? version.value : null,
      connectivity: connectivity.status === "fulfilled" ? connectivity.value : null,
      state: state.status === "fulfilled" ? state.value : null,
      error: firstError,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch" }, { status: 502 })
  }
}
