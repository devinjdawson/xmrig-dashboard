import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { sessions as sessionsTable } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getAuthContext } from "@/lib/api-auth"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await initDb()

  const target = db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.sessionToken, id), eq(sessionsTable.userId, ctx.user.id)))
    .get()

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, id)).run()

  return NextResponse.json({ ok: true })
}
