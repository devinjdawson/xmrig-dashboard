import type { NextConfig } from "next"
import path from "path"

const P2POOL_API_DIR = process.env.P2POOL_API_DIR || path.resolve(__dirname, "../p2pool/api")

const nextConfig: NextConfig = {
  env: {
    P2POOL_API_DIR,
  },
}

export default nextConfig
