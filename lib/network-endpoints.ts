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
    return JSON.parse(raw)
  } catch {
    return { p2poolUrl: "", moneroUrl: "", moneroUser: "", moneroPass: "" }
  }
}

export function saveEndpoints(ep: NetworkEndpoints) {
  localStorage.setItem(KEY, JSON.stringify(ep))
}
