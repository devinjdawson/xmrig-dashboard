export interface XmrigHashrate {
  total: [number, number, number]
  highest: number
  threads: [number, number, number][]
}

export interface XmrigResults {
  diff_current: number
  shares_good: number
  shares_total: number
  avg_time: number
  hashes_total: number
  best: number[]
  error_log: string[]
}

export interface XmrigConnection {
  pool: string
  uptime: number
  ping: number
  failures: number
  error_log: string[]
}

export interface XmrigCpu {
  brand: string
  aes: boolean
  x64: boolean
  sockets: number
}

export interface XmrigSummary {
  id: string
  worker_id: string
  version: string
  kind: string
  ua: string
  cpu: XmrigCpu
  algo: string
  hugepages: boolean
  donate_level: number
  hashrate: XmrigHashrate
  results: XmrigResults
  connection: XmrigConnection
}

export interface XmrigThread {
  type: string
  algo: string
  av: number
  low_power_mode: number
  affine_to_cpu: number
  priority: number
  soft_aes: boolean
  hashrate: [number, number, number]
}

export interface XmrigThreadsResponse {
  hugepages: [number, number]
  memory: number
  threads: XmrigThread[]
}

export interface XmrigPool {
  url: string
  user: string
  pass: string
  keepalive: boolean
  nicehash: boolean
  variant: number
}

export interface XmrigThreadConfig {
  low_power_mode: number
  affine_to_cpu: number
}

export interface XmrigApiConfig {
  port: number
  "access-token": string | null
  "worker-id": string | null
  ipv6: boolean
  restricted: boolean
}

export interface XmrigConfig {
  algo: string
  api: XmrigApiConfig
  av: number
  background: boolean
  colors: boolean
  "cpu-affinity": string | null
  "cpu-priority": number | null
  "donate-level": number
  "huge-pages": boolean
  "hw-aes": boolean | null
  "log-file": string | null
  "max-cpu-usage": number
  pools: XmrigPool[]
  "print-time": number
  retries: number
  "retry-pause": number
  safe: boolean
  threads: XmrigThreadConfig[]
  "user-agent": string | null
  syslog: boolean
  watch: boolean
}

export interface Miner {
  id: string
  name: string
  host: string
  port: number
  accessToken: string | null
  tags: string[]
  lastSummary: XmrigSummary | null
  lastThreads: XmrigThreadsResponse | null
  lastConfig: XmrigConfig | null
  error: string | null
  threadsError: string | null
  configError: string | null
  lastUpdated: number | null
}