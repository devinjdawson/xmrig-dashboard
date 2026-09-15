"use client"

import { Button } from "@/components/ui/button"
import { Copy, Pencil, RefreshCcw, Trash2 } from "lucide-react"
import type { Miner } from "@/lib/xmrig/types"

interface MinerTableProps {
  miners: Miner[]
  selectedMiners: Set<string>
  onToggleSelection: (id: string) => void
  onEdit: (miner: Miner) => void
  onDelete: (id: string) => void
  onRefresh: (miner: Miner) => void
  onDuplicate?: (miner: Miner) => void
}

function formatHashrate(hps: number | null | undefined): string {
  if (hps == null || isNaN(hps)) return "—"
  if (hps >= 1000) return `${(hps / 1000).toFixed(2)} KH/s`
  return `${hps.toFixed(2)} H/s`
}

function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return "—"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function MinerTable({
  miners,
  selectedMiners,
  onToggleSelection,
  onEdit,
  onDelete,
  onRefresh,
  onDuplicate,
}: MinerTableProps) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-2 text-left">
              <input
                type="checkbox"
                checked={selectedMiners.size === miners.length && miners.length > 0 && selectedMiners.size > 0}
                onChange={() => miners.forEach((m) => onToggleSelection(m.id))}
                className="rounded"
              />
            </th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Host</th>
            <th className="p-2 text-right">Hashrate</th>
            <th className="p-2 text-right">Shares</th>
            <th className="p-2 text-right">Uptime</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-center">Tags</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {miners.map((miner) => {
            const isOnline = miner.lastSummary !== null && miner.error === null
            const hr = miner.lastSummary?.hashrate?.total?.[0] ?? null
            const shares = miner.lastSummary?.results
            const uptime = miner.lastSummary?.connection?.uptime ?? null

            return (
              <tr key={miner.id} className="border-t hover:bg-muted/30">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedMiners.has(miner.id)}
                    onChange={() => onToggleSelection(miner.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-2 font-medium">{miner.name}</td>
                <td className="p-2 font-mono text-xs text-muted-foreground">
                  {miner.host}:{miner.port}
                </td>
                <td className="p-2 text-right font-mono">
                  {isOnline ? formatHashrate(hr) : "—"}
                </td>
                <td className="p-2 text-right">
                  {isOnline && shares ? `${shares.shares_good ?? 0}/${shares.shares_total ?? 0}` : "—"}
                </td>
                <td className="p-2 text-right">
                  {isOnline ? formatUptime(uptime) : "—"}
                </td>
                <td className="p-2 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                </td>
                <td className="p-2 text-center">
                  <div className="flex gap-1 justify-center flex-wrap">
                    {(miner.tags || []).map((tag) => (
                      <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRefresh(miner)} title="Refresh">
                      <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>
                    {onDuplicate && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(miner)} title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(miner)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(miner.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
