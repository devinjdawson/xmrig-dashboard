import { readFile } from "fs/promises"
import path from "path"
import net from "net"
import { validateConsoleCommand } from "./p2pool-console-commands"

export { validateConsoleCommand, P2POOL_CONSOLE_COMMANDS } from "./p2pool-console-commands"

// P2Pool's console TCP server binds to 127.0.0.1 on the machine running
// P2Pool. Override P2POOL_CONSOLE_HOST only if something (sidecar,
// socat, host networking) makes it reachable from the dashboard process.
const CONSOLE_HOST = process.env.P2POOL_CONSOLE_HOST || "127.0.0.1"
const CONSOLE_TIMEOUT_MS = 5000

interface ConsoleTarget {
  mode: string
  tcp_port: number
  cookie: string
}

export function consoleConfigured(): boolean {
  return Boolean(process.env.P2POOL_API_DIR)
}

async function readConsoleTarget(): Promise<ConsoleTarget> {
  const apiDir = process.env.P2POOL_API_DIR
  if (!apiDir) {
    throw new Error("P2POOL_API_DIR is not configured")
  }

  let data: ConsoleTarget
  const consoleFile = path.join(apiDir, "local", "console")
  try {
    const raw = await readFile(consoleFile, "utf-8")
    data = JSON.parse(raw)
  } catch (e: any) {
    throw new Error(
      `Cannot read P2Pool console file (${consoleFile}: ${e?.code || e?.message || "error"}). ` +
        "Start P2Pool with --data-api api --local-api so it writes local/console.",
    )
  }

  if (!data || typeof data.tcp_port !== "number" || typeof data.cookie !== "string" || !data.cookie) {
    throw new Error("P2Pool local/console file is malformed")
  }
  return data
}

export async function consoleStatus(): Promise<{
  configured: boolean
  reachable: boolean
  mode?: string
  tcpPort?: number
  error?: string
}> {
  if (!consoleConfigured()) {
    return { configured: false, reachable: false, error: "P2POOL_API_DIR is not configured" }
  }
  try {
    const target = await readConsoleTarget()
    const reachable = await probeTcp(target.tcp_port)
    return {
      configured: true,
      reachable,
      mode: target.mode,
      tcpPort: target.tcp_port,
      error: reachable ? undefined : `Cannot reach the console at ${CONSOLE_HOST}:${target.tcp_port}`,
    }
  } catch (e: any) {
    return { configured: true, reachable: false, error: e?.message || String(e) }
  }
}

function probeTcp(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host: CONSOLE_HOST, port })
    const done = (value: boolean) => {
      sock.destroy()
      resolve(value)
    }
    sock.setTimeout(2000, () => done(false))
    sock.once("connect", () => done(true))
    sock.once("error", () => done(false))
  })
}

export interface ConsoleSendResult {
  command: string
}

export async function sendConsoleCommand(input: string): Promise<ConsoleSendResult> {
  const validation = validateConsoleCommand(input)
  if (!validation.ok) {
    throw new Error(validation.error)
  }

  const target = await readConsoleTarget()
  const payload = `${target.cookie}${validation.command}\n`

  await new Promise<void>((resolve, reject) => {
    const sock = net.connect({ host: CONSOLE_HOST, port: target.tcp_port })
    const timer = setTimeout(() => {
      sock.destroy()
      reject(new Error(`Console connection timed out after ${CONSOLE_TIMEOUT_MS} ms`))
    }, CONSOLE_TIMEOUT_MS)

    sock.once("error", (e) => {
      clearTimeout(timer)
      sock.destroy()
      reject(new Error(`Failed to reach P2Pool console (${CONSOLE_HOST}:${target.tcp_port}): ${e.message}`))
    })
    sock.once("connect", () => {
      sock.write(payload, (err) => {
        clearTimeout(timer)
        sock.destroy()
        if (err) reject(new Error(`Failed to send command: ${err.message}`))
        else resolve()
      })
    })
  })

  return { command: validation.command }
}
