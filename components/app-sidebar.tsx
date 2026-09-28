"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "cn"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import {
  PickaxeIcon,
  CommandIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ServerIcon,
  CoinsIcon,
  ZapIcon,
  UsersIcon,
  SettingsIcon,
} from "lucide-react"
import type { Miner } from "@/lib/xmrig/types"

const WORKSPACES = [
  { title: "Miners", href: "/", icon: PickaxeIcon },
  { title: "P2Pool", href: "/p2pool", icon: ServerIcon },
  { title: "Monero", href: "/monero", icon: CoinsIcon },
  { title: "Tari", href: "/tari", icon: ZapIcon },
]

const ACCOUNT = [
  { title: "Settings", href: "/settings", icon: SettingsIcon },
  { title: "Admin", href: "/admin", icon: UsersIcon },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  miners: Miner[]
  totalHashrate: number
  onlineCount: number
  totalSharesGood: number
  totalSharesTotal: number
  avgAcceptRate: string
  combinedUptime: string
  p2poolUrl: string
  moneroUrl: string
  moneroUser: string
  moneroPass: string
  tariUrl: string
  onOpenNetworkSettings: () => void
}

function formatHashrate(hps: number): string {
  if (hps >= 1e9) return `${(hps / 1e9).toFixed(2)} GH/s`
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} KH/s`
  return `${hps.toFixed(0)} H/s`
}

function timeAgo(ts: number): string {
  const secs = Math.floor(Date.now() / 1000 - ts)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function formatCount(n: number): string {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export function AppSidebar({
  miners,
  totalHashrate,
  onlineCount,
  totalSharesGood,
  totalSharesTotal,
  avgAcceptRate,
  combinedUptime,
  p2poolUrl,
  moneroUrl,
  moneroUser,
  moneroPass,
  tariUrl,
  onOpenNetworkSettings,
  ...props
}: AppSidebarProps) {
  const [minersOpen, setMinersOpen] = useState(true)
  const [p2poolData, setP2poolData] = useState<any>(null)
  const [p2poolError, setP2poolError] = useState<string | null>(null)
  const [moneroStats, setMoneroStats] = useState<any>(null)
  const [moneroError, setMoneroError] = useState<string | null>(null)
  const [tariStats, setTariStats] = useState<any>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const qs = p2poolUrl ? `?url=${encodeURIComponent(p2poolUrl)}` : ""
        const res = await fetch(`/api/p2pool${qs}`)
        const data = await res.json()
        if (!active) return
        if (data?.stats || data?.stratum) {
          setP2poolData(data)
          setP2poolError(null)
        } else if (p2poolUrl) {
          setP2poolData(null)
          setP2poolError(data?.error ? String(data.error).split("\n")[0] : `HTTP ${res.status}`)
        }
      } catch (e: any) {
        if (!active) return
        setP2poolData(null)
        if (p2poolUrl) setP2poolError(e?.message || "Failed to fetch")
      }
    }
    load()
    const iv = setInterval(load, 60000)
    return () => { active = false; clearInterval(iv) }
  }, [p2poolUrl])

  useEffect(() => {
    if (!moneroUrl) return
    let active = true
    async function load() {
      try {
        const params = new URLSearchParams({ url: moneroUrl })
        if (moneroUser) params.set("user", moneroUser)
        if (moneroPass) params.set("pass", moneroPass)
        const res = await fetch(`/api/monero?${params}`)
        const data = await res.json()
        if (!active) return
        if (data?.info) {
          setMoneroStats(data)
          setMoneroError(null)
        } else {
          setMoneroStats(null)
          setMoneroError(data?.error || `HTTP ${res.status}`)
        }
      } catch (e: any) {
        if (!active) return
        setMoneroStats(null)
        setMoneroError(e?.message || "Failed to fetch")
      }
    }
    load()
    const iv = setInterval(load, 60000)
    return () => { active = false; clearInterval(iv) }
  }, [moneroUrl, moneroUser, moneroPass])

  useEffect(() => {
    if (!tariUrl) return
    let active = true
    async function load() {
      try {
        const res = await fetch(`/api/tari?url=${encodeURIComponent(tariUrl)}`)
        const data = await res.json()
        if (active && data?.tipInfo) setTariStats(data)
      } catch {}
    }
    load()
    const iv = setInterval(load, 60000)
    return () => { active = false; clearInterval(iv) }
  }, [tariUrl])

  const pathname = usePathname()

  const [statsApi, setStatsApi] = useState<CarouselApi>()
  const [statsCurrent, setStatsCurrent] = useState(0)
  const [statsCount, setStatsCount] = useState(0)
  const statsAutoplay = useRef(
    Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnFocusIn: true }),
  ).current

  useEffect(() => {
    if (!statsApi) return
    setStatsCount(statsApi.scrollSnapList().length)
    setStatsCurrent(statsApi.selectedScrollSnap())
    const onSelect = () => setStatsCurrent(statsApi.selectedScrollSnap())
    const onReInit = () => setStatsCount(statsApi.scrollSnapList().length)
    statsApi.on("select", onSelect)
    statsApi.on("reInit", onReInit)
    return () => {
      statsApi.off("select", onSelect)
      statsApi.off("reInit", onReInit)
    }
  }, [statsApi])

  const statsSlides: { key: string; label: string; body: React.ReactNode }[] = [
    {
      key: "mining",
      label: "Stats",
      body: (
        <div className="px-3 py-2 space-y-2.5">
          <div>
            <div className="text-[11px] text-muted-foreground">Total Hashrate</div>
            <div className="text-xl font-extrabold tracking-tight tabular-nums">
              {formatHashrate(totalHashrate)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Shares</div>
              <div className="tabular-nums">
                <span className="text-sm font-bold">{totalSharesGood}</span>
                <span className="text-[10px] text-muted-foreground mx-0.5">/</span>
                <span className="text-[10px] text-muted-foreground">{totalSharesTotal}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Accept Rate</div>
              <div className="text-sm font-bold tabular-nums">{avgAcceptRate}%</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Online</div>
              <div className="text-sm font-bold tabular-nums">
                {onlineCount}<span className="text-[10px] text-muted-foreground font-normal">/{miners.length}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Uptime</div>
              <div className="text-sm font-bold tabular-nums">{combinedUptime}</div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  if (p2poolData || (p2poolUrl && p2poolError)) {
    statsSlides.push({
      key: "p2pool",
      label: "P2Pool",
      body: p2poolError && !p2poolData ? (
        <div className="px-3 py-2 text-[11px] text-destructive break-words">{p2poolError}</div>
      ) : (
        (() => {
          const poolStats = p2poolData?.stats?.pool_statistics || null
          const stratumStats = p2poolData?.stratum || null
          const p2pStats = p2poolData?.p2p || null
          const config = p2poolData?.config || null
          const effort =
            typeof stratumStats?.current_effort === "number" && stratumStats.current_effort >= 0
              ? (stratumStats.current_effort * 100).toFixed(1)
              : null
          return (
            <div className="px-3 py-2 space-y-1.5">
              <div>
                <div className="text-[11px] text-muted-foreground">Pool Hashrate</div>
                <div className="text-sm font-bold tabular-nums">
                  {formatHashrate(poolStats?.hashRate ?? stratumStats?.hashrate_15m ?? 0)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] text-muted-foreground">Miners</div>
                  <div className="text-sm font-bold tabular-nums">{poolStats?.miners ?? 0}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Height</div>
                  <div className="text-sm font-bold tabular-nums">{poolStats?.sidechainHeight?.toLocaleString() ?? "—"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] text-muted-foreground">Connections</div>
                  <div className="text-sm font-bold tabular-nums">{stratumStats?.connections ?? p2pStats?.connections ?? 0}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Round Hashes</div>
                  <div className="text-sm font-bold tabular-nums">
                    {typeof poolStats?.roundHashes === "number" ? formatCount(poolStats.roundHashes) : "—"}
                  </div>
                </div>
              </div>
              {(stratumStats || effort !== null) && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground">Shares Ok/Fail</div>
                    <div className="text-sm font-bold tabular-nums">{stratumStats?.shares_found ?? 0}/{stratumStats?.shares_failed ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">Effort</div>
                    <div className="text-sm font-bold tabular-nums">{effort !== null ? `${effort}%` : "—"}</div>
                  </div>
                </div>
              )}
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                {poolStats?.lastBlockFoundTime > 0 && (
                  <div>Last block {timeAgo(poolStats.lastBlockFoundTime)}</div>
                )}
                {config && (
                  <div>
                    Fee {config.fee ?? 0}%
                    {typeof config.minPaymentThreshold === "number" &&
                      ` · payout ≥ ${(config.minPaymentThreshold / 1e12).toLocaleString()} XMR`}
                  </div>
                )}
              </div>
            </div>
          )
        })()
      ),
    })
  }

  if (moneroUrl && (moneroStats?.info || moneroError)) {
    statsSlides.push({
      key: "monero",
      label: "Monero Node",
      body: moneroError && !moneroStats?.info ? (
        <div className="px-3 py-2 text-[11px] text-destructive break-words">{moneroError}</div>
      ) : (
        <div className="px-3 py-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Height</div>
              <div className="text-sm font-bold tabular-nums">{moneroStats.info.height?.toLocaleString() ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Peers</div>
              <div className="text-sm font-bold tabular-nums">{moneroStats.info.outgoing_connections_count ?? 0}/{moneroStats.info.incoming_connections_count ?? 0}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Tx Pool</div>
              <div className="text-sm font-bold tabular-nums">{moneroStats.info.tx_pool_size ?? 0}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Synced</div>
              <div className="text-sm font-bold">{moneroStats.info.synchronized ?? moneroStats.info.synced ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      ),
    })
  }

  if (tariUrl && tariStats?.tipInfo) {
    statsSlides.push({
      key: "tari",
      label: "Tari Node",
      body: (
        <div className="px-3 py-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Height</div>
              <div className="text-sm font-bold tabular-nums">{Number(tariStats.tipInfo.metadata?.best_block_height ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Synced</div>
              <div className="text-sm font-bold">{tariStats.tipInfo.is_synced ? "Yes" : "No"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Peers</div>
              <div className="text-sm font-bold tabular-nums">
                {tariStats.networkState?.num_peers ?? tariStats.peers?.connected_peers?.length ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Mempool</div>
              <div className="text-sm font-bold tabular-nums">
                {tariStats.mempoolStats?.unconfirmed_txs ?? tariStats.mempoolStats?.unconfirmed_transactions ?? 0}
              </div>
            </div>
          </div>
          {tariStats.version && (
            <div className="text-[10px] text-muted-foreground font-mono">
              v{tariStats.version.version ?? tariStats.version}
            </div>
          )}
        </div>
      ),
    })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">XMRig</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKSPACES.map(({ title, href, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      tooltip={title}
                      isActive={isActive}
                      render={<a href={href} />}
                    >
                      <Icon />
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Stats carousel: Mining / P2Pool / Monero / Tari */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          {statsSlides.length === 1 ? (
            <>
              <SidebarGroupLabel>{statsSlides[0].label}</SidebarGroupLabel>
              <SidebarGroupContent>{statsSlides[0].body}</SidebarGroupContent>
            </>
          ) : (
            <SidebarGroupContent>
              <Carousel
                setApi={setStatsApi}
                opts={{ loop: true }}
                plugins={[statsAutoplay]}
              >
                <CarouselContent className="ms-0">
                  {statsSlides.map((s) => (
                    <CarouselItem key={s.key} className="ps-0">
                      <div>
                        <SidebarGroupLabel>{s.label}</SidebarGroupLabel>
                        {s.body}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  <CarouselPrevious
                    variant="ghost"
                    className="inset-auto static size-6 opacity-70 hover:opacity-100"
                  />
                  <div className="flex items-center gap-1.5 px-2">
                    {Array.from({ length: statsCount }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Show ${statsSlides[i]?.label ?? "stats"}`}
                        onClick={() => statsApi?.scrollTo(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === statsCurrent
                            ? "w-5 bg-muted-foreground"
                            : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                        )}
                      />
                    ))}
                  </div>
                  <CarouselNext
                    variant="ghost"
                    className="inset-auto static size-6 opacity-70 hover:opacity-100"
                  />
                </div>
              </Carousel>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Account */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ACCOUNT.map(({ title, href, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      tooltip={title}
                      isActive={isActive}
                      render={<a href={href} />}
                    >
                      <Icon />
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Miners List (collapsible) */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="cursor-pointer select-none flex items-center gap-1" onClick={() => setMinersOpen(!minersOpen)}>
            {minersOpen ? <ChevronDownIcon className="size-3" /> : <ChevronRightIcon className="size-3" />}
            Miners ({miners.length})
          </SidebarGroupLabel>
          {minersOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {miners.map((miner) => {
                  const isOnline = miner.lastSummary !== null && miner.error === null
                  const hr = miner.lastSummary?.hashrate?.total?.[0] ?? 0
                  return (
                    <SidebarMenuItem key={miner.id}>
                      <SidebarMenuButton tooltip={miner.name}>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="truncate">{miner.name}</span>
                        {hr > 0 && (
                          <span className="ms-auto text-[10px] text-muted-foreground tabular-nums">
                            {formatHashrate(hr)}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
                {miners.length === 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <PickaxeIcon />
                      <span className="text-muted-foreground">No miners</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser onOpenNetworkSettings={onOpenNetworkSettings} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
