import { db, minerSnapshots as snapshotsTable } from "@/lib/db"
import { miners as minersTable } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"
import { eq, desc, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { parse as parseJson } from "@/lib/safe-json"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  const { id } = await params

  const snapshots = await db
    .select({
      summary: snapshotsTable.summary,
      timestamp: snapshotsTable.timestamp,
    })
    .from(snapshotsTable)
    .where(eq(snapshotsTable.minerId, id))
    .orderBy(desc(snapshotsTable.timestamp))
    .limit(1000)

  let bestHash = 0
  let totalHashes = 0
  let firstHashTime: number | null = null
  let highestUptime = 0
  let totalBlocks = 0

  for (const snap of snapshots) {
    const summary = parseJson<any>(snap.summary)
    if (!summary) continue

    const hr = summary?.hashrate?.total?.[0] ?? 0
    const highest = summary?.hashrate?.highest ?? 0
    const total = summary?.results?.hashes_total ?? 0
    const ts = snap.timestamp

    if (hr > bestHash) bestHash = hr
    if (highest > bestHash) bestHash = highest
    if (total > totalHashes) totalHashes = total
    if (summary?.connection?.uptime > highestUptime) {
      highestUptime = summary.connection.uptime
    }
    if (ts && (!firstHashTime || (ts as any) < firstHashTime)) {
      firstHashTime = typeof ts === "number" ? ts : new Date(ts).getTime()
    }
  }

  return NextResponse.json({
    blocks: totalBlocks,
    firstHashTime,
    bestHash,
    totalHashes,
    highestUptime,
  })
}
