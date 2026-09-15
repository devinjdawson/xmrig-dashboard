import { randomBytes } from "crypto"
import fs from "fs"
import path from "path"
import os from "os"

const DATA_DIR = process.env.XMRIG_DATA_DIR || path.join(os.homedir(), ".xmrig-dashboard")
const AUTH_SECRET_PATH = path.join(DATA_DIR, "auth-secret")

export function getOrCreateAuthSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
  try {
    const existing = fs.readFileSync(AUTH_SECRET_PATH, "utf-8").trim()
    if (existing) return existing
  } catch {}
  const secret = randomBytes(32).toString("base64")
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(AUTH_SECRET_PATH, secret, { mode: 0o600 })
  return secret
}
