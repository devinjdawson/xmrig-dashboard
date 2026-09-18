import { db, initDb, miners as minersTable, minerSnapshots as snapshotsTable } from "@/lib/db"
import { parseTags } from "@/lib/serialize-miner"
import { requireAuth, requireAdmin } from "@/lib/api-auth"
import { eq, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import type { Miner } from "@/lib/xmrig/types"

await initDb()

export async function GET() {
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized

  const rows = await db.select().from(minersTable).orderBy(minersTable.createdAt)

  const miners: Miner[] = await Promise.all(
    rows.map(async (row): Promise<Miner> => {
      const latestSnapshot = await db
        .select()
        .from(snapshotsTable)
        .where(eq(snapshotsTable.minerId, row.id))
        .orderBy(desc(snapshotsTable.timestamp))
        .limit(1)
        .get()

      let lastSummary = null
      let lastThreads = null
      let lastConfig = null
      let error = null
      let threadsError = null
      let configError = null
      let lastUpdated = null

      if (latestSnapshot) {
        try { lastSummary = latestSnapshot.summary ? JSON.parse(latestSnapshot.summary as string) : null } catch {}
        try { lastThreads = latestSnapshot.threads ? JSON.parse(latestSnapshot.threads as string) : null } catch {}
        try { lastConfig = latestSnapshot.config ? JSON.parse(latestSnapshot.config as string) : null } catch {}
        error = latestSnapshot.error ?? null
        threadsError = latestSnapshot.threadsError ?? null
        configError = latestSnapshot.configError ?? null
        lastUpdated = latestSnapshot.timestamp instanceof Date ? latestSnapshot.timestamp.getTime() : latestSnapshot.timestamp
      }

      return {
        id: row.id,
        name: row.name,
        host: row.host,
        port: row.port,
        accessToken: row.accessToken ?? null,
        tags: parseTags(row.tags),
        lastSummary,
        lastThreads,
        lastConfig,
        error,
        threadsError,
        configError,
        lastUpdated,
      }
    })
  )

  return NextResponse.json(miners)
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

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
  if (!row) {
    return NextResponse.json({ error: "failed to create miner" }, { status: 500 })
  }
  return NextResponse.json({
    ...row,
    tags: parseTags(row.tags),
    lastSummary: null,
    lastThreads: null,
    lastConfig: null,
    error: null,
    threadsError: null,
    configError: null,
    lastUpdated: null,
  }, { status: 201 })
}
