import { db, initDb, miners as minersTable, minerSnapshots as snapshotsTable } from "@/lib/db"
import { getSummary, getConfig } from "@/lib/xmrig/api"
import { serializeMiner } from "@/lib/serialize-miner"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

await initDb()

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const expectedToken = "Bearer " + (process.env.XMRIG_CRON_SECRET || "change-me")
  
  if (auth !== expectedToken && process.env.XMRIG_CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const rows = await db.select().from(minersTable)
  const results = []

  for (const row of rows) {
    const miner = serializeMiner(row)
    let summary = null
    let threads = null
    let config = null
    let error = null

    try {
      summary = await getSummary(miner)
      // Extract threads from summary (hashrate.threads array)
      if (summary?.hashrate?.threads) {
        threads = { threads: summary.hashrate.threads.map((h: any, i: number) => ({
          cpu: i,
          hashrate: h
        }))}
      }
    } catch (e: any) {
      error = e.message
    }

    try {
      config = await getConfig(miner)
    } catch (e: any) {
      // config may be restricted
    }

    await db.insert(snapshotsTable).values({
      minerId: row.id,
      summary: summary ? JSON.stringify(summary) : null,
      threads: threads ? JSON.stringify(threads) : null,
      config: config ? JSON.stringify(config) : null,
      error,
    })

    await db.update(minersTable)
      .set({ updatedAt: new Date() })
      .where(eq(minersTable.id, row.id))

    results.push({
      id: row.id,
      name: row.name,
      ok: summary !== null,
      error,
    })
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    miners: results.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  })
}
