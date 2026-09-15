import { db, initDb, miners as minersTable } from "@/lib/db"
import { serializeMiner } from "@/lib/serialize-miner"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

await initDb()

export async function GET() {
  const rows = await db.select().from(minersTable).orderBy(minersTable.createdAt)
  return NextResponse.json(rows.map(serializeMiner))
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.host || !body.port) {
    return NextResponse.json({ error: "host and port required" }, { status: 400 })
  }

  const id = `miner-${Date.now()}`
  const tags = Array.isArray(body.tags) ? body.tags : []

  await db.insert(minersTable).values({
    id,
    name: body.name || `Miner ${id.slice(-4)}`,
    host: body.host,
    port: body.port,
    accessToken: body.accessToken ?? null,
    tags: JSON.stringify(tags),
  })

  const row = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  return NextResponse.json(serializeMiner(row), { status: 201 })
}