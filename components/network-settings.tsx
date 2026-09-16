"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { loadEndpoints, saveEndpoints, type NetworkEndpoints } from "@/lib/network-endpoints"

interface NetworkSettingsProps {
  onSave: (ep: NetworkEndpoints) => void
  onClose: () => void
}

export function NetworkSettings({ onSave, onClose }: NetworkSettingsProps) {
  const [form, setForm] = useState<NetworkEndpoints>(loadEndpoints())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Network Settings</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">P2Pool</h3>
            <div className="space-y-2">
              <Label>P2Pool API URL</Label>
              <Input
                placeholder="http://localhost:3334"
                value={form.p2poolUrl}
                onChange={(e) => setForm((f) => ({ ...f, p2poolUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Typically your p2pool instance URL (e.g. http://node1.p2pool:3334)
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">Monero Node (monerod)</h3>
            <div className="space-y-2">
              <Label>RPC URL</Label>
              <Input
                placeholder="http://127.0.0.1:18081"
                value={form.moneroUrl}
                onChange={(e) => setForm((f) => ({ ...f, moneroUrl: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>RPC Login (user)</Label>
                <Input
                  placeholder="optional"
                  value={form.moneroUser}
                  onChange={(e) => setForm((f) => ({ ...f, moneroUser: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>RPC Login (pass)</Label>
                <Input
                  type="password"
                  placeholder="optional"
                  value={form.moneroPass}
                  onChange={(e) => setForm((f) => ({ ...f, moneroPass: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use mainnet defaults. Set restricted-rpc on monerod for safer public access.
            </p>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">Tari Node (Minotari)</h3>
            <div className="space-y-2">
              <Label>HTTP API URL</Label>
              <Input
                placeholder="http://127.0.0.1:9000"
                value={form.tariUrl}
                onChange={(e) => setForm((f) => ({ ...f, tariUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Minotari base node HTTP API. Default port: 9000 (mainnet).
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              saveEndpoints(form)
              onSave(form)
              onClose()
            }}
          >
            Save
          </Button>
        </div>
      </Card>
    </div>
  )
}
