import type { Miner, XmrigConfig, XmrigSummary, XmrigThreadsResponse } from "./types"

const BASE = "/api/xmrig"

async function fetchMiner<T>(
  host: string,
  port: number,
  accessToken: string | null,
  endpoint: string,
): Promise<T> {
  const url = `http://${host}:${port}${endpoint}`
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }
  const res = await fetch(url, { headers, cache: "no-store" })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export async function getSummary(miner: Miner): Promise<XmrigSummary> {
  return fetchMiner<XmrigSummary>(miner.host, miner.port, miner.accessToken, "/1/summary")
}

export async function getThreads(miner: Miner): Promise<XmrigThreadsResponse> {
  return fetchMiner<XmrigThreadsResponse>(miner.host, miner.port, miner.accessToken, "/1/threads")
}

export async function getConfig(miner: Miner): Promise<XmrigConfig> {
  return fetchMiner<XmrigConfig>(miner.host, miner.port, miner.accessToken, "/1/config")
}

export async function putConfig(miner: Miner, config: XmrigConfig): Promise<void> {
  const url = `http://${miner.host}:${miner.port}/1/config`
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (miner.accessToken) {
    headers["Authorization"] = `Bearer ${miner.accessToken}`
  }
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(config),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
}

export function createMiner(id: string, name: string, host: string, port: number, accessToken?: string | null): Miner {
  return {
    id,
    name,
    host,
    port,
    accessToken: accessToken ?? null,
    lastSummary: null,
    lastThreads: null,
    lastConfig: null,
    error: null,
    lastUpdated: null,
  }
}