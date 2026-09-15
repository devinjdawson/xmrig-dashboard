"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MinerConfig } from "./miner-config"
import { MinerSummary } from "./miner-summary"
import { MinerThreads } from "./miner-threads"
import { HashrateChart } from "./hashrate-chart"
import type { Miner } from "@/lib/xmrig/types"

interface MinerCardProps {
  miner: Miner
  onRefresh: (miner: Miner) => void
  onDelete: (id: string) => void
  onEdit: (miner: Miner) => void
}

export function MinerCard({ miner, onRefresh, onDelete, onEdit }: MinerCardProps) {
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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{miner.name}</CardTitle>
          <p className="text-xs text-muted-foreground font-mono">
            {miner.host}:{miner.port}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "success" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <Button size="sm" onClick={testConnection}>
            Test
          </Button>
          <Button size="sm" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(miner)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(miner.id)}
          >
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {testResult && (
          <p className={`text-sm ${testResult.ok ? "text-green-500" : "text-destructive"}`}>
            {testResult.ok ? "Connection OK" : `Failed: ${testResult.error}`}
          </p>
        )}
        {miner.error && (
          <>
            <p className="text-sm text-destructive">Error: {miner.error}</p>
            <Separator className="my-3" />
          </>
        )}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="stream">Stream</TabsTrigger>
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
        </Tabs>
      </CardContent>
    </Card>
  )
}