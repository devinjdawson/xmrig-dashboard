"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TerminalSquare, Send } from "lucide-react"
import {
  P2POOL_CONSOLE_COMMANDS,
  findCommand,
  validateConsoleCommand,
  type ConsoleCommandDef,
} from "@/lib/p2pool-console-commands"

interface ConsoleState {
  configured: boolean
  reachable: boolean
  mode?: string
  tcpPort?: number
  error?: string
}

export function P2PoolConsole() {
  const [state, setState] = useState<ConsoleState | null>(null)
  const [command, setCommand] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/p2pool/console")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setState(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!state?.configured) return null

  async function run(raw: string) {
    const validation = validateConsoleCommand(raw)
    if (!validation.ok) {
      setMessage({ ok: false, text: validation.error })
      return
    }
    const def = findCommand(validation.command.split(" ")[0]) as ConsoleCommandDef | undefined
    if (def?.danger && !confirm(`Run "${def.label}"? ${def.description}.`)) {
      return
    }

    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/p2pool/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: validation.command }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setMessage({
          ok: true,
          text: `Sent "${data.command}". P2Pool does not return console output over TCP — check its log.`,
        })
      } else {
        setMessage({ ok: false, text: data?.error || `HTTP ${res.status}` })
      }
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message || "Failed to send command" })
    } finally {
      setBusy(false)
    }
  }

  function pick(def: ConsoleCommandDef) {
    if (def.argPattern) {
      setCommand(`${def.name} `)
      inputRef.current?.focus()
      return
    }
    run(def.name)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">Console</CardTitle>
        </div>
        <Badge variant={state.reachable ? "success" : "destructive"}>
          {state.reachable ? `TCP :${state.tcpPort} (${state.mode})` : "Unreachable"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <p className="text-xs text-destructive break-words">
            {state.error}. P2Pool binds its console to 127.0.0.1 on the machine running P2Pool; the dashboard
            must be able to reach that address (host networking or a forwarder).
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {P2POOL_CONSOLE_COMMANDS.map((def) => (
            <Button
              key={def.name}
              variant={def.danger ? "destructive" : "outline"}
              size="sm"
              disabled={busy || !state.reachable}
              onClick={() => pick(def)}
              title={def.description}
            >
              {def.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) run(command)
            }}
            placeholder="command (e.g. status, loglevel 4, addpeers 1.2.3.4:18080)"
            className="font-mono text-xs"
          />
          <Button size="sm" disabled={busy || !state.reachable} onClick={() => run(command)}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {message && (
          <p className={`text-xs break-words ${message.ok ? "text-muted-foreground" : "text-destructive"}`}>
            {message.text}
          </p>
        )}

        <CardDescription>
          Read-only commands (status, peers, workers, bans) print to the P2Pool console/log, not back over TCP.
          Data on this page comes from P2Pool API files, so hit Refresh after acting.
        </CardDescription>
      </CardContent>
    </Card>
  )
}
