import { db, miners as minersTable, minerSnapshots as snapshotsTable } from "@/lib/db"
import { getSummary, getThreads, getConfig } from "@/lib/xmrig/api"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const minerRow = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!minerRow) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const miner: any = {
    id: minerRow.id,
    name: minerRow.name,
    host: minerRow.host,
    port: minerRow.port,
    accessToken: minerRow.accessToken,
  }

  let summary = null
  let threads = null
  let config = null
  let error = null

  try {
    summary = await getSummary(miner)
  } catch (e: any) {
    error = e.message
  }

  try {
    threads = await getThreads(miner)
  } catch {
    // threads optional
  }

  try {
    config = await getConfig(miner)
  } catch {
    // config optional
  }

  await db.insert(snapshotsTable).values({
    minerId: id,
    summary: summary ? JSON.stringify(summary) : null,
    threads: threads ? JSON.stringify(threads) : null,
    config: config ? JSON.stringify(config) : null,
    error,
  })

  await db.update(minersTable)
    .set({ updatedAt: new Date() })
    .where(eq(minersTable.id, id))

  return NextResponse.json({ summary, threads, config, error })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const minerRow = await db.select().from(minersTable).where(eq(minersTable.id, id)).get()
  if (!minerRow) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const miner: any = {
    id: minerRow.id,
    name: minerRow.name,
    host: minerRow.host,
    port: minerRow.port,
    accessToken: minerRow.accessToken,
  }

  try {
    const summary = await getSummary(miner)
    return NextResponse.json({ ok: true, summary })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 503 })
  }
}