import type { Miner } from "@/lib/xmrig/types"

export function parseTags(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean)
    }
  }
  return []
}

export function serializeMiner(row: any): Miner {
  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    accessToken: row.accessToken ?? row.access_token ?? null,
    tags: parseTags(row.tags),
    lastSummary: null,
    lastThreads: null,
    lastConfig: null,
    error: null,
    threadsError: null,
    configError: null,
    lastUpdated: null,
  }
}
