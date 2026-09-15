"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DashboardToolbarProps {
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  sortBy: string
  onSortChange: (sort: string) => void
  sortDirection: "asc" | "desc"
  onSortDirectionChange: (dir: "asc" | "desc") => void

  groups: string[]
  activeGroup: string | null
  onGroupChange: (group: string | null) => void
  onManageGroups: () => void

  onSelectAll: () => void
  onDeselectAll: () => void
  onInvertSelection: () => void
  selectedCount: number
  totalCount: number

  search: string
  onSearchChange: (q: string) => void

  retentionDays: number
  onRetentionChange: (days: number) => void
  onRunRetention: () => void
  onExport: () => void
}

export function DashboardToolbar({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  groups,
  activeGroup,
  onGroupChange,
  onManageGroups,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  selectedCount,
  totalCount,
  search,
  onSearchChange,
  retentionDays,
  onRetentionChange,
  onRunRetention,
  onExport,
}: DashboardToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search miners..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-48 h-8 text-sm"
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => onViewModeChange("grid")}
          >
            Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => onViewModeChange("list")}
          >
            List
          </Button>
        </div>

        <div className="flex gap-1 items-center">
          <label className="text-xs text-muted-foreground">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value="name">Name</option>
            <option value="hashrate">Hashrate</option>
            <option value="uptime">Uptime</option>
            <option value="status">Status</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")}
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <div className="flex gap-1 items-center">
          <label className="text-xs text-muted-foreground">Group:</label>
          <select
            value={activeGroup ?? ""}
            onChange={(e) => onGroupChange(e.target.value || null)}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value="">All</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={onManageGroups}>
            Manage
          </Button>
        </div>

        <div className="flex gap-1 items-center">
          <label className="text-xs text-muted-foreground">Keep:</label>
          <Input
            type="number"
            min={1}
            value={retentionDays}
            onChange={(e) => onRetentionChange(parseInt(e.target.value, 10) || 30)}
            className="w-14 h-8 text-xs px-2"
          />
          <span className="text-xs text-muted-foreground">days</span>
          <Button size="sm" variant="outline" onClick={onRunRetention}>
            Prune
          </Button>
        </div>

        <Button size="sm" variant="outline" onClick={onExport}>
          Export
        </Button>

        <div className="ml-auto flex gap-1 items-center">
          <span className="text-xs text-muted-foreground">
            {selectedCount}/{totalCount} selected
          </span>
          <Button size="sm" variant="outline" onClick={onSelectAll}>
            All
          </Button>
          <Button size="sm" variant="outline" onClick={onDeselectAll}>
            None
          </Button>
          <Button size="sm" variant="outline" onClick={onInvertSelection}>
            Invert
          </Button>
        </div>
      </div>
    </div>
  )
}
