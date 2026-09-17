# Setup Guide

This guide covers installing and configuring XMRig Dashboard from scratch.

## Prerequisites

- **Node.js** 20.x or later
- **pnpm** (recommended) or npm/yarn
- **Git** (optional, for cloning)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/xmrig-dashboard.git
cd xmrig-dashboard
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to set your preferences. Most settings are optional.

#### Minimal Configuration

For a basic setup with no authentication:

```env
# Data directory (optional, defaults to ~/.xmrig-dashboard)
XMRIG_DATA_DIR=

# Disable auth (default)
AUTH_ENABLED=false
```

#### With Authentication

```env
AUTH_ENABLED=true
AUTH_ALLOWED_EMAILS=you@example.com
```

Without SMTP configured, OTP codes are logged to the console.

#### With SMTP (Email OTP)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

#### With OAuth (GitHub Example)

```env
AUTH_GITHUB_ID=your-client-id
AUTH_GITHUB_SECRET=your-client-secret
AUTH_ALLOWED_EMAILS=you@example.com
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuring XMRig Miners

Each XMRig instance must have HTTP API enabled.

### XMRig Config Example

```json
{
  "api": {
    "id": "miner-1",
    "worker-id": "worker-1"
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

### Adding Miners to Dashboard

1. Click **Network Settings** in the sidebar
2. Enter the miner's host and port
3. Optionally add an access token
4. Click **Save**

Or use the **+ Add Miner** button on the main page.

## Configuring Network Nodes

### Monero Node

Start `monerod` with RPC enabled:

```bash
monerod --rpc-bind-ip=0.0.0.0 --rpc-bind-port=18081 --confirm-external-bind --restricted-rpc
```

In the dashboard, set **Monero RPC URL** to `http://your-node:18081`.

If you set `--rpc-login user:pass`, enter those in the dashboard settings.

### P2Pool

Start P2Pool with the local API enabled:

```bash
p2pool --wallet YOUR_WALLET --data-api /path/to/api/dir
```

In the dashboard, set **P2Pool API URL** to `http://localhost:3334` (or your P2Pool API port).

Alternatively, set `P2POOL_API_DIR` in `.env` to read directly from the filesystem:

```env
P2POOL_API_DIR=/path/to/p2pool/api
```

### Tari Node

Start the Minotari base node with HTTP API enabled:

```bash
minotari_node --grpc-address=0.0.0.0:18142
```

In the dashboard, set **Tari HTTP API URL** to `http://localhost:9000`.

## Production Deployment

### Build for Production

```bash
pnpm build
pnpm start
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name dashboard.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Systemd Service

```ini
[Unit]
Description=XMRig Dashboard
After=network.target

[Service]
Type=simple
User=xmrig
WorkingDirectory=/opt/xmrig-dashboard
ExecStart=/usr/bin/pnpm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable xmrig-dashboard
sudo systemctl start xmrig-dashboard
```

### Docker

See the [Dockerfile](../Dockerfile) in the repository root.

```bash
docker build -t xmrig-dashboard .
docker run -d -p 3000:3000 -v ~/.xmrig-dashboard:/data xmrig-dashboard
```

## Troubleshooting

### "The operation was aborted due to timeout"

This usually means the node is slow to respond. The dashboard uses a 30-second timeout for Tari requests. If your node is on slow hardware, consider:

- Ensuring the node is fully synced
- Using a faster disk (SSD recommended)
- Increasing the timeout in `app/api/tari/route.ts`

### Miners Showing Offline

- Verify XMRig is running with `--http-enabled`
- Check firewall rules allow port 44444 (or your configured port)
- Verify the access token matches
- Test with `curl http://miner-ip:44444/1/summary`

### P2Pool Not Connecting

- Ensure P2Pool is started with `--api-port` (not the Stratum port)
- The HTTP API is separate from the mining port
- Test with `curl http://localhost:3334/local/stratum`

### Database Locked Errors

SQLite can have contention under heavy write load. Solutions:

- Reduce the refresh interval in the UI
- Use a faster disk for the data directory
- Consider scaling horizontally with multiple dashboard instances

## Backup

The dashboard stores all data in the SQLite database:

```bash
# Backup
cp ~/.xmrig-dashboard/xmrig-dashboard.db ~/backup.db

# Restore
cp ~/backup.db ~/.xmrig-dashboard/xmrig-dashboard.db
```

## Updating

```bash
git pull
pnpm install
pnpm build
# Restart your service
sudo systemctl restart xmrig-dashboard
```

## Next Steps

- [API Reference](API.md) - Learn about the backend endpoints
- [Architecture](ARCHITECTURE.md) - Understand the codebase structure
