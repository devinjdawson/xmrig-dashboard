"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Pencil, RefreshCcw, Trash2, Wifi, WifiOff } from "lucide-react"
import type { Miner } from "@/lib/xmrig/types"

interface MinerGridProps {
  miners: Miner[]
  selectedMiners: Set<string>
  onToggleSelection: (id: string) => void
  onEdit: (miner: Miner) => void
  onDelete: (id: string) => void
  onRefresh: (miner: Miner) => void
  onDuplicate?: (miner: Miner) => void
}

function formatHashrate(hps: number | null | undefined): string {
  if (hps == null || isNaN(hps) || hps === 0) return "0 H/s"
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} KH/s`
  return `${hps.toFixed(1)} H/s`
}

export function MinerGrid({
  miners,
  selectedMiners,
  onToggleSelection,
  onEdit,
  onDelete,
  onRefresh,
  onDuplicate,
}: MinerGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {miners.map((miner) => {
        const isOnline = miner.lastSummary !== null && miner.error === null
        const hr = miner.lastSummary?.hashrate?.total?.[0] ?? null
        const shares = miner.lastSummary?.results
        const selected = selectedMiners.has(miner.id)

        return (
          <div
            key={miner.id}
            className={`relative rounded-lg border p-3 transition-colors ${
              isOnline ? "border-green-500/30 bg-card" : "border-destructive/30 bg-card"
            } ${selected ? "ring-2 ring-primary/60" : ""}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {isOnline ? (
                    <Wifi className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <h3 className="text-sm font-semibold truncate">{miner.name}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  {miner.host}:{miner.port}
                </p>
              </div>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelection(miner.id)}
                className="rounded mt-0.5"
                title="Include in cumulative stats"
              />
            </div>

            <div className="space-y-1.5 my-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-muted-foreground">Hashrate</span>
                <span className="text-xl font-extrabold tracking-tight tabular-nums">
                  {isOnline && hr != null && hr > 0 ? formatHashrate(hr) : "—"}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-muted-foreground">Shares</span>
                <span className="tabular-nums">
                  {isOnline && shares ? (
                    <>
                      <span className="text-lg font-bold">{shares.shares_good ?? 0}</span>
                      <span className="text-xs text-muted-foreground mx-0.5">/</span>
                      <span className="text-xs text-muted-foreground">{shares.shares_total ?? 0}</span>
                    </>
                  ) : "—"}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-muted-foreground">Uptime</span>
                <span className="font-mono text-xs">
                  {isOnline && miner.lastSummary?.connection?.uptime
                    ? formatDuration(miner.lastSummary.connection.uptime)
                    : "—"}
                </span>
              </div>
            </div>

            {(miner.tags || []).length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {miner.tags.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {t}
                  </Badge>
                ))}
                {(miner.tags || []).length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{miner.tags.length - 3}</span>
                )}
              </div>
            )}

            {miner.error && (
              <p className="text-[11px] text-destructive truncate mb-2" title={miner.error}>
                {miner.error}
              </p>
            )}

            <div className="flex gap-0.5 border-t pt-2 -mx-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRefresh(miner)} title="Refresh">
                <RefreshCcw className="h-3 w-3" />
              </Button>
              {onDuplicate && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(miner)} title="Duplicate">
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(miner)} title="Edit">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(miner.id)} title="Delete">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
