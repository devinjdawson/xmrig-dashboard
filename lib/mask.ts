// Client-safe pure masking helpers for sensitive values (IPs, wallet addresses, hashes).
// No React / Node builtins so these run anywhere.

const DOT = "···"

export function maskIp(ip: string): string {
  if (!ip) return ip
  const clean = ip.replace(/^\+/, "")
  const v4 = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(:\d+)?$/)
  if (v4) return `${v4[1]}.${DOT}.${v4[4]}${v4[5] ?? ""}`
  // IPv6 with optional port / bracket form
  const host = clean.replace(/^\[(.*)\](:\d+)$/, (_m, a, b) => `${a}${b}`)
  const portMatch = host.match(/(:\d+)$/)
  const body = portMatch ? host.slice(0, -portMatch[1].length) : host
  const port = portMatch ? portMatch[1] : ""
  if (body.includes(":")) {
    const first = body.split(":")[0] || "···"
    return `${first}:${DOT}${port}`
  }
  return maskHash(clean)
}

export function maskAddress(addr: string): string {
  if (!addr) return addr
  const suffix = addr.endsWith(".tari") ? ".tari" : ""
  const core = suffix ? addr.slice(0, -suffix.length) : addr
  if (core.length <= 12) return addr
  return `${core.slice(0, 4)}${DOT}${core.slice(-4)}${suffix}`
}

export function maskHash(h: string): string {
  if (!h) return h
  const s = h.replace(/\.\.\.$/, "")
  if (s.length <= 14) return h
  return `${s.slice(0, 6)}${DOT}${s.slice(-6)}`
}

export function maskText(s: string): string {
  if (!s) return s
  return s
    .replace(/([0-9a-fA-F]{6})[0-9a-fA-F]{48,}([0-9a-fA-F]{6})/g, `$1${DOT}$2`)
    .replace(/\b(\d{1,3})\.\d{1,3}\.\d{1,3}\.(\d{1,3})\b/g, `$1.${DOT}.$2`)
    .replace(/([1-9A-HJ-NP-Za-km-z]{4})[1-9A-HJ-NP-Za-km-z]{70,}([1-9A-HJ-NP-Za-km-z]{4})/g, `$1${DOT}$2`)
    .replace(/("(?:pass|password|access[_-]?token|apikey|api[_-]?key|token)"\s*:\s*")([^"]*)(")/gi, (_m, k, v, e) => `${k}${"•".repeat(Math.min(v.length || 1, 8))}${e}`)
}

export function maskSecret(s: string): string {
  if (!s) return s
  return "•".repeat(Math.min(s.length, 8))
}

export type MaskKind = "ip" | "address" | "hash" | "text" | "secret"

export function applyMask(value: string, kind: MaskKind): string {
  switch (kind) {
    case "ip":
      return maskIp(value)
    case "address":
      return maskAddress(value)
    case "hash":
      return maskHash(value)
    case "text":
      return maskText(value)
    case "secret":
      return maskSecret(value)
  }
}
