import { NextRequest, NextResponse } from "next/server"

async function tariFetch(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<any> {
  const res = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json" },
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 })
  }

  const base = url.replace(/\s+/g, "").replace(/\/$/, "")

  try {
    const [tipInfo, version, syncInfo, networkState, mempoolStats, peers, headers, identity] =
      await Promise.allSettled([
        tariFetch(base, "/get_tip_info"),
        tariFetch(base, "/get_version"),
        tariFetch(base, "/get_sync_info"),
        tariFetch(base, "/get_network_state"),
        tariFetch(base, "/get_mempool_stats"),
        tariFetch(base, "/list_connected_peers"),
        tariFetch(base, "/list_headers", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ num_headers: 10, sorting: "SORTING_DESC" }),
        }),
        tariFetch(base, "/get_identify"),
      ])

    const result: any = {
      tipInfo: tipInfo.status === "fulfilled" ? tipInfo.value : null,
      version: version.status === "fulfilled" ? version.value : null,
      syncInfo: syncInfo.status === "fulfilled" ? syncInfo.value : null,
      networkState: networkState.status === "fulfilled" ? networkState.value : null,
      mempoolStats: mempoolStats.status === "fulfilled" ? mempoolStats.value : null,
      peers: peers.status === "fulfilled" ? peers.value : null,
      headers: headers.status === "fulfilled" ? headers.value : null,
      identity: identity.status === "fulfilled" ? identity.value : null,
      error:
        tipInfo.status === "rejected"
          ? tipInfo.reason?.message || "Failed to reach Tari node"
          : null,
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch" }, { status: 502 })
  }
}
