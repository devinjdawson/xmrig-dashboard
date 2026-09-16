"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MinerCard } from "@/components/miner-card"
import { Card } from "@/components/ui/card"
import { DashboardToolbar } from "@/components/dashboard-toolbar"
import { MinerTable } from "@/components/miner-table"
import { GroupManager } from "@/components/group-manager"
import { NetworkSettings } from "@/components/network-settings"
import { EditMinerModal } from "@/components/edit-miner-modal"
import { DuplicateMinerModal } from "@/components/duplicate-miner-modal"
import { MinerGroup } from "@/components/miner-group"
import { MinerGrid } from "@/components/miner-grid"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { loadEndpoints, saveEndpoints, type NetworkEndpoints } from "@/lib/network-endpoints"
import type { Miner } from "@/lib/xmrig/types"

const API = "/api/miners"
const AUTO_REFRESH_MS = 30_000
const SELECTION_KEY = "xmrig-selection"
const RETENTION_KEY = "xmrig-retention-days"
const COLLAPSED_KEY = "xmrig-collapsed-groups"

async function fetchMiners(): Promise<Miner[]> {
  const res = await fetch(API)
  if (!res.ok) throw new Error("Failed to fetch miners")
  return res.json()
}

async function addMiner(data: { name: string; host: string; port: number; accessToken?: string; tags?: string[] }): Promise<Miner> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to add miner")
  return res.json()
}

async function updateMiner(id: string, data: { name?: string; host?: string; port?: number; accessToken?: string; tags?: string[] }): Promise<Miner> {
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
  const [duplicatingMiner, setDuplicatingMiner] = useState<Miner | null>(null)
  const [form, setForm] = useState({ name: "", host: "127.0.0.1", port: "44444", accessToken: "", tags: "" })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("list")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [showGroupManager, setShowGroupManager] = useState(false)
  const [showNetworkSettings, setShowNetworkSettings] = useState(false)
  const [endpoints, setEndpoints] = useState<NetworkEndpoints>(() => loadEndpoints())

  // One-time migration: if stored endpoints have stray whitespace, persist the cleaned versions
  useEffect(() => {
    saveEndpoints(endpoints)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [retentionDays, setRetentionDays] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(RETENTION_KEY)
      return saved ? parseInt(saved, 10) || 30 : 30
    }
    return 30
  })
  const [search, setSearch] = useState("")

  const [selectedMiners, setSelectedMiners] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SELECTION_KEY)
      if (saved) return new Set(JSON.parse(saved))
    }
    return new Set()
  })

  useEffect(() => {
    localStorage.setItem(SELECTION_KEY, JSON.stringify([...selectedMiners]))
  }, [selectedMiners])

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COLLAPSED_KEY)
      if (saved) return new Set(JSON.parse(saved))
    }
    return new Set()
  })

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsedGroups]))
  }, [collapsedGroups])

  function setGroupCollapsed(label: string, collapsed: boolean) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (collapsed) next.add(label)
      else next.delete(label)
      return next
    })
  }

  const groups = useMemo(() => {
    const allTags = miners.flatMap((m) => m.tags || [])
    return [...new Set(allTags)].sort()
  }, [miners])

  const filteredAndSortedMiners = useMemo(() => {
    let filtered = miners

    if (activeGroup) {
      filtered = filtered.filter((m) => (m.tags || []).includes(activeGroup))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.host.toLowerCase().includes(q) ||
        (m.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    }

    filtered.sort((a, b) => {
      let cmp = 0
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name)
      } else if (sortBy === "hashrate") {
        const ahr = a.lastSummary?.hashrate.total[0] ?? 0
        const bhr = b.lastSummary?.hashrate.total[0] ?? 0
        cmp = ahr - bhr
      } else if (sortBy === "uptime") {
        const aUp = a.lastSummary?.connection.uptime ?? 0
        const bUp = b.lastSummary?.connection.uptime ?? 0
        cmp = aUp - bUp
      } else if (sortBy === "status") {
        const aOnline = a.lastSummary && !a.error ? 1 : 0
        const bOnline = b.lastSummary && !b.error ? 1 : 0
        cmp = aOnline - bOnline
      }
      return sortDirection === "asc" ? cmp : -cmp
    })

    return filtered
  }, [miners, sortBy, sortDirection, activeGroup, search])

  async function load() {
    try {
      const data = await fetchMiners()
      setMiners(data)
      setSelectedMiners((prev) => {
        const newSet = new Set(prev)
        data.forEach((m) => newSet.add(m.id))
        return newSet
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    localStorage.setItem(RETENTION_KEY, String(retentionDays))
  }, [retentionDays])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(API)
      const data: Miner[] = await res.json()

      const results = await Promise.allSettled(
        data.map(async (m): Promise<Miner> => {
          const refreshRes = await fetch(`/api/miners/${m.id}/refresh`, { method: "POST" })
          if (!refreshRes.ok) throw new Error("Refresh failed")
          const r = await refreshRes.json()
          return {
            ...m,
            lastSummary: r.summary,
            lastThreads: r.threads,
            lastConfig: r.config,
            error: r.error,
            threadsError: r.threadsError,
            configError: r.configError,
            lastUpdated: Date.now(),
          }
        }),
      )

      const updated = results.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean) as Miner[]
      setMiners(updated)
    } catch {
      // transient failure (server restart, network blip) — keep stale data
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

  async function runRetention() {
    const res = await fetch("/api/cron/retention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: retentionDays }),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`Deleted ${data.deleted} snapshots older than ${retentionDays} days`)
    }
  }

  function exportData() {
    const exportObj = {
      miners: miners.map((m) => ({
        id: m.id,
        name: m.name,
        host: m.host,
        port: m.port,
        tags: m.tags,
      })),
      endpoints,
      retentionDays,
      groups,
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `xmrig-dashboard-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAdd() {
    const port = parseInt(form.port, 10)
    if (isNaN(port) || port < 1 || port > 65535) return
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean)
    const miner = await addMiner({
      name: form.name || `Miner ${miners.length + 1}`,
      host: form.host,
      port,
      accessToken: form.accessToken || undefined,
      tags,
    })
    setMiners((prev) => [...prev, { ...miner, tags }])
    setSelectedMiners((prev) => new Set([...prev, miner.id]))
    setForm({ name: "", host: "127.0.0.1", port: "44444", accessToken: "", tags: "" })
    setShowAdd(false)
  }

  async function deleteMiner(id: string): Promise<void> {
    await fetch(`${API}/${id}`, { method: "DELETE" })
  }

  async function handleDelete(id: string) {
    await deleteMiner(id)
    setMiners((prev) => prev.filter((m) => m.id !== id))
    setSelectedMiners((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function startEdit(miner: Miner) {
    setEditingId(miner.id)
  }

  async function saveEdit(id: string, updates: { name?: string; host?: string; port?: number; accessToken?: string; tags?: string[] }) {
    const updated = await updateMiner(id, updates)
    setMiners((prev) => prev.map((m) => (m.id === id ? updated : m)))
    setEditingId(null)
  }

  const refreshMiner = useCallback((updated: Miner) => {
    setMiners((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
  }, [])

  function toggleSelection(id: string) {
    setSelectedMiners((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedMiners(new Set(filteredAndSortedMiners.map((m) => m.id)))
  }

  function deselectAll() {
    setSelectedMiners(new Set())
  }

  function invertSelection() {
    setSelectedMiners((prev) => {
      const next = new Set<string>()
      filteredAndSortedMiners.forEach((m) => {
        if (!prev.has(m.id)) next.add(m.id)
      })
      return next
    })
  }

  async function handleGroupAdd(name: string) {
    setMiners((prev) => prev.map((m) => {
      if (selectedMiners.has(m.id) && !(m.tags || []).includes(name)) {
        const updated = { ...m, tags: [...(m.tags || []), name] }
        updateMiner(m.id, { tags: updated.tags }).catch(() => {})
        return updated
      }
      return m
    }))
  }

  async function handleGroupRemove(name: string) {
    const minersWithTag = miners.filter((m) => (m.tags || []).includes(name))
    const confirmed = window.confirm(
      `Remove group "${name}"?\n\nThis will remove the "${name}" tag from ${minersWithTag.length} miner(s).`
    )
    if (!confirmed) return

    // Optimistic update
    setMiners((prev) => prev.map((m) => {
      if ((m.tags || []).includes(name)) {
        const updated = { ...m, tags: (m.tags || []).filter((t) => t !== name) }
        return updated
      }
      return m
    }))

    // Persist to database
    const results = await Promise.allSettled(
      minersWithTag.map((m) => 
        updateMiner(m.id, { tags: m.tags.filter((t) => t !== name) })
      )
    )

    const failed = results.filter((r) => r.status === "rejected")
    if (failed.length > 0) {
      console.error(`Failed to update ${failed.length} miner(s):`, failed)
      alert(`Warning: Failed to remove "${name}" from ${failed.length} miner(s). Check console for details.`)
      // Refresh to get accurate state
      await load()
    }

    if (activeGroup === name) setActiveGroup(null)
  }

  async function handleGroupRename(oldName: string, newName: string) {
    setMiners((prev) => prev.map((m) => {
      if ((m.tags || []).includes(oldName)) {
        const updated = { ...m, tags: (m.tags || []).map((t) => t === oldName ? newName : t) }
        updateMiner(m.id, { tags: updated.tags }).catch(() => {})
        return updated
      }
      return m
    }))
    if (activeGroup === oldName) setActiveGroup(newName)
  }

  function startDuplicate(miner: Miner) {
    setDuplicatingMiner(miner)
  }

  async function handleDuplicateSave(draft: {
    name: string
    host: string
    port: number
    accessToken?: string
    tags: string[]
    duplicateToken: boolean
  }) {
    const payload = {
      name: draft.name,
      host: draft.host,
      port: draft.port,
      tags: draft.tags,
      accessToken:
        draft.duplicateToken && duplicatingMiner?.accessToken
          ? duplicatingMiner.accessToken
          : draft.accessToken || undefined,
    }
    const miner = await addMiner(payload)
    setMiners((prev) => [...prev, { ...miner, tags: draft.tags }])
    setSelectedMiners((prev) => new Set([...prev, miner.id]))
  }

  const groupedMiners = useMemo(() => {
    const buckets = new Map<string, Miner[]>()
    for (const m of filteredAndSortedMiners) {
      const tags = m.tags && m.tags.length > 0 ? m.tags : [""]
      for (const t of tags) {
        const key = t || "Ungrouped"
        if (!buckets.has(key)) buckets.set(key, [])
        buckets.get(key)!.push(m)
      }
    }
    const sortedKeys = [...buckets.keys()].sort((a, b) => {
      if (a === "Ungrouped") return 1
      if (b === "Ungrouped") return -1
      return a.localeCompare(b)
    })
    return sortedKeys.map((k) => ({ label: k, miners: buckets.get(k)! }))
  }, [filteredAndSortedMiners])

  const totalHashrate = useMemo(() =>
    miners.reduce((sum, m) => sum + (m.lastSummary?.hashrate?.total?.[0] ?? 0), 0),
    [miners]
  )
  const onlineCount = useMemo(() =>
    miners.filter((m) => m.lastSummary !== null && m.error === null).length,
    [miners]
  )
  const totalSharesGood = useMemo(() =>
    miners.reduce((sum, m) => sum + (m.lastSummary?.results?.shares_good ?? 0), 0),
    [miners]
  )
  const totalSharesTotal = useMemo(() =>
    miners.reduce((sum, m) => sum + (m.lastSummary?.results?.shares_total ?? 0), 0),
    [miners]
  )
  const avgAcceptRate = totalSharesTotal > 0
    ? ((totalSharesGood / totalSharesTotal) * 100).toFixed(1)
    : "0.0"
  const combinedUptime = useMemo(() => {
    const total = miners.reduce((sum, m) => sum + (m.lastSummary?.connection?.uptime ?? 0), 0)
    const d = Math.floor(total / 86400)
    const h = Math.floor((total % 86400) / 3600)
    const mi = Math.floor((total % 3600) / 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${mi}m`
    return `${mi}m`
  }, [miners])

  const sidebarProps = {
    miners,
    totalHashrate,
    onlineCount,
    totalSharesGood,
    totalSharesTotal,
    avgAcceptRate,
    combinedUptime,
    p2poolUrl: endpoints.p2poolUrl,
    moneroUrl: endpoints.moneroUrl,
    moneroUser: endpoints.moneroUser,
    moneroPass: endpoints.moneroPass,
    tariUrl: endpoints.tariUrl,
    onOpenNetworkSettings: () => setShowNetworkSettings(true),
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar {...sidebarProps} miners={[]} />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col p-6">
            <div className="mx-auto w-full max-w-6xl space-y-6">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar {...sidebarProps} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={refreshAll} disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh All"}
              </Button>
              <Button onClick={() => setShowAdd(!showAdd)}>
                {showAdd ? "Cancel" : "+ Add Miner"}
              </Button>
            </div>

        {showAdd && (
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-6">
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
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="group1, group2"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
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

        {miners.length > 0 && (
          <>
            <DashboardToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              groups={groups}
              activeGroup={activeGroup}
              onGroupChange={setActiveGroup}
              onManageGroups={() => setShowGroupManager(true)}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onInvertSelection={invertSelection}
              selectedCount={selectedMiners.size}
              totalCount={filteredAndSortedMiners.length}
              search={search}
              onSearchChange={setSearch}
              retentionDays={retentionDays}
              onRetentionChange={setRetentionDays}
              onRunRetention={runRetention}
              onExport={exportData}
            />
          </>
        )}

        {miners.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No miners configured. Click &quot;Add Miner&quot; to get started.
            </p>
          </Card>
        ) : viewMode === "table" ? (
          <MinerTable
            miners={filteredAndSortedMiners}
            selectedMiners={selectedMiners}
            onToggleSelection={toggleSelection}
            onEdit={startEdit}
            onDelete={handleDelete}
            onRefresh={refreshMiner}
            onDuplicate={startDuplicate}
          />
        ) : viewMode === "grid" ? (
          <div className="space-y-4">
            {groupedMiners.map(({ label, miners: bucket }) => (
              <MinerGroup
                key={label}
                label={label}
                miners={bucket}
                selectedMiners={selectedMiners}
                initialCollapsed={collapsedGroups.has(label)}
                onCollapseChange={(c) => setGroupCollapsed(label, c)}
              >
                <MinerGrid
                  miners={bucket}
                  selectedMiners={selectedMiners}
                  onToggleSelection={toggleSelection}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onRefresh={refreshMiner}
                  onDuplicate={startDuplicate}
                />
              </MinerGroup>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMiners.map(({ label, miners: bucket }) => (
              <MinerGroup
                key={label}
                label={label}
                miners={bucket}
                selectedMiners={selectedMiners}
                initialCollapsed={collapsedGroups.has(label)}
                onCollapseChange={(c) => setGroupCollapsed(label, c)}
              >
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                  {bucket.map((miner) =>
                    editingId === miner.id ? (
                      <EditMinerModal
                        key={miner.id}
                        miner={miner}
                        onSave={saveEdit}
                        onClose={() => setEditingId(null)}
                      />
                    ) : (
                      <MinerCard
                        key={miner.id}
                        miner={miner}
                        onRefresh={refreshMiner}
                        onDelete={handleDelete}
                        onEdit={startEdit}
                        onDuplicate={startDuplicate}
                      />
                    ),
                  )}
                </div>
              </MinerGroup>
            ))}
          </div>
        )}
      </div>

      {showGroupManager && (
        <GroupManager
          groups={groups}
          onAdd={handleGroupAdd}
          onRemove={handleGroupRemove}
          onRename={handleGroupRename}
          onClose={() => setShowGroupManager(false)}
        />
      )}

      {showNetworkSettings && (
        <NetworkSettings
          onSave={(ep) => setEndpoints(ep)}
          onClose={() => setShowNetworkSettings(false)}
        />
      )}

      {duplicatingMiner && (
        <DuplicateMinerModal
          source={duplicatingMiner}
          onSave={handleDuplicateSave}
          onClose={() => setDuplicatingMiner(null)}
        />
      )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}