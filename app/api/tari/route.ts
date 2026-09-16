import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 })
  }

  try {
    const res = await fetch(`${url}/get_tip_info`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch" }, { status: 502 })
  }
}
