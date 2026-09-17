# API Reference

XMRig Dashboard exposes a REST API for managing miners and fetching network stats.

All endpoints return JSON. Errors return `{ "error": "message" }` with appropriate HTTP status codes.

## Miners API

### List Miners

```
GET /api/miners
```

Returns all configured miners with their latest data.

**Response:**

```json
[
  {
    "id": "abc123",
    "name": "Miner 1",
    "host": "192.168.1.100",
    "port": 44444,
    "accessToken": "token123",
    "tags": ["rig1", "upstairs"],
    "lastSummary": { ... },
    "lastThreads": { ... },
    "lastConfig": { ... },
    "error": null,
    "lastUpdated": 1726488000000
  }
]
```

### Add Miner

```
POST /api/miners
```

**Body:**

```json
{
  "name": "My Miner",
  "host": "192.168.1.100",
  "port": 44444,
  "accessToken": "optional-token",
  "tags": ["tag1", "tag2"]
}
```

**Response:** Created miner object.

### Update Miner

```
PUT /api/miners/:id
```

**Body:** (all fields optional)

```json
{
  "name": "New Name",
  "host": "192.168.1.101",
  "port": 44445,
  "accessToken": "new-token",
  "tags": ["new-tag"]
}
```

**Response:** Updated miner object.

### Delete Miner

```
DELETE /api/miners/:id
```

**Response:** `{ "success": true }`

### Refresh Miner

```
POST /api/miners/:id/refresh
```

Fetches fresh data from the XMRig HTTP API.

**Response:**

```json
{
  "summary": { ... },
  "threads": { ... },
  "config": { ... },
  "error": null
}
```

### Test Connection

```
GET /api/miners/:id/refresh
```

Same as POST but read-only (no database write).

## Network API

### Monero Node Stats

```
GET /api/monero?url=...&user=...&pass=...
```

Fetches data from `monerod` RPC.

**Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Monero RPC URL (e.g., `http://127.0.0.1:18081`) |
| `user` | No | RPC username |
| `pass` | No | RPC password |

**Response:**

```json
{
  "info": {
    "height": 3234567,
    "difficulty": "456789012345",
    "target": 120,
    "tx_pool_size": 42,
    "incoming_connections_count": 8,
    "outgoing_connections_count": 12,
    "white_peerlist_size": 1000,
    "grey_peerlist_size": 500,
    "mainnet": true,
    "testnet": false,
    "stagenet": false,
    "top_block_hash": "abc123...",
    "version": "0.18.3.4",
    "status": "OK",
    "synchronized": true
  },
  "feeEstimate": {
    "fee_per_kb": 15000,
    "fee_per_byte": 15,
    "untrusted": false
  },
  "altBlocks": ["hash1", "hash2"],
  "syncInfo": {
    "height": 3234567,
    "target_height": 3234567
  },
  "lastBlock": {
    "block_header": {
      "height": 3234567,
      "hash": "def456...",
      "timestamp": 1726488000,
      "difficulty": 456789012345,
      "reward": 600000000000,
      "block_size": 25000,
      "block_weight": 300000,
      "num_txes": 2,
      "pow_hash": "789abc..."
    }
  },
  "hardFork": {
    "version": 15,
    "enabled": true,
    "state": 2,
    "earliest_height": 2688888
  },
  "connections": {
    "connections": [
      {
        "incoming": false,
        "ip": "1.2.3.4",
        "port": 18080,
        "height": 3234567,
        "live_time": 3600
      }
    ]
  },
  "error": null
}
```

**RPC Methods Used:**

- `get_info` - General node info
- `get_fee_estimate` - Fee estimates
- `get_alt_blocks_hashes` - Alternative block hashes
- `sync_info` - Sync progress
- `get_last_block_header` - Last block details
- `hard_fork_info` - Hard fork status
- `get_connections` - Peer connections

### P2Pool Stats

```
GET /api/p2pool?url=...
```

Fetches data from P2Pool HTTP API.

**Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `url` | Yes | P2Pool API URL (e.g., `http://localhost:3334`) |

**Response:**

```json
{
  "stats": {
    "pool_statistics": {
      "hashRate": 150000000,
      "miners": 42,
      "roundHashes": 5000000,
      "sidechainHeight": 1234567,
      "sidechainDifficulty": "987654321",
      "lastBlockFoundTime": 1726487000,
      "lastBlockFoundHeight": 1234560,
      "totalBlocksFound": 150
    }
  },
  "blocks": [
    {
      "height": 1234560,
      "hash": "abc123...",
      "timestamp": 1726487000,
      "miner": "wallet_address",
      "reward": 600000000000
    }
  ],
  "network": {
    "height": 3234567,
    "difficulty": 456789012345,
    "reward": 600000000000,
    "hash": "def456...",
    "timestamp": 1726488000
  },
  "stratum": {
    "hashrate_15m": 150000000,
    "hashrate_1h": 145000000,
    "hashrate_24h": 140000000,
    "connections": 8,
    "workers": ["addr,diff,autodiff,user", "..."],
    "shares_found": 1000,
    "shares_failed": 5,
    "average_effort": 0.95,
    "current_effort": 0.87,
    "wallet": "48edfHu7V9Z84Yzz..."
  },
  "p2p": {
    "connections": 8,
    "incoming_connections": 2,
    "peer_list_size": 1000,
    "uptime": 86400,
    "zmq_last_active": 1726488000
  },
  "config": {
    "fee": 0,
    "minPaymentThreshold": 1000000000000,
    "ports": [
      { "port": 3333, "tls": false },
      { "port": 3334, "tls": true }
    ]
  },
  "error": null,
  "source": "http"
}
```

**Endpoints Probed:**

- `/local/stratum` - Stratum stats
- `/pool/stats` - Pool statistics
- `/pool/blocks` - Recent blocks
- `/network/stats` - Network info
- `/local/p2p` - P2P status
- `/stats_mod` - Modified stats with config

### Tari Node Stats

```
GET /api/tari?url=...
```

Fetches data from Tari base node HTTP API.

**Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Tari HTTP API URL (e.g., `http://localhost:9000`) |

**Response:**

```json
{
  "tipInfo": {
    "metadata": {
      "best_block_height": 123456,
      "best_block_hash": "abc123...",
      "accumulated_difficulty": "5727951635418633000000000000000000000000"
    },
    "is_synced": true,
    "tip_hash": "abc123..."
  },
  "version": {
    "version": "1.0.0"
  },
  "syncInfo": {
    "tip_height": 123456,
    "local_height": 123456,
    "state": "Synced",
    "sync_state": "UpToDate"
  },
  "networkState": {
    "num_peers": 25,
    "num_connections": 12,
    "network_difficulty": 456789012345,
    "estimated_hash_rate": 150000000
  },
  "mempoolStats": {
    "unconfirmed_txs": 42,
    "unconfirmed_weight": 125000,
    "reorg_txs": 0,
    "orphan_txs": 0
  },
  "peers": {
    "connected_peers": [
      {
        "addresses": ["/ip4/1.2.3.4/tcp/18141"],
        "user_agent": "tari/v1.0.0",
        "features": 3
      }
    ]
  },
  "headers": {
    "headers": [
      {
        "height": 123456,
        "hash": "abc123...",
        "timestamp": 1726488000,
        "difficulty": 456789012345
      }
    ]
  },
  "identity": {
    "public_key": "abc123...",
    "node_id": "node123..."
  },
  "error": null
}
```

**Endpoints Used:**

- `/get_tip_info` - Chain tip
- `/get_version` - Software version
- `/get_sync_info` - Sync status
- `/get_network_state` - Network info
- `/get_mempool_stats` - Mempool stats
- `/list_connected_peers` - Peer list
- `/list_headers` - Recent headers (POST)
- `/get_identify` - Node identity

## XMRig Proxy API

The dashboard proxies requests to XMRig's HTTP API.

### Get Summary

```
GET /api/xmrig/:id/summary
```

Proxies to `http://{host}:{port}/1/summary`.

**Response:** XMRig summary object (see [XMRig API docs](https://xmrig.com/docs/miner/api)).

### Get Threads

```
GET /api/xmrig/:id/threads
```

Proxies to `http://{host}:{port}/1/threads`.

### Get Config

```
GET /api/xmrig/:id/config
```

Proxies to `http://{host}:{port}/1/config`.

### Update Config

```
PUT /api/xmrig/:id/config
```

Proxies to `http://{host}:{port}/1/config` (PUT).

**Body:** Full XMRig config object.

## Cron API

### Run Retention

```
POST /api/cron/retention
```

Deletes historical snapshots older than the specified retention period.

**Headers:**

```
Authorization: Bearer {XMRIG_CRON_SECRET}
```

**Body:**

```json
{
  "days": 30
}
```

**Response:**

```json
{
  "deleted": 150
}
```

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Human-readable error message"
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing parameters) |
| 404 | Resource not found |
| 500 | Internal server error |
| 502 | Bad gateway (upstream node unreachable) |
| 503 | Service unavailable |

## Rate Limiting

No built-in rate limiting. Use a reverse proxy (Nginx, Cloudflare) for production deployments.

## Authentication

If `AUTH_ENABLED=true`, all API endpoints require a valid session cookie. Unauthenticated requests return `401 Unauthorized`.

## Next Steps

- [Architecture](ARCHITECTURE.md) - Understand the codebase structure
- [Setup Guide](SETUP.md) - Installation and configuration
