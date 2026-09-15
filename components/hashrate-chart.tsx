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

  const hashrates = snapshots
    .map((s) => s.summary?.hashrate?.total?.[0] ?? 0)
    .reverse()

  const max = Math.max(...hashrates)
  const min = Math.min(...hashrates.filter((h) => h > 0))

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Min:</span>
            <span className="ml-2 font-mono">{min.toFixed(2)} H/s</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max:</span>
            <span className="ml-2 font-mono">{max.toFixed(2)} H/s</span>
          </div>
        </div>
        <div className="relative h-48">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              points={hashrates
                .map((h, i) => {
                  const x = (i / (hashrates.length - 1 || 1)) * 100
                  const y = max === min ? 50 : 100 - ((h - min) / (max - min)) * 100
                  return `${x},${y}`
                })
                .join(" ")}
            />
          </svg>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {snapshots.length} snapshots
        </div>
      </CardContent>
    </Card>
  )
}