"use client"

import { useState } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CumulativeStats } from "./cumulative-stats"
import type { Miner } from "@/lib/xmrig/types"

interface MinerGroupProps {
  label: string
  miners: Miner[]
  selectedMiners: Set<string>
  onCollapseChange: (collapsed: boolean) => void
  initialCollapsed?: boolean
  children: React.ReactNode
  accent?: string
}

const ACCENT_COLORS: Record<string, string> = {
  default: "bg-muted",
  online: "bg-green-500/10 border-green-500/30",
  offline: "bg-red-500/10 border-red-500/30",
  mixed: "bg-muted",
}

export function MinerGroup({
  label,
  miners,
  selectedMiners,
  onCollapseChange,
  initialCollapsed = false,
  children,
}: MinerGroupProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  const selectedForGroup = new Set(miners.map((m) => m.id).filter((id) => selectedMiners.has(id)))
  const onlineCount = miners.filter((m) => m.lastSummary && !m.error).length
  const totalOffline = miners.length - onlineCount

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    onCollapseChange(next)
  }

  const statusBadge =
    miners.length === 0
      ? null
      : onlineCount === miners.length
        ? { variant: "success" as const, text: "All online" }
        : onlineCount === 0
          ? { variant: "destructive" as const, text: "All offline" }
          : { variant: "warning" as const, text: `${onlineCount} online` }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="flex flex-row items-center gap-3 hover:bg-accent/30 transition-colors">
          <span className={`transition-transform text-muted-foreground ${collapsed ? "" : "rotate-90"}`}>
            ▶
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{label}</h3>
              <Badge variant="secondary" className="text-xs">
                {miners.length}
              </Badge>
              {totalOffline > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {totalOffline} offline
                </Badge>
              )}
            </div>
            <CumulativeStats
              miners={miners}
              selectedMiners={selectedForGroup}
              compact
            />
          </div>
          {statusBadge && (
            <Badge variant={statusBadge.variant} className="text-xs hidden sm:inline-flex">
              {statusBadge.text}
            </Badge>
          )}
        </CardHeader>
      </button>
      {!collapsed && (
        <div className="p-4 border-t border-border/50">
          {children}
        </div>
      )}
    </Card>
  )
}
