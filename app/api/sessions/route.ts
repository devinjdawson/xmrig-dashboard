import { NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { sessions as sessionsTable } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getAuthContext } from "@/lib/api-auth"

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await initDb()
  const rows = db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, ctx.user.id))
    .orderBy(desc(sessionsTable.createdAt))
    .all()

  return NextResponse.json(
    rows.map((row) => ({
      id: row.sessionToken,
      createdAt: row.createdAt,
      expires: row.expires,
      deviceHint: row.deviceHint,
      current: row.sessionToken === ctx.dbSession.sessionToken,
    }))
  )
}
