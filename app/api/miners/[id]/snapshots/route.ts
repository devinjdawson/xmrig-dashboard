import { db, initDb, minerSnapshots as snapshotsTable } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"
import { eq, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

await initDb()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  try {
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}