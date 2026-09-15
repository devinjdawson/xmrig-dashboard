"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface GroupManagerProps {
  groups: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
  onRename: (oldName: string, newName: string) => void
  onClose: () => void
}

export function GroupManager({ groups, onAdd, onRemove, onRename, onClose }: GroupManagerProps) {
  const [newGroup, setNewGroup] = useState("")
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  function handleAdd() {
    const trimmed = newGroup.trim()
    if (!trimmed || groups.includes(trimmed)) return
    onAdd(trimmed)
    setNewGroup("")
  }

  function startRename(group: string) {
    setEditingGroup(group)
    setEditName(group)
  }

  function saveRename(oldName: string) {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === oldName || groups.includes(trimmed)) {
      setEditingGroup(null)
      return
    }
    onRename(oldName, trimmed)
    setEditingGroup(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Manage Groups</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="New group name"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd}>Add</Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No groups yet</p>
          ) : (
            groups.map((group) => (
              <div key={group} className="flex items-center gap-2 p-2 rounded border">
                {editingGroup === group ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(group)
                        if (e.key === "Escape") setEditingGroup(null)
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => saveRename(group)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingGroup(null)}>✕</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{group}</span>
                    <Button size="sm" variant="ghost" onClick={() => startRename(group)}>Rename</Button>
                    <Button size="sm" variant="ghost" onClick={() => onRemove(group)}>Remove</Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
