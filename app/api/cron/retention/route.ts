import { db, initDb, minerSnapshots as snapshotsTable } from "@/lib/db"
import { lt } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

await initDb()

export async function POST(req: NextRequest) {
  const cronSecret = process.env.XMRIG_CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const days = typeof body.days === "number" && body.days > 0 ? body.days : 30
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const deleted = await db.delete(snapshotsTable)
    .where(lt(snapshotsTable.timestamp, cutoff))
    .returning({ id: snapshotsTable.id })

  return NextResponse.json({
    deleted: deleted.length,
    cutoff: cutoff.toISOString(),
    retention_days: days,
  })
}
