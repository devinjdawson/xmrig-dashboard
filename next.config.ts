import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"

const DATA_DIR = process.env.XMRIG_DATA_DIR || path.join(require("os").homedir(), ".xmrig-dashboard")
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const envFile = path.join(DATA_DIR, ".env")
if (fs.existsSync(envFile)) dotenv.config({ path: envFile })

const P2POOL_API_DIR = process.env.P2POOL_API_DIR || path.resolve(DATA_DIR, "../p2pool/api")

const nextConfig: NextConfig = {
  env: {
    P2POOL_API_DIR,
    XMRIG_DATA_DIR: DATA_DIR,
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
})
