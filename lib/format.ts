export function formatHashrate(hps: number): string {
  if (!hps || isNaN(hps)) return "0 H/s"
  if (hps >= 1e12) return `${(hps / 1e12).toFixed(2)} TH/s`
  if (hps >= 1e9) return `${(hps / 1e9).toFixed(2)} GH/s`
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} KH/s`
  return `${hps.toFixed(1)} H/s`
}

export function formatXmr(atoms: number): string {
  if (atoms == null || isNaN(atoms)) return "—"
  return `${(atoms / 1e12).toFixed(6)} XMR`
}

export function timeAgo(ts: number): string {
  if (!ts) return "—"
  const secs = Math.floor(Date.now() / 1000 - ts)
  if (secs < 0) return new Date(ts * 1000).toLocaleString()
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return "—"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatCount(n: number): string {
  if (n == null || isNaN(n)) return "—"
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export function formatNum(n: number): string {
  if (n == null || isNaN(n)) return "—"
  return n.toLocaleString()
}
