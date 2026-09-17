import { withSentryConfig } from "@sentry/nextjs/config"
import type { NextConfig } from "next"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"
import { randomBytes } from "crypto"

const DATA_DIR = process.env.XMRIG_DATA_DIR || path.join(require("os").homedir(), ".xmrig-dashboard")
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const envFile = path.join(DATA_DIR, ".env")
if (fs.existsSync(envFile)) dotenv.config({ path: envFile })

const P2POOL_API_DIR = process.env.P2POOL_API_DIR || path.resolve(DATA_DIR, "../p2pool/api")

let authSecret = process.env.AUTH_SECRET
if (!authSecret) {
  const secretPath = path.join(DATA_DIR, "auth-secret")
  try {
    authSecret = fs.readFileSync(secretPath, "utf-8").trim()
  } catch {}
  if (!authSecret) {
    authSecret = randomBytes(32).toString("base64")
    fs.writeFileSync(secretPath, authSecret, { mode: 0o600 })
  }
}

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  allowedDevOrigins,
  env: {
    P2POOL_API_DIR,
    XMRIG_DATA_DIR: DATA_DIR,
    AUTH_SECRET: authSecret,
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
})
