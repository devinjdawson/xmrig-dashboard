"use client"

import { useEffect, useState } from "react"

interface HashrateChartProps {
  minerId: string
}

interface Snapshot {
  id: number
  minerId: string
  timestamp: string
  summary: any
  threads: any
  config: any
  error: string | null
}

function formatHashrate(h: number) {
  if (!h) return "0"
  if (h >= 1000000) return `${(h / 1000000).toFixed(2)} MH/s`
  if (h >= 1000) return `${(h / 1000).toFixed(2)} KH/s`
  return `${h.toFixed(2)} H/s`
}

export function HashrateChart({ minerId }: HashrateChartProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/miners/${minerId}/snapshots?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setSnapshots(data.reverse())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [minerId])

  if (loading) {
    return <div className="text-muted-foreground">Loading history...</div>
  }

  if (snapshots.length === 0) {
    return <div className="text-muted-foreground">No history available yet.</div>
  }

  const data = snapshots
    .filter((s) => s.summary?.hashrate?.total?.[0])
    .map((s) => ({
      time: new Date(s.timestamp).toLocaleTimeString(),
      hashrate: s.summary.hashrate.total[0],
    }))

  if (data.length === 0) {
    return <div className="text-muted-foreground">No valid hashrate data.</div>
  }

  const maxHashrate = Math.max(...data.map((d) => d.hashrate))
  const minHashrate = Math.min(...data.map((d) => d.hashrate))

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span>Min: {formatHashrate(minHashrate)}</span>
        <span>Max: {formatHashrate(maxHashrate)}</span>
      </div>
      <div className="h-48 border rounded-md p-4">
        <svg className="w-full h-full" viewBox={`0 0 ${data.length} 100`} preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={data
              .map((d, i) => {
                const x = i
                const y = 100 - ((d.hashrate - minHashrate) / (maxHashrate - minHashrate || 1)) * 100
                return `${x},${y}`
              })
              .join(" ")}
          />
        </svg>
      </div>
      <div className="text-xs text-muted-foreground">
        Last {data.length} snapshots • {data[0]?.time} → {data[data.length - 1]?.time}
      </div>
    </div>
  )
}
