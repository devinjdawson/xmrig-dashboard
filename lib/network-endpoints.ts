export interface NetworkEndpoints {
  p2poolUrl: string
  moneroUrl: string
  moneroUser: string
  moneroPass: string
  tariUrl: string
  tariWalletUrl: string
}

const KEY = "xmrig-network-endpoints"

export function loadEndpoints(): NetworkEndpoints {
  if (typeof window === "undefined") {
    return { p2poolUrl: "", moneroUrl: "", moneroUser: "", moneroPass: "", tariUrl: "", tariWalletUrl: "" }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { p2poolUrl: "", moneroUrl: "", moneroUser: "", moneroPass: "", tariUrl: "", tariWalletUrl: "" }
    const parsed = JSON.parse(raw) as NetworkEndpoints
    return {
      p2poolUrl: (parsed.p2poolUrl || "").replace(/\s+/g, "").trim(),
      moneroUrl: (parsed.moneroUrl || "").replace(/\s+/g, "").trim(),
      moneroUser: parsed.moneroUser || "",
      moneroPass: parsed.moneroPass || "",
      tariUrl: (parsed.tariUrl || "").replace(/\s+/g, "").trim(),
      tariWalletUrl: (parsed.tariWalletUrl || "").replace(/\s+/g, "").trim(),
    }
  } catch {
    return { p2poolUrl: "", moneroUrl: "", moneroUser: "", moneroPass: "", tariUrl: "", tariWalletUrl: "" }
  }
}

export function saveEndpoints(ep: NetworkEndpoints) {
  const cleaned: NetworkEndpoints = {
    p2poolUrl: (ep.p2poolUrl || "").replace(/\s+/g, "").trim(),
    moneroUrl: (ep.moneroUrl || "").replace(/\s+/g, "").trim(),
    moneroUser: ep.moneroUser || "",
    moneroPass: ep.moneroPass || "",
    tariUrl: (ep.tariUrl || "").replace(/\s+/g, "").trim(),
    tariWalletUrl: (ep.tariWalletUrl || "").replace(/\s+/g, "").trim(),
  }
  localStorage.setItem(KEY, JSON.stringify(cleaned))
}
