"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RefreshCw, ShieldBan, ShieldOff } from "lucide-react"

interface Ban {
  host: string
  ip: number
  seconds: number
}

export function MoneroBans({
  url,
  user,
  pass,
}: {
  url: string
  user?: string
  pass?: string
}) {
  const [bans, setBans] = useState<Ban[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [newHost, setNewHost] = useState("")
  const [newSeconds, setNewSeconds] = useState("3600")

  const qs = useCallback(() => {
    const params = new URLSearchParams({ url })
    if (user) params.set("user", user)
    if (pass) params.set("pass", pass)
    return params.toString()
  }, [url, user, pass])

  const load = useCallback(async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch(`/api/monero/bans?${qs()}`)
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setBans(data?.bans || [])
        setError(null)
      } else {
        setError(data?.error || `HTTP ${res.status}`)
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch bans")
    } finally {
      setLoading(false)
    }
  }, [url, qs])

  useEffect(() => {
    load()
  }, [load])

  async function mutate(action: "ban" | "unban", host: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/monero/bans?${qs()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          host,
          seconds: action === "ban" ? Number(newSeconds) || 0 : 0,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || `HTTP ${res.status}`)
      }
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  if (!url) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium">Banned Peers</CardTitle>
          <CardDescription>Manage the Monero daemon peer ban list (monerod set_bans)</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{bans.length}</Badge>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-xs text-destructive break-words">{error}</p>}

        {bans.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host</TableHead>
                <TableHead className="text-right">Seconds left</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bans.slice(0, 50).map((b, i) => (
                <TableRow key={`${b.host}-${i}`}>
                  <TableCell className="font-mono text-xs">{b.host}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{b.seconds ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => mutate("unban", b.host)}
                    >
                      <ShieldOff className="h-3 w-3" />
                      Unban
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={newHost}
            onChange={(e) => setNewHost(e.target.value)}
            placeholder="IP to ban"
            className="font-mono text-xs max-w-[220px]"
          />
          <Input
            value={newSeconds}
            onChange={(e) => setNewSeconds(e.target.value)}
            placeholder="seconds"
            className="text-xs w-24"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !newHost.trim()}
            onClick={() => mutate("ban", newHost.trim())}
          >
            <ShieldBan className="h-3 w-3" />
            Ban
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
