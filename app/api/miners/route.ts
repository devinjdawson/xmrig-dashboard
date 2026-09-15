import { db, initDb, miners as minersTable } from "@/lib/db"
import { createMiner } from "@/lib/xmrig/api"
import type { Miner } from "@/lib/xmrig/types"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

await initDb()

export async function GET() {
  const rows = await db.select().from(minersTable).orderBy(minersTable.createdAt)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.host || !body.port) {
    return NextResponse.json({ error: "host and port required" }, { status: 400 })
  }

  const id = `miner-${Date.now()}`
  const miner = createMiner(
    id,
    body.name || `Miner ${id.slice(-4)}`,
    body.host,
    body.port,
    body.accessToken ?? null,
  )

  await db.insert(minersTable).values({
    id: miner.id,
    name: miner.name,
    host: miner.host,
    port: miner.port,
    accessToken: miner.accessToken,
  })

  return NextResponse.json(miner, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const existing = await db.select().from(minersTable).where(eq(minersTable.id, body.id)).get()
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
    .where(eq(minersTable.id, body.id))
    .returning()
    .get()

  return NextResponse.json(updated)
}