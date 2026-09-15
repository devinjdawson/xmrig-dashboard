"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface HashrateChartProps {
  minerId: string
}

interface Snapshot {
  summary: any
  timestamp: number
}

export function HashrateChart({ minerId }: HashrateChartProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/miners/${minerId}/snapshots?limit=30`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        setSnapshots(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [minerId])

  if (loading) {
    return <div className="h-64 bg-accent rounded-md animate-pulse" />
  }

  if (error) {
    return (
      <div className="text-destructive text-sm p-4">
        Failed to load hashrate history: {error}
      </div>
    )
  }

  if (!snapshots || snapshots.length === 0) {
    return <div className="text-muted-foreground text-sm p-4">No hashrate history yet. Refresh a few times to build up data.</div>
  }

  const data = snapshots
    .map((s) => ({
      hashrate: s.summary?.hashrate?.total?.[0] ?? 0,
      timestamp: typeof s.timestamp === "number" ? s.timestamp : new Date(s.timestamp).getTime(),
    }))
    .reverse()

  const hashrates = data.map((d) => d.hashrate)
  
  if (hashrates.length === 0) {
    return <div className="text-muted-foreground text-sm p-4">No valid hashrate data.</div>
  }
  
  const max = Math.max(...hashrates)
  const positiveHashrates = hashrates.filter((h) => h > 0)
  const min = positiveHashrates.length > 0 ? Math.min(...positiveHashrates) : 0
  
  if (max === 0) {
    return <div className="text-muted-foreground text-sm p-4">All hashrates are zero. Waiting for mining activity...</div>
  }

  const first = data[0]?.timestamp
  const last = data[data.length - 1]?.timestamp
  const spanMs = last && first ? last - first : 0

  function formatTime(ts: number) {
    if (spanMs < 3600000) {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    if (spanMs < 86400000) {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return new Date(ts).toLocaleDateString()
  }

  function formatHashrate(h: number) {
    if (h >= 1000) return `${(h / 1000).toFixed(2)} KH/s`
    return `${h.toFixed(2)} H/s`
  }

  const yLabels = [min, (min + max) / 2, max].filter((v) => isFinite(v) && v > 0)

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Min:</span>
            <span className="ml-2 font-mono">{formatHashrate(min)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg:</span>
            <span className="ml-2 font-mono">{formatHashrate(hashrates.reduce((a, b) => a + b, 0) / hashrates.length)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max:</span>
            <span className="ml-2 font-mono">{formatHashrate(max)}</span>
          </div>
        </div>
        <div className="relative h-48 flex">
          <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2 w-16 text-right">
            {yLabels.slice().reverse().map((v, i) => (
              <span key={i}>{formatHashrate(v)}</span>
            ))}
          </div>
          <div className="flex-1 relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                points={data
                  .map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100
                    const range = max - min
                    const y = range === 0 || !isFinite(range) ? 50 : 100 - ((d.hashrate - min) / range) * 100
                    return `${x},${y}`
                  })
                  .join(" ")}
              />
              {data.map((d, i) => {
                const x = (i / (data.length - 1 || 1)) * 100
                const range = max - min
                const y = range === 0 || !isFinite(range) ? 50 : 100 - ((d.hashrate - min) / range) * 100
                return (
                  <circle key={i} cx={x} cy={y} r="1" fill="currentColor">
                    <title>{`${formatTime(d.timestamp)}: ${formatHashrate(d.hashrate)}`}</title>
                  </circle>
                )
              })}
            </svg>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-16">
          <span>{first ? formatTime(first) : "—"}</span>
          <span>{last ? formatTime(last) : "—"}</span>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {snapshots.length} snapshots
        </div>
      </CardContent>
    </Card>
  )
}
