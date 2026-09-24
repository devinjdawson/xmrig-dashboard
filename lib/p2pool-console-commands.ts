// Client-safe: metadata + validation for P2Pool console commands.
// Keep this file free of Node builtins so UI components can import it.

export interface ConsoleCommandDef {
  name: string
  label: string
  description: string
  argHint?: string
  argPattern?: RegExp
  argMessage?: string
  danger?: boolean
}

export const P2POOL_CONSOLE_COMMANDS: ConsoleCommandDef[] = [
  { name: "help", label: "Help", description: "List all console commands" },
  { name: "status", label: "Status", description: "Full node status (output goes to the p2pool log)" },
  { name: "version", label: "Version", description: "Show p2pool version" },
  { name: "peers", label: "Peers", description: "Show connected p2p peers" },
  { name: "workers", label: "Workers", description: "Show connected stratum workers" },
  { name: "bans", label: "Bans", description: "Show banned IPs" },
  { name: "hosts", label: "Hosts", description: "Show configured Monero hosts" },
  { name: "next_host", label: "Next host", description: "Switch to the next Monero host" },
  { name: "loglevel", label: "Log level", description: "Set log verbosity (0-6)", argHint: "0", argPattern: /^[0-6]$/, argMessage: "Log level must be 0-6" },
  {
    name: "addpeers",
    label: "Add peers",
    description: "Connect to comma-separated IP:port peers",
    argHint: "1.2.3.4:18080,5.6.7.8:18080",
    argPattern: /^[A-Za-z0-9._\-:[\]]+(,[A-Za-z0-9._\-:[\]]+)*$/,
    argMessage: "Peers must be a comma-separated list of host:port",
  },
  { name: "droppeers", label: "Drop peers", description: "Disconnect all p2p peers", danger: true },
  { name: "outpeers", label: "Outgoing peers", description: "Set max outgoing connections (>50 not recommended)", argHint: "32", argPattern: /^\d{1,5}$/, argMessage: "Must be a number 0-65535" },
  { name: "inpeers", label: "Incoming peers", description: "Set max incoming connections (>50 not recommended)", argHint: "32", argPattern: /^\d{1,5}$/, argMessage: "Must be a number 0-65535" },
  { name: "inpeers_localhost", label: "Localhost peers", description: "Set max incoming localhost connections", argHint: "32", argPattern: /^\d{1,5}$/, argMessage: "Must be a number 0-65535" },
  { name: "start_mining", label: "Start mining", description: "Start internal miner (1-64 threads)", argHint: "4", argPattern: /^([1-9]|[1-5][0-9]|6[0-4])$/, argMessage: "Threads must be 1-64", danger: true },
  { name: "stop_mining", label: "Stop mining", description: "Stop internal miner", danger: true },
  { name: "exit", label: "Exit", description: "Terminate p2pool", danger: true },
]

export function findCommand(name: string): ConsoleCommandDef | undefined {
  return P2POOL_CONSOLE_COMMANDS.find((c) => c.name === name)
}

export type CommandValidation =
  | { ok: true; command: string }
  | { ok: false; error: string }

export function validateConsoleCommand(input: string): CommandValidation {
  const raw = (input ?? "").trim()
  if (!raw) return { ok: false, error: "Command is required" }
  if (raw.length > 512) return { ok: false, error: "Command too long" }
  // eslint-disable-next-line no-control-regex
  if (/[^\x20-\x7e]/.test(raw)) return { ok: false, error: "Only printable ASCII is allowed" }

  const parts = raw.split(/\s+/)
  const def = findCommand(parts[0])
  if (!def) return { ok: false, error: `Unknown command: ${parts[0]}` }

  const args = parts.slice(1)
  if (def.argPattern) {
    if (args.length !== 1) return { ok: false, error: `${def.name} requires exactly one argument` }
    if (!def.argPattern.test(args[0])) return { ok: false, error: def.argMessage || "Invalid argument" }
  } else if (args.length > 0) {
    return { ok: false, error: `${def.name} takes no arguments` }
  }

  return { ok: true, command: args.length ? `${def.name} ${args[0]}` : def.name }
}
