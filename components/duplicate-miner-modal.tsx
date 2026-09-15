"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Plus, Save, X } from "lucide-react"
import type { Miner } from "@/lib/xmrig/types"

interface DuplicateMinerModalProps {
  source: Miner
  onSave: (draft: { name: string; host: string; port: number; accessToken?: string; tags: string[]; duplicateToken: boolean }) => Promise<void>
  onClose: () => void
}

function incrementIp(ip: string): string {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return ip
  const [, a, b, c, d] = m
  const next = (parseInt(d, 10) + 1) % 255
  return `${a}.${b}.${c}.${next}`
}

export function DuplicateMinerModal({ source, onSave, onClose }: DuplicateMinerModalProps) {
  const [draft, setDraft] = useState({
    name: `${source.name} (copy)`,
    host: incrementIp(source.host),
    port: String(source.port),
    tags: (source.tags || []).join(", "),
    newAccessToken: "",
    duplicateToken: !source.accessToken,
  })
  const [saving, setSaving] = useState(false)

  function handleIncrement() {
    setDraft((d) => ({ ...d, host: incrementIp(d.host) }))
  }

  async function handleSave() {
    const port = parseInt(draft.port, 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      alert("Port must be 1-65535")
      return
    }
    if (!draft.name.trim()) {
      alert("Name is required")
      return
    }
    setSaving(true)
    try {
      await onSave({
        name: draft.name.trim(),
        host: draft.host.trim(),
        port,
        accessToken: draft.newAccessToken.trim() || undefined,
        tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        duplicateToken: draft.duplicateToken,
      })
      onClose()
    } catch (e: any) {
      alert("Failed to save: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Duplicate Miner</CardTitle>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-muted bg-muted/30 p-3 text-xs text-muted-foreground">
            Copying from <span className="font-mono text-foreground">{source.name}</span> at{" "}
            <span className="font-mono text-foreground">{source.host}:{source.port}</span>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8 space-y-2">
              <Label>Host (suggested +1)</Label>
              <Input
                value={draft.host}
                onChange={(e) => setDraft((d) => ({ ...d, host: e.target.value }))}
              />
            </div>
            <div className="col-span-4 space-y-2">
              <Label>&nbsp;</Label>
              <Button type="button" variant="outline" className="w-full" onClick={handleIncrement}>
                <Plus className="h-3.5 w-3.5 mr-1" /> +1
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Port</Label>
            <Input
              value={draft.port}
              type="number"
              onChange={(e) => setDraft((d) => ({ ...d, port: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={draft.tags}
              onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
              placeholder="Comma-separated"
            />
            <p className="text-[11px] text-muted-foreground">
              Inherited from source. Edit freely.
            </p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Access Token</Label>
            {source.accessToken ? (
              <>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.duplicateToken}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, duplicateToken: e.target.checked }))
                    }
                    className="rounded"
                  />
                  Duplicate source token
                </label>
                {!draft.duplicateToken && (
                  <Input
                    type="password"
                    value={draft.newAccessToken}
                    onChange={(e) => setDraft((d) => ({ ...d, newAccessToken: e.target.value }))}
                    placeholder="Leave blank for none, or set a new one"
                  />
                )}
              </>
            ) : (
              <Input
                type="password"
                value={draft.newAccessToken}
                onChange={(e) => setDraft((d) => ({ ...d, newAccessToken: e.target.value }))}
                placeholder="Optional — source had no token"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Discard
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save new miner"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
