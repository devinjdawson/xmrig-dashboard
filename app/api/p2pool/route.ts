import { NextRequest, NextResponse } from "next/server"

export interface P2PoolStats {
  pool_statistics: {
    hash_rate_15m: number
    miners: number
    total_hashes: number
    last_block_found_time: number
    last_block_found_height: number
    round_hashes: number
    sidechain_difficulty: string
  }
}

export interface P2PoolBlock {
  height: number
  hash: string
  timestamp: number
  miner: string
  reward: number
}

interface DiagnosticResult {
  url: string
  status: number | null
  ok: boolean
  error: string | null
  responseSnippet: string | null
  timing: number
}

async function tryEndpoint(url: string): Promise<DiagnosticResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "XMRig-Dashboard/1.0"
      }
    })
    
    clearTimeout(timeoutId)
    const timing = Date.now() - start
    
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      return {
        url,
        status: res.status,
        ok: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        responseSnippet: text?.slice(0, 200) || null,
        timing
      }
    }
    
    const text = await res.text()
    const trimmed = text.trim()
    
    // Sentinel response from Stratum ports that tolerate HTTP: a fixed greeting,
    // returned identically for every path. Not a real API.
    if (trimmed === "P2Pool Stratum online" ||
        trimmed === "P2Pool Stratum online." ||
        /stratum\s+online/i.test(trimmed)) {
      return {
        url,
        status: res.status,
        ok: false,
        error: "This port is the Stratum (mining) service, not the HTTP API. P2Pool needs --api-address 0.0.0.0 --api-port <PORT> to expose the HTTP API on the network.",
        responseSnippet: trimmed.slice(0, 200),
        timing
      }
    }
    
    try {
      JSON.parse(text)
      return {
        url,
        status: res.status,
        ok: true,
        error: null,
        responseSnippet: text.slice(0, 500),
        timing
      }
    } catch (e: any) {
      return {
        url,
        status: res.status,
        ok: false,
        error: `Response is not valid JSON (got ${text.length} chars; started with "${trimmed.slice(0, 80)}")`,
        responseSnippet: text.slice(0, 200),
        timing
      }
    }
  } catch (e: any) {
    const timing = Date.now() - start
    let error = e.message || "Unknown error"
    const code = e.cause?.code || e.code || ""
    if (e.name === "AbortError") {
      error = "Request timed out after 10 seconds"
    } else if (code === "UND_ERR_SOCKET" || error.includes("ECONNRESET")) {
      error = "Connection reset — this port speaks raw Stratum (mining) protocol, not HTTP. Use the --api-port from P2Pool's startup, not the Stratum port."
    } else if (code === "ECONNREFUSED" || error.includes("ECONNREFUSED")) {
      error = "Connection refused — nothing listening on this port"
    } else if (code === "ENOTFOUND" || error.includes("ENOTFOUND")) {
      error = "DNS lookup failed — hostname not found"
    } else if (code === "UND_ERR_CONNECT_TIMEOUT" || error.includes("timeout")) {
      error = "Connection timed out — port filtered or unreachable"
    } else if (error.includes("fetch failed") || error.includes("network")) {
      error = `Network error (${code || "unknown code"}) — cannot reach the server from dashboard host`
    }
    return {
      url,
      status: null,
      ok: false,
      error,
      responseSnippet: null,
      timing
    }
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  const testOnly = req.nextUrl.searchParams.get("test") === "true"
  
  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 })
  }

  const baseUrl = url.replace(/\s+/g, "").replace(/\/$/, "")
  
  if (!baseUrl) {
    return NextResponse.json({ error: "empty url after cleaning" }, { status: 400 })
  }
  
  // P2Pool API endpoint patterns (with --local-api flag)
  const statsEndpoints = [
    `${baseUrl}/local/stratum`,      // Primary: stratum stats with hashrate, shares, workers
    `${baseUrl}/pool/stats`,          // Pool-level aggregated stats
    `${baseUrl}/stats_mod`,           // Modified stats with config
    `${baseUrl}/api/pool/stats`,
    `${baseUrl}/local/stats`,
  ]
  
  const blocksEndpoints = [
    `${baseUrl}/local/blocks`,
    `${baseUrl}/api/pool/blocks`,
    `${baseUrl}/pool/blocks`,
    `${baseUrl}/blocks`,
  ]
  
  const networkEndpoints = [
    `${baseUrl}/network/stats`,       // Network difficulty, height, reward
  ]
  
  const p2pEndpoints = [
    `${baseUrl}/local/p2p`,           // P2P connections, peers, uptime
  ]
  
  const diagnostics: DiagnosticResult[] = []
  
  // Test stats endpoints
  for (const endpoint of statsEndpoints) {
    const result = await tryEndpoint(endpoint)
    diagnostics.push(result)
    if (result.ok) break
  }
  
  // Test blocks endpoints
  for (const endpoint of blocksEndpoints) {
    const result = await tryEndpoint(endpoint)
    diagnostics.push(result)
    if (result.ok) break
  }
  
  // Test network endpoints
  for (const endpoint of networkEndpoints) {
    const result = await tryEndpoint(endpoint)
    diagnostics.push(result)
    if (result.ok) break
  }
  
  // Test p2p endpoints
  for (const endpoint of p2pEndpoints) {
    const result = await tryEndpoint(endpoint)
    diagnostics.push(result)
    if (result.ok) break
  }
  
  if (testOnly) {
    return NextResponse.json({
      diagnostics,
      baseUrl,
      timestamp: new Date().toISOString()
    })
  }
  
  // Extract stats from working endpoint
  const statsResult = diagnostics.find(d => statsEndpoints.includes(d.url) && d.ok)
  let stats = null
  if (statsResult?.responseSnippet) {
    try {
      const parsed = JSON.parse(statsResult.responseSnippet)
      // Handle different response formats:
      // - /local/stratum returns flat object with hashrate_15m, workers, etc.
      // - /pool/stats returns { pool_statistics: {...} }
      // - /stats_mod returns { config, network, pool }
      if (parsed.pool_statistics) {
        stats = parsed
      } else if (parsed.hashrate_15m !== undefined || parsed.workers) {
        // Stratum format - wrap for consistency
        stats = { pool_statistics: parsed }
      } else if (parsed.pool?.stats) {
        // stats_mod format
        stats = { pool_statistics: parsed.pool.stats, config: parsed.config, network: parsed.network }
      } else {
        stats = { pool_statistics: parsed }
      }
    } catch (e: any) {
      return NextResponse.json({
        stats: null,
        blocks: [],
        network: null,
        p2p: null,
        error: `Failed to parse stats: ${e.message}`,
        diagnostics
      }, { status: 500 })
    }
  }
  
  // Extract network stats
  const networkResult = diagnostics.find(d => networkEndpoints.includes(d.url) && d.ok)
  let network = null
  if (networkResult?.responseSnippet) {
    try {
      network = JSON.parse(networkResult.responseSnippet)
    } catch (e: any) {
      console.warn("Failed to parse network stats:", e.message)
    }
  }
  
  // Extract P2P stats
  const p2pResult = diagnostics.find(d => p2pEndpoints.includes(d.url) && d.ok)
  let p2p = null
  if (p2pResult?.responseSnippet) {
    try {
      p2p = JSON.parse(p2pResult.responseSnippet)
    } catch (e: any) {
      console.warn("Failed to parse p2p stats:", e.message)
    }
  }
  
  // Extract blocks
  const blocksResult = diagnostics.find(d => blocksEndpoints.includes(d.url))
  let blocks: any[] = []
  if (blocksResult?.ok && blocksResult.responseSnippet) {
    try {
      const parsed = JSON.parse(blocksResult.responseSnippet)
      blocks = Array.isArray(parsed) ? parsed.slice(0, 20) : []
    } catch (e: any) {
      console.warn("Failed to parse blocks:", e.message)
    }
  }
  
  if (!stats) {
    const allErrors = diagnostics.map(d => `${d.url}: ${d.error}`).join("\n")
    return NextResponse.json({
      stats: null,
      blocks: [],
      network: null,
      p2p: null,
      error: `No working P2Pool endpoint found.\n\nTried:\n${allErrors}`,
      diagnostics
    }, { status: 503 })
  }
  
  return NextResponse.json({ stats, blocks, network, p2p, error: null, diagnostics })
}
