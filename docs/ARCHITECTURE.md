# Architecture

Overview of the XMRig Dashboard codebase structure and design decisions.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19, shadcn/ui, Tailwind CSS v4
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **Charts**: Recharts
- **Auth**: NextAuth.js v5 (email OTP)
- **Error Tracking**: Sentry (optional)

## Directory Structure

```
xmrig-dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── miners/        # Miner CRUD + refresh
│   │   ├── monero/        # Monero node proxy
│   │   ├── p2pool/        # P2Pool stats proxy
│   │   ├── tari/          # Tari node proxy
│   │   ├── xmrig/         # XMRig HTTP API proxy
│   │   └── cron/          # Background jobs
│   ├── dashboard/         # Dashboard pages
│   ├── monero/            # Monero workspace
│   ├── p2pool/            # P2Pool workspace
│   ├── tari/              # Tari workspace
│   └── login/             # Auth pages
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── miner-card.tsx    # Miner display card
│   ├── miner-summary.tsx # Summary tab
│   ├── miner-threads.tsx # Threads tab
│   ├── miner-config.tsx  # Config tab
│   ├── hashrate-gauge.tsx # Speedometer chart
│   ├── hashrate-chart.tsx # Historical chart
│   ├── monero-card.tsx   # Monero node card
│   ├── p2pool-card.tsx   # P2Pool card
│   └── app-sidebar.tsx   # Sidebar with stats
├── lib/                   # Shared utilities
│   ├── db/               # Database schema + queries
│   ├── xmrig/            # XMRig API client + types
│   ├── format.ts         # Number formatting
│   ├── network-endpoints.ts # Endpoint storage
│   └── auth.ts           # NextAuth config
├── .reference/           # Reference docs
│   ├── xmrig/            # XMRig API docs
│   └── p2pool-api-models/ # P2Pool data models
└── docs/                 # This documentation
```

## Data Flow

### Miner Monitoring

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  /api/miners │─────▶│  XMRig API  │
│  (React)    │      │   (Next.js)  │      │  (port 44444)│
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   SQLite DB  │
                     │  (snapshots) │
                     └──────────────┘
```

1. **Frontend** polls `/api/miners` every 30 seconds
2. **API route** fetches from XMRig HTTP API (`/1/summary`, `/1/threads`, `/1/config`)
3. **Database** stores historical snapshots for charts
4. **Response** includes latest data + any errors

### Network Nodes

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│ /api/monero  │─────▶│   monerod   │
│  (React)    │      │ /api/p2pool  │      │   P2Pool    │
│             │      │ /api/tari    │      │  Tari node  │
└─────────────┘      └──────────────┘      └─────────────┘
```

1. **Frontend** calls network API routes
2. **API routes** make parallel requests to node endpoints
3. **Results** are merged and returned to client
4. **Errors** are gracefully handled (null fallbacks)

## Key Components

### MinerCard

Displays a single miner with tabs:
- **Summary**: Hashrate gauge, shares, uptime, pool info
- **Threads**: Per-thread hashrate and CPU affinity
- **Config**: Current XMRig configuration
- **Stream**: Historical hashrate chart
- **Stats**: Aggregate statistics

### HashrateGauge

Recharts radial bar chart showing:
- Current hashrate (green arc)
- Peak hashrate (grey background)
- Percentage of max

Uses 270° arc for speedometer aesthetic.

### AppSidebar

Persistent sidebar with:
- Workspace navigation (Miners, P2Pool, Monero, Tari)
- Cumulative stats (total hashrate, shares, uptime)
- Network summaries (Monero, P2Pool, Tari)
- Miner list with online status

## Database Schema

### miners

```sql
CREATE TABLE miners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  access_token TEXT,
  tags TEXT, -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### miner_snapshots

```sql
CREATE TABLE miner_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  miner_id TEXT NOT NULL,
  hashrate REAL NOT NULL,
  shares_good INTEGER NOT NULL,
  shares_total INTEGER NOT NULL,
  uptime INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (miner_id) REFERENCES miners(id)
);
```

## Authentication

Uses NextAuth.js v5 with email OTP:

1. User enters email on `/login`
2. Server generates 6-digit code
3. Code sent via SMTP (or logged to console)
4. User enters code to authenticate
5. Session cookie set (30-day expiry)

Optional OAuth providers: GitHub, GitLab, Google, Microsoft.

## State Management

- **Server state**: Fetched via SWR-style patterns in components
- **Client state**: React hooks (`useState`, `useEffect`)
- **Persistent state**: localStorage for preferences (view mode, sort, collapsed groups)
- **Database**: SQLite for miner config and historical data

## Error Handling

### API Routes

- All network requests wrapped in try/catch
- Errors returned as `{ error: "message" }` with appropriate status codes
- Timeouts: 10s for XMRig, 30s for Tari, 10s for Monero

### Frontend

- Error boundaries catch React errors
- Network errors displayed inline in cards
- Stale data shown when refresh fails

## Performance Considerations

### Caching

- API routes use `cache: "no-store"` for fresh data
- Browser caches static assets via Next.js
- No server-side caching (stateless API)

### Database

- SQLite WAL mode for concurrent reads
- Indexes on `miner_id` and `created_at`
- Retention cron deletes old snapshots

### Network

- Parallel requests for node stats (`Promise.allSettled`)
- Graceful degradation (partial data OK)
- Configurable timeouts per endpoint

## Security

### XMRig Access Tokens

- Stored encrypted in database (if configured)
- Sent via `Authorization: Bearer` header
- Never logged or exposed in UI

### Auth

- Session cookies with `httpOnly`, `secure`, `sameSite`
- CSRF protection via NextAuth
- Rate limiting recommended via reverse proxy

### Secrets

- `AUTH_SECRET` auto-generated if missing
- Stored in data directory (not repo)
- Environment variables for OAuth credentials

## Testing

No automated tests yet. Manual testing checklist:

- [ ] Add/edit/delete miners
- [ ] Refresh miner data
- [ ] View historical charts
- [ ] Configure network endpoints
- [ ] Fetch Monero/P2Pool/Tari stats
- [ ] Login/logout flow
- [ ] Group management
- [ ] Export data

## Deployment Checklist

- [ ] Set `AUTH_ENABLED=true` for production
- [ ] Configure `AUTH_ALLOWED_EMAILS`
- [ ] Set up SMTP or OAuth
- [ ] Use reverse proxy (Nginx/Caddy)
- [ ] Enable HTTPS
- [ ] Set `XMRIG_CRON_SECRET`
- [ ] Configure retention cron
- [ ] Set up error tracking (Sentry)
- [ ] Backup database regularly

## Future Improvements

- [ ] WebSocket for real-time updates
- [ ] Multi-user support with permissions
- [ ] Mobile app (React Native)
- [ ] Alerting (email/webhook on miner offline)
- [ ] More chart types (pie, heatmap)
- [ ] GPU miner support (NiceHash, EthOS)
- [ ] Mining pool integration (MoneroOcean, SupportXMR)
- [ ] API keys for programmatic access
- [ ] Dark/light theme toggle
- [ ] Internationalization (i18n)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm typecheck` and `pnpm lint`
5. Submit a pull request

## License

MIT
