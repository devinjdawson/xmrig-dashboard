"use client"

import {
  Label,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

interface HashrateGaugeProps {
  current: number | null | undefined
  max: number | null | undefined
}

const chartConfig: ChartConfig = {
  current: { label: "Current", color: "#10b981" },
  max: { label: "Max", color: "#e5e7eb" },
}

function formatHashrate(hps: number | null | undefined): string {
  if (hps == null || isNaN(hps)) return "0 H/s"
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} KH/s`
  return `${hps.toFixed(1)} H/s`
}

export function HashrateGauge({ current, max }: HashrateGaugeProps) {
  const cur = current ?? 0
  const peak = max && max > cur ? max : cur * 1.2

  const chartData = [{ name: "hashrate", current: cur, max: peak - cur }]
  const percent = peak > 0 ? Math.round((cur / peak) * 100) : 0

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-0 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">Hashrate</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[160px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={270}
            startAngle={-90}
            innerRadius={50}
            outerRadius={70}
          >
            <RadialBar
              dataKey="max"
              stackId="a"
              fill="var(--color-max)"
              cornerRadius={4}
              className="stroke-transparent"
            />
            <RadialBar
              dataKey="current"
              stackId="a"
              fill="var(--color-current)"
              cornerRadius={4}
              className="stroke-transparent"
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const cx = viewBox.cx as number
                    const cy = (viewBox.cy ?? 0) as number
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                        <tspan
                          x={cx}
                          dy="-0.6em"
                          className="fill-foreground text-xl font-extrabold tabular-nums tracking-tight"
                        >
                          {formatHashrate(cur)}
                        </tspan>
                        <tspan
                          x={cx}
                          dy="1.4em"
                          className="fill-muted-foreground text-[9px]"
                        >
                          {percent}% of max
                        </tspan>
                      </text>
                    )
                  }
                  return null
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
