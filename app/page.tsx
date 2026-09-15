"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MinerCard } from "@/components/miner-card"
import { Card } from "@/components/ui/card"
import type { Miner } from "@/lib/xmrig/types"

const API = "/api/miners"
const AUTO_REFRESH_MS = 30_000

async function fetchMiners(): Promise<Miner[]> {
  const res = await fetch(API)
  if (!res.ok) throw new Error("Failed to fetch miners")
  return res.json()
}

async function addMiner(data: { name: string; host: string; port: number; accessToken?: string }): Promise<Miner> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to add miner")
  return res.json()
}

async function updateMiner(id: string, data: { name?: string; host?: string; port?: number; accessToken?: string }): Promise<Miner> {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update miner")
  return res.json()
}

async function refreshMinerData(id: string) {
  const res = await fetch(`${API}/${id}/refresh`, { method: "POST" })
  if (!res.ok) throw new Error("Refresh failed")
  return res.json()
}

export default function DashboardPage() {
  const [miners, setMiners] = useState<Miner[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [form, setForm] = useState({ name: "", host: "127.0.0.1", port: "44444", accessToken: "" })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function load() {
    try {
      const data = await fetchMiners()
      setMiners(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(API)
      const data: Miner[] = await res.json()

      const results = await Promise.allSettled(
        data.map(async (m): Promise<Miner> => {
          try {
            const r = await refreshMinerData(m.id)
            return {
              ...m,
              lastSummary: r.summary,
              lastThreads: r.threads,
              lastConfig: r.config,
              error: r.error,
              lastUpdated: Date.now(),
            }
          } catch (e: any) {
            return { ...m, error: e.message, lastUpdated: Date.now() }
          }
        }),
      )

      const updated = results.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean) as Miner[]
      setMiners(updated)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load().then(() => {
      refreshAll()
      intervalRef.current = setInterval(refreshAll, AUTO_REFRESH_MS)
    })
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refreshAll])

  async function handleAdd() {
    const port = parseInt(form.port, 10)
    if (isNaN(port) || port < 1 || port > 65535) return
    const miner = await addMiner({
      name: form.name || `Miner ${miners.length + 1}`,
      host: form.host,
      port,
      accessToken: form.accessToken || undefined,
    })
    setMiners((prev) => [...prev, miner])
    setForm({ name: "", host: "127.0.0.1", port: "44444", accessToken: "" })
    setShowAdd(false)
  }

async function deleteMiner(id: string): Promise<void> {
  await fetch(`${API}/${id}`, { method: "DELETE" })
}

async function handleDelete(id: string) {
  await deleteMiner(id)
  setMiners((prev) => prev.filter((m) => m.id !== id))
}

function startEdit(miner: Miner) {
  setEditingId(miner.id)
  setEditName(miner.name)
}

async function saveEdit(id: string) {
  if (!editName.trim()) return
  const updated = await updateMiner(id, { name: editName.trim() })
  setMiners((prev) => prev.map((m) => (m.id === id ? updated : m)))
  setEditingId(null)
}

  const refreshMiner = useCallback((updated: Miner) => {
    setMiners((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">XMRig Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Monitor multiple XMRig miners
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshAll} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh All"}
            </Button>
            <Button onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? "Cancel" : "+ Add Miner"}
            </Button>
          </div>
        </div>

        {showAdd && (
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My Miner"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="127.0.0.1"
                  value={form.host}
                  onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder="44444"
                  value={form.port}
                  onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Optional"
                  value={form.accessToken}
                  onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleAdd}>
                  Add Miner
                </Button>
              </div>
            </div>
          </Card>
        )}

        {miners.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No miners configured. Click &quot;Add Miner&quot; to get started.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {miners.map((miner) => (
              <div key={miner.id} className="relative">
                {editingId === miner.id ? (
                  <Card className="p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(miner.id)}
                        className="max-w-xs"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => saveEdit(miner.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <MinerCard
                    miner={miner}
                    onRefresh={refreshMiner}
                    onDelete={handleDelete}
                    onEdit={startEdit}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}