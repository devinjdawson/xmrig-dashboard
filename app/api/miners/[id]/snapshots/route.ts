import { db, minerSnapshots as snapshotsTable } from "@/lib/db"
import { eq, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const searchParams = req.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") ?? "50")

  const snapshots = await db
    .select()
    .from(snapshotsTable)
    .where(eq(snapshotsTable.minerId, id))
    .orderBy(desc(snapshotsTable.timestamp))
    .limit(limit)

  return NextResponse.json(snapshots)
}
