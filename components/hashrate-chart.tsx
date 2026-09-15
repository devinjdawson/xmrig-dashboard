"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface HashrateChartProps {
  minerId: string
}

interface Snapshot {
  summary: any
  timestamp: number
}

const chartConfig = {
  hashrate: {
    label: "Hashrate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function HashrateChart({ minerId }: HashrateChartProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/miners/${minerId}/snapshots?limit=60`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
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
    return <div className="h-64 bg-muted rounded-md animate-pulse" />
  }

  if (error) {
    return (
      <div className="text-destructive text-sm p-4">
        Failed to load hashrate history: {error}
      </div>
    )
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4">
        No hashrate history yet. Refresh a few times to build up data.
      </div>
    )
  }

  const data = snapshots
    .map((s) => ({
      time: typeof s.timestamp === "number" ? s.timestamp : new Date(s.timestamp).getTime(),
      hashrate: s.summary?.hashrate?.total?.[0] ?? 0,
    }))
    .sort((a, b) => a.time - b.time)

  const hashrates = data.map((d) => d.hashrate)
  const max = Math.max(...hashrates, 1)

  if (max === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4">
        All hashrates are zero. Waiting for mining activity...
      </div>
    )
  }

  const first = data[0]?.time
  const last = data[data.length - 1]?.time
  const spanMs = last && first ? last - first : 0

  function formatTime(ts: number) {
    if (spanMs < 3600000) {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    if (spanMs < 86400000) {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  function formatHashrate(h: number) {
    if (h >= 1000000) return `${(h / 1000000).toFixed(2)} MH/s`
    if (h >= 1000) return `${(h / 1000).toFixed(2)} KH/s`
    return `${h.toFixed(1)} H/s`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Hashrate History ({data.length} snapshots)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillHashrate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-hashrate)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-hashrate)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={40}
              tickFormatter={formatTime}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatHashrate}
              width={60}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatTime(Number(value))}
                  indicator="dot"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="hashrate"
              stroke="var(--color-hashrate)"
              strokeWidth={2}
              fill="url(#fillHashrate)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
