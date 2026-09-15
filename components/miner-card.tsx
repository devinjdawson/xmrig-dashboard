"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Pencil, RefreshCcw, Trash2, Wifi, WifiOff } from "lucide-react"
import { MinerConfig } from "./miner-config"
import { MinerSummary } from "./miner-summary"
import { MinerThreads } from "./miner-threads"
import { HashrateChart } from "./hashrate-chart"
import { MiningStatsCard } from "./mining-stats-card"
import type { Miner } from "@/lib/xmrig/types"

interface MinerCardProps {
  miner: Miner
  onRefresh: (miner: Miner) => void
  onDelete: (id: string) => void
  onEdit: (miner: Miner) => void
  onDuplicate?: (miner: Miner) => void
}

export function MinerCard({ miner, onRefresh, onDelete, onEdit, onDuplicate }: MinerCardProps) {
  const [tab, setTab] = useState("summary")
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)

  async function refresh() {
    setLoading(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/miners/${miner.id}/refresh`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Refresh failed")
      miner.lastSummary = data.summary
      miner.lastThreads = data.threads
      miner.lastConfig = data.config
      miner.error = data.error
      miner.lastUpdated = Date.now()
    } catch (e: any) {
      miner.error = e.message
      miner.lastUpdated = Date.now()
    }
    onRefresh(miner)
    setLoading(false)
  }

  async function testConnection() {
    setTestResult(null)
    try {
      const res = await fetch(`/api/miners/${miner.id}/refresh`)
      const data = await res.json()
      setTestResult({ ok: res.ok, error: data.error })
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message })
    }
  }

  const isOnline = miner.lastSummary !== null && miner.error === null
  const hr = miner.lastSummary?.hashrate?.total?.[0]

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        {/**
         * Header is flex-nowrap: the title block is allowed to shrink
         * (truncate), but the action-icon strip keeps its width and never
         * wraps to a second line.
         */}
        <div className="flex flex-nowrap items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 min-w-0">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive shrink-0" />
              )}
              <CardTitle className="text-base truncate">{miner.name}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {miner.host}:{miner.port}{hr != null ? ` · ${hr.toFixed(2)} H/s` : ""}
            </p>
            {(miner.tags || []).length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {miner.tags.map((t) => (
                  <span key={t} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 flex flex-nowrap items-center gap-0.5 -mr-1.5 -mt-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={testConnection} title="Test connection">
              <Wifi className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={refresh} disabled={loading} title="Refresh">
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {onDuplicate && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDuplicate(miner)} title="Duplicate">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(miner)} title="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(miner.id)} title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {testResult && (
          <p className={`text-xs pt-2 ${testResult.ok ? "text-green-500" : "text-destructive"}`}>
            {testResult.ok ? "Connection OK" : `Failed: ${testResult.error}`}
          </p>
        )}
        {miner.error && (
          <>
            <p className="text-xs text-destructive pt-2">Error: {miner.error}</p>
            <Separator className="my-2" />
          </>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start mb-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <MinerSummary summary={miner.lastSummary} loading={loading} />
          </TabsContent>
          <TabsContent value="threads">
            <MinerThreads threads={miner.lastThreads} loading={loading} />
          </TabsContent>
          <TabsContent value="config">
            <MinerConfig config={miner.lastConfig} loading={loading} />
          </TabsContent>
          <TabsContent value="stream">
            <HashrateChart minerId={miner.id} />
          </TabsContent>
          <TabsContent value="stats">
            <MiningStatsCard minerId={miner.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
