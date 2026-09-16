"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { NetworkSettings } from "@/components/network-settings"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { loadEndpoints, type NetworkEndpoints } from "@/lib/network-endpoints"
import type { Miner } from "@/lib/xmrig/types"

const POLL_MS = 30_000

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const [endpoints, setEndpoints] = useState<NetworkEndpoints>(() => loadEndpoints())
  const [showSettings, setShowSettings] = useState(false)
  const [miners, setMiners] = useState<Miner[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch("/api/miners")
        const data: Miner[] = await res.json()
        if (active && Array.isArray(data)) setMiners(data)
      } catch {}
    }
    load()
    const iv = setInterval(load, POLL_MS)
    return () => {
      active = false
      clearInterval(iv)
    }
  }, [])

  const totalHashrate = useMemo(
    () => miners.reduce((sum, m) => sum + (m.lastSummary?.hashrate?.total?.[0] ?? 0), 0),
    [miners],
  )
  const onlineCount = useMemo(
    () => miners.filter((m) => m.lastSummary !== null && m.error === null).length,
    [miners],
  )
  const totalSharesGood = useMemo(
    () => miners.reduce((sum, m) => sum + (m.lastSummary?.results?.shares_good ?? 0), 0),
    [miners],
  )
  const totalSharesTotal = useMemo(
    () => miners.reduce((sum, m) => sum + (m.lastSummary?.results?.shares_total ?? 0), 0),
    [miners],
  )
  const avgAcceptRate =
    totalSharesTotal > 0 ? ((totalSharesGood / totalSharesTotal) * 100).toFixed(1) : "0.0"
  const combinedUptime = useMemo(() => {
    const total = miners.reduce((sum, m) => sum + (m.lastSummary?.connection?.uptime ?? 0), 0)
    const d = Math.floor(total / 86400)
    const h = Math.floor((total % 86400) / 3600)
    const m = Math.floor((total % 3600) / 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }, [miners])

  return (
    <SidebarProvider>
      <AppSidebar
        miners={miners}
        totalHashrate={totalHashrate}
        onlineCount={onlineCount}
        totalSharesGood={totalSharesGood}
        totalSharesTotal={totalSharesTotal}
        avgAcceptRate={avgAcceptRate}
        combinedUptime={combinedUptime}
        p2poolUrl={endpoints.p2poolUrl}
        moneroUrl={endpoints.moneroUrl}
        moneroUser={endpoints.moneroUser}
        moneroPass={endpoints.moneroPass}
        tariUrl={endpoints.tariUrl}
        onOpenNetworkSettings={() => setShowSettings(true)}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </div>
      </SidebarInset>
      {showSettings && (
        <NetworkSettings
          onSave={(ep) => setEndpoints(ep)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </SidebarProvider>
  )
}
