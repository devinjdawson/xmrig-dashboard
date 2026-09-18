# XMRig Dashboard

A self-hosted monitoring dashboard for XMRig miners, Monero nodes, P2Pool, and Tari nodes. Built with Next.js 16, React 19, and shadcn/ui.

![Dashboard Preview](https://github.com/user-attachments/assets/placeholder.png)

## Features

### Miner Monitoring
- **Real-time hashrate tracking** with speedometer gauge
- **Thread-level details** with per-thread hashrate and CPU affinity
- **Share statistics** with accept rate tracking
- **Connection monitoring** with pool status and ping
- **Historical data** with SQLite-backed time series
- **Group management** with tags and filtering
- **Remote configuration** via XMRig HTTP API

### Network Nodes

#### Monero Node
- Chain status (height, difficulty, block target)
- Sync progress with visual indicator
- Last block details (reward, size, weight, hash)
- Hard fork status and version
- Peer connections table
- Mempool and transaction stats
- Fee estimates

#### P2Pool
- Pool hashrate and miner count
- Sidechain statistics
- Stratum worker details
- P2P network status
- Recent blocks found
- Pool configuration (fees, ports, thresholds)

#### Tari Node
- Chain status with accumulated difficulty
- Sync progress tracking
- Network state (peers, connections, hash rate)
- Mempool statistics
- Connected peers table
- Recent block headers

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, shadcn/ui, Tailwind CSS v4
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **Charts**: Recharts
- **Auth**: NextAuth.js v5 with email OTP
- **Error Tracking**: Sentry (optional)
- **Language**: TypeScript

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

### Environment Variables

See [`.env.example`](.env.example) for all options. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `XMRIG_DATA_DIR` | Data directory for DB and secrets | `~/.xmrig-dashboard` |
| `AUTH_ENABLED` | Require login to access dashboard | `false` |
| `AUTH_ALLOWED_EMAILS` | Comma-separated allowed emails | (empty = all) |
| `AUTH_ADMIN_EMAILS` | Emails promoted to admin on sign-in | (empty) |
| `P2POOL_API_DIR` | Path to P2Pool local API files | — |
| `XMRIG_CRON_SECRET` | Bearer token for cron endpoints | `change-me` |
| `SENTRY_DSN` | GlitchTip DSN for error tracking | (disabled) |
| `SENTRY_SEC` | GlitchTip security endpoint for CSP reporting | (disabled) |

### Network Endpoints

Configure via the dashboard UI (Network Settings):

- **P2Pool API URL**: e.g., `http://localhost:3334`
- **Monero RPC URL**: e.g., `http://127.0.0.1:18081`
- **Tari HTTP API URL**: e.g., `http://127.0.0.1:9000`

### Miner Requirements

XMRig must be started with HTTP API enabled:

```json
{
  "api": {
    "id": null,
    "worker-id": null
  },
  "http": {
    "enabled": true,
    "host": "0.0.0.0",
    "port": 44444,
    "access-token": "your-secret-token",
    "restricted": false
  }
}
```

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation and configuration
- [API Reference](docs/API.md) - Backend API endpoints
- [Architecture](docs/ARCHITECTURE.md) - Project structure and design

## Development

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm typecheck

# Run linter
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Manual

```bash
pnpm build
pnpm start
```

## API Endpoints

### Miners
- `GET /api/miners` - List all miners
- `POST /api/miners` - Add a miner
- `PUT /api/miners/:id` - Update a miner
- `DELETE /api/miners/:id` - Remove a miner
- `POST /api/miners/:id/refresh` - Refresh miner data

### Network
- `GET /api/monero?url=...&user=...&pass=...` - Monero node stats
- `GET /api/p2pool?url=...` - P2Pool stats
- `GET /api/tari?url=...` - Tari node stats

### XMRig Proxy
- `GET /api/xmrig/:id/summary` - Miner summary
- `GET /api/xmrig/:id/threads` - Thread details
- `GET /api/xmrig/:id/config` - Miner config
- `PUT /api/xmrig/:id/config` - Update config

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
