export interface NetworkEndpoints {
  p2poolUrl: string
  moneroUrl: string
  moneroUser: string
  moneroPass: string
}

const KEY = "xmrig-network-endpoints"

export function loadEndpoints(): NetworkEndpoints {
  if (typeof window === "undefined") {
    return { p2poolUrl: "", moneroUrl: "", moneroUser: "", moneroPass: "" }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { p2poolUrl: "", moneroUrl: "", moneroUser: "", moneroPass: "" }
    const parsed = JSON.parse(raw) as NetworkEndpoints
    return {
      p2poolUrl: (parsed.p2poolUrl || "").replace(/\s+/g, "").trim(),
      moneroUrl: (parsed.moneroUrl || "").replace(/\s+/g, "").trim(),
      moneroUser: parsed.moneroUser || "",
      moneroPass: parsed.moneroPass || "",
    }
  } catch {
    return { p2poolUrl: "", moneroUrl: "", moneroUser: "", moneroPass: "" }
  }
}

export function saveEndpoints(ep: NetworkEndpoints) {
  const cleaned: NetworkEndpoints = {
    p2poolUrl: (ep.p2poolUrl || "").replace(/\s+/g, "").trim(),
    moneroUrl: (ep.moneroUrl || "").replace(/\s+/g, "").trim(),
    moneroUser: ep.moneroUser || "",
    moneroPass: ep.moneroPass || "",
  }
  localStorage.setItem(KEY, JSON.stringify(cleaned))
}
