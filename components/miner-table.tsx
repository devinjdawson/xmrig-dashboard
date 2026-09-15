"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { Miner } from "@/lib/xmrig/types"

interface MinerTableProps {
  miners: Miner[]
  selectedMiners: Set<string>
  onToggleSelection: (id: string) => void
  onEdit: (miner: Miner) => void
  onDelete: (id: string) => void
  onRefresh: (miner: Miner) => void
}

function formatHashrate(hps: number): string {
  if (hps >= 1000) return `${(hps / 1000).toFixed(2)} KH/s`
  return `${hps.toFixed(2)} H/s`
}

function formatUptime(seconds: number): string {
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
  onRefresh 
}: MinerTableProps) {
  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-2 text-left">
              <input
                type="checkbox"
                checked={selectedMiners.size === miners.length && miners.length > 0}
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
            const hr = miner.lastSummary?.hashrate.total[0] ?? 0
            const shares = miner.lastSummary?.results
            const uptime = miner.lastSummary?.connection.uptime ?? 0

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
                  {isOnline && shares ? `${shares.shares_good}/${shares.shares_total}` : "—"}
                </td>
                <td className="p-2 text-right">
                  {isOnline ? formatUptime(uptime) : "—"}
                </td>
                <td className="p-2 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
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
                    <Button size="sm" variant="ghost" onClick={() => onRefresh(miner)}>
                      ↻
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(miner)}>
                      ✎
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(miner.id)}>
                      ✕
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