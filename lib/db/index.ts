import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { miners, minerSnapshots, otpCodes } from "./schema"
import { dbPath } from "../data-dir"

const sqlite = new Database(dbPath)
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

export const db = drizzle(sqlite)

export async function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS miners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      access_token TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS miner_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      miner_id TEXT NOT NULL REFERENCES miners(id),
      summary TEXT,
      threads TEXT,
      config TEXT,
      error TEXT,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      used INTEGER NOT NULL DEFAULT 0
    )
  `)
  
  const minerCols = sqlite.prepare("PRAGMA table_info(miners)").all() as any[]
  const snapshotCols = sqlite.prepare("PRAGMA table_info(miner_snapshots)").all() as any[]
  
  const hasMinerTags = minerCols.some((c: any) => c.name === 'tags')
  if (!hasMinerTags) {
    sqlite.exec("ALTER TABLE miners ADD COLUMN tags TEXT")
  }
  
  const hasThreadsError = snapshotCols.some((c: any) => c.name === 'threads_error')
  const hasConfigError = snapshotCols.some((c: any) => c.name === 'config_error')
  if (!hasThreadsError) {
    sqlite.exec("ALTER TABLE miner_snapshots ADD COLUMN threads_error TEXT")
  }
  if (!hasConfigError) {
    sqlite.exec("ALTER TABLE miner_snapshots ADD COLUMN config_error TEXT")
  }
  
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_snapshot_miner ON miner_snapshots(miner_id)
  `)
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_snapshot_ts ON miner_snapshots(timestamp)
  `)
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email)
  `)
}

export { miners, minerSnapshots, otpCodes }