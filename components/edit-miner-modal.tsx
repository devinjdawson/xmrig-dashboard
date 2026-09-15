"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import type { Miner } from "@/lib/xmrig/types"

interface EditMinerModalProps {
  miner: Miner
  onSave: (id: string, updates: { name?: string; host?: string; port?: number; accessToken?: string; tags?: string[] }) => Promise<void>
  onClose: () => void
}

export function EditMinerModal({ miner, onSave, onClose }: EditMinerModalProps) {
  const [form, setForm] = useState({
    name: miner.name,
    host: miner.host,
    port: String(miner.port),
    accessToken: "",
    tags: (miner.tags || []).join(", "),
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const port = parseInt(form.port, 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      alert("Port must be a valid number between 1 and 65535")
      return
    }

    if (!form.name.trim()) {
      alert("Name is required")
      return
    }

    setSaving(true)
    try {
      const updates: any = {
        name: form.name.trim(),
        host: form.host.trim(),
        port,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }

      // Only include accessToken if user explicitly changed it
      if (form.accessToken.trim()) {
        updates.accessToken = form.accessToken.trim()
      }

      await onSave(miner.id, updates)
      onClose()
    } catch (e: any) {
      alert("Failed to save: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Edit Miner</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Miner"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Host</Label>
              <Input
                value={form.host}
                onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
                placeholder="127.0.0.1"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                value={form.port}
                onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                placeholder="44444"
                type="number"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              value={form.accessToken}
              onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
              placeholder={miner.accessToken ? "•••••••• (leave blank to keep)" : "optional"}
              type="password"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to keep the current token. Enter a new value to update.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="group1, group2"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
