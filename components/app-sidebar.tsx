"use client"

import * as React from "react"
import { useEffect, useState } from "react"
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
  LayoutDashboardIcon,
  PickaxeIcon,
  CommandIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react"
import type { Miner } from "@/lib/xmrig/types"

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
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} KH/s`
  return `${hps.toFixed(0)} H/s`
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
  const [p2poolStats, setP2poolStats] = useState<any>(null)
  const [moneroStats, setMoneroStats] = useState<any>(null)
  const [tariStats, setTariStats] = useState<any>(null)

  useEffect(() => {
    if (!p2poolUrl) return
    let active = true
    async function load() {
      try {
        const res = await fetch(`/api/p2pool?url=${encodeURIComponent(p2poolUrl)}`)
        const data = await res.json()
        if (active && data.stats) setP2poolStats(data.stats.pool_statistics || data.stats)
      } catch {}
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
        if (active && !data.error) setMoneroStats(data)
      } catch {}
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
        if (active && !data.error) setTariStats(data)
      } catch {}
    }
    load()
    const iv = setInterval(load, 60000)
    return () => { active = false; clearInterval(iv) }
  }, [tariUrl])

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
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutDashboardIcon />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cumulative Stats */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Stats</SidebarGroupLabel>
          <SidebarGroupContent>
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
          </SidebarGroupContent>
        </SidebarGroup>

        {/* P2Pool Summary */}
        {p2poolUrl && p2poolStats && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>P2Pool</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 space-y-1.5">
                <div>
                  <div className="text-[11px] text-muted-foreground">Pool Hashrate</div>
                  <div className="text-sm font-bold tabular-nums">{formatHashrate(p2poolStats.hashRate ?? p2poolStats.hash_rate_15m ?? 0)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground">Miners</div>
                    <div className="text-sm font-bold tabular-nums">{p2poolStats.miners ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">Height</div>
                    <div className="text-sm font-bold tabular-nums">{p2poolStats.sidechainHeight?.toLocaleString() ?? "—"}</div>
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Monero Node Summary */}
        {moneroUrl && moneroStats?.info && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Monero Node</SidebarGroupLabel>
            <SidebarGroupContent>
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
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tari Node Summary */}
        {tariUrl && tariStats?.metadata && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Tari Node</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground">Height</div>
                    <div className="text-sm font-bold tabular-nums">{tariStats.metadata.best_block_height?.toLocaleString() ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">Synced</div>
                    <div className="text-sm font-bold">{tariStats.is_synced ? "Yes" : "No"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Difficulty</div>
                  <div className="text-sm font-bold tabular-nums">{tariStats.metadata.accumulated_difficulty ? Number(tariStats.metadata.accumulated_difficulty).toLocaleString() : "—"}</div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
