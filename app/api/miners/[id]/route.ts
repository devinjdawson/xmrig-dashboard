import { db, miners as minersTable, minerSnapshots as snapshotsTable } from "@/lib/db"
import { serializeMiner } from "@/lib/serialize-miner"
import { requireAuth, requireAdmin } from "@/lib/api-auth"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  const { id } = await params
  const row = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  return NextResponse.json(serializeMiner(row))
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  const existing = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const updates: Record<string, any> = { updatedAt: new Date() }
  if (body.name !== undefined) updates.name = body.name
  if (body.host !== undefined) updates.host = body.host
  if (body.port !== undefined) updates.port = body.port
  if (body.accessToken !== undefined) updates.accessToken = body.accessToken
  if (body.tags !== undefined) updates.tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : [])

  const updated = await db
    .update(minersTable)
    .set(updates)
    .where(eq(minersTable.id, id))
    .returning()
    .get()

  return NextResponse.json(serializeMiner(updated))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const { id } = await params
  const existing = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  await db.transaction(async (tx) => {
    await tx.delete(snapshotsTable).where(eq(snapshotsTable.minerId, id))
    await tx.delete(minersTable).where(eq(minersTable.id, id))
  })
  return NextResponse.json({ ok: true })
}