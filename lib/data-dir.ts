import path from "path"
import os from "os"
import fs from "fs"

const DATA_DIR = process.env.XMRIG_DATA_DIR || path.join(os.homedir(), ".xmrig-dashboard")

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export const dataDir = DATA_DIR
export const dbPath = process.env.XMIG_DASHBOARD_DB || path.join(DATA_DIR, "xmrig-dashboard.db")
export const envPath = path.join(DATA_DIR, ".env")
export const authSecretPath = path.join(DATA_DIR, "auth-secret")
