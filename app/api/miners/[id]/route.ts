import { db, miners as minersTable } from "@/lib/db"
import { createMiner } from "@/lib/xmrig/api"
import type { Miner } from "@/lib/xmrig/types"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const row = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  return NextResponse.json(row)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  const existing = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const updated = await db
    .update(minersTable)
    .set({
      name: body.name ?? existing.name,
      host: body.host ?? existing.host,
      port: body.port ?? existing.port,
      accessToken: body.accessToken ?? existing.accessToken,
      updatedAt: new Date(),
    })
    .where(eq(minersTable.id, id))
    .returning()
    .get()

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const existing = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  await db.delete(minersTable).where(eq(minersTable.id, id))
  return NextResponse.json({ ok: true })
}