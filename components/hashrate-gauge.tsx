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
import { RollingNumber } from "@/components/ui/rolling-number"

interface HashrateGaugeProps {
  current: number | null | undefined
  max: number | null | undefined
}

const chartConfig: ChartConfig = {
  current: { label: "Current", color: "var(--color-current)" },
  max: { label: "Max", color: "var(--color-max)" },
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
    <Card className="h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">Hashrate</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[200px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={270}
            startAngle={-90}
            innerRadius={60}
            outerRadius={90}
          >
            <RadialBar
              dataKey="max"
              stackId="a"
              fill="var(--color-max)"
              cornerRadius={6}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              className="stroke-transparent"
            />
            <RadialBar
              dataKey="current"
              stackId="a"
              fill="var(--color-current)"
              cornerRadius={6}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              className="stroke-transparent"
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const cx = viewBox.cx as number
                    const cy = (viewBox.cy ?? 0) as number
                    return (
                      <text x={cx} y={cy} textAnchor="middle">
                        <tspan
                          x={cx}
                          y={cy - 16}
                          className="fill-muted-foreground text-[10px]"
                        >
                          Current
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy}
                          className="fill-foreground text-xl font-bold tabular-nums"
                        >
                          <RollingNumber value={cur} />
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 16}
                          className="fill-foreground text-sm font-medium"
                        >
                          H/s
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 30}
                          className="fill-muted-foreground text-[10px]"
                        >
                          {percent}% of {formatHashrate(peak)}
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
        <div className="mt-2 flex justify-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: "var(--color-current)" }}
            />
            <span className="text-muted-foreground">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: "var(--color-max)" }}
            />
            <span className="text-muted-foreground">Max</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
