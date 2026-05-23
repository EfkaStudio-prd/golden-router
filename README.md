# 🥇 GOLDEN ROUTER v2.0

> **The Brain of GEM Traffic. 160+ Providers. Sequential Failover. Triple Compression. Multi-Protocol.**
> 
> Built with Love in Bali · From Community to Community
> 
> MIT Licensed

---

## 🎯 What is Golden Router v2.0?

Golden Router v2.0 adalah AI routing gateway yang menyatukan 160+ LLM provider, sequential multi-account failover, triple token compression, dan multi-protocol support ke dalam satu OpenAI-compatible endpoint.

### Key Features

- **160+ Providers** - Akses ke provider terbanyak dalam satu endpoint
- **Smart Combo Fallback** - Sequential failover dengan priority-based routing
- **Multi-Account Support** - Kelola multiple accounts per provider dengan auto-fallback
- **Real-Time Quota Tracking** - Monitoring token usage dan cost estimation
- **Multi-Protocol Support** - OpenAI, Anthropic, Gemini, MCP, A2A, ACP
- **Format Translation** - Auto-translate antara 8 format (OpenAI, Anthropic, Gemini, Cursor, Kiro, Vertex, Antigravity, Ollama)
- **OAuth Token Refresh** - Auto-refresh token sebelum expired
- **Request Logging** - Full request/response logs dengan debug mode
- **Cloud Sync** - Sync setup across devices dengan encrypted storage
- **Data Migration** - Automatic schema migration untuk upgrade

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/EfkaStudio-prd/golden-router.git
cd golden-router

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Configuration

Edit `.env` file:

```env
PORT=20129
HOST=localhost
DATA_DIR=~/.golden-router
RTK_ENABLED=true
CAVEMAN_ENABLED=true
LOG_LEVEL=info
```

### Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:20129`

---

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

### Combos (Combo-Based Sequential Fallback)

```bash
# List all combos
GET /api/combos

# Create combo
POST /api/combos
{
  "name": "my-coding-stack",
  "models": [
    {
      "provider": "claude-pro",
      "model": "claude-opus-4-6",
      "priority": 1
    },
    {
      "provider": "glm",
      "model": "glm-4-7",
      "priority": 2
    },
    {
      "provider": "if",
      "model": "kimi-k2-thinking",
      "priority": 3
    }
  ],
  "fallbackStrategy": "sequential"
}

# Get combo by ID
GET /api/combos/:id

# Update combo
PUT /api/combos/:id

# Delete combo
DELETE /api/combos/:id
```

### OAuth (Token Management)

```bash
# Start OAuth authorization flow
POST /api/oauth/:provider/authorize
{
  "redirectUri": "http://localhost:20129/oauth/callback"
}

# Exchange authorization code for tokens
POST /api/oauth/:provider/exchange
{
  "code": "authorization_code",
  "state": "state_value",
  "redirectUri": "http://localhost:20129/oauth/callback",
  "name": "my-connection"
}

# Manually refresh token
POST /api/oauth/:connectionId/refresh

# Validate token
POST /api/oauth/:connectionId/validate
```

### Cloud Sync

```bash
# Enable cloud sync
POST /api/sync/enable
{
  "cloudUrl": "https://sync.golden-router.dev",
  "encryptionKey": "your-encryption-key"
}

# Disable cloud sync
POST /api/sync/disable

# Force sync now
POST /api/sync/now

# Get sync status
GET /api/sync/status
```

### Accounts (Multi-Account Support)

```bash
# List all accounts
GET /api/accounts

# List accounts for specific provider
GET /api/accounts?provider=claude-pro

# Create account
POST /api/accounts
{
  "provider": "claude-pro",
  "apiKey": "sk-ant-xxx",
  "priority": 1,
  "maxTokens": 1000000,
  "resetAt": "2026-06-01T00:00:00Z"
}

# Get account by ID
GET /api/accounts/:id

# Update account
PUT /api/accounts/:id

# Delete account
DELETE /api/accounts/:id

# Test account availability
POST /api/accounts/:id/test
```

### Quota Tracking

```bash
# Get all quota status
GET /api/quota

# Get quota for specific provider
GET /api/quota/:provider

# Set quota for provider
POST /api/quota/:provider
{
  "maxTokens": 1000000,
  "resetAt": "2026-06-01T00:00:00Z"
}

# Get monthly report
GET /api/quota/monthly/:month

# Get all monthly reports
GET /api/quota/monthly/all
```

### Logs

```bash
# Get logs
GET /api/logs?limit=100

# Export logs (JSON or CSV)
GET /api/logs/export?format=json

# Clear logs
DELETE /api/logs
```

---

## 📁 Project Structure

```
golden-router/
├── src/
│   ├── api/                    # API endpoints
│   │   ├── combos.js          # Combo management
│   │   ├── accounts.js        # Multi-account management
│   │   ├── quota.js           # Quota tracking
│   │   └── logs.js            # Request logging
│   ├── core/
│   │   ├── combo/             # Combo fallback logic
│   │   │   └── comboHandler.js
│   │   └── quota/             # Quota tracking logic
│   │       └── quotaTracker.js
│   └── lib/                   # Core libraries
│       ├── localDb.js         # Local persistence (db.json)
│       └── usageDb.js         # Usage tracking (usage.json, log.txt)
├── data/                      # Data directory (auto-created)
│   ├── db.json               # Config/state
│   ├── usage.json            # Usage history
│   └── log.txt               # Request logs
├── server.js                  # Main server
├── package.json
├── .env.example
└── README.md
```

---

## 🔄 Sprint Roadmap

### Sprint 1 (Minggu 1-2): Core Combo Fallback ✅
- [x] Local database (db.json)
- [x] Usage database (usage.json, log.txt)
- [x] Combo handler with sequential fallback
- [x] Multi-account support with priority-based routing
- [x] API endpoints for combos and accounts
- [x] Basic quota tracking

### Sprint 2 (Minggu 3-4): Provider Integration ✅
- [x] Provider executor (OpenAI, Anthropic, Gemini, DeepSeek, Groq, OpenRouter)
- [x] Basic routing engine
- [x] Format translation layer (OpenAI, Anthropic, Gemini)
- [x] v1 API endpoint (OpenAI-compatible)

### Sprint 3 (Minggu 5-6): Enhanced Features ✅
- [x] Format translation layer (8 formats)
- [x] OAuth token refresh system
- [x] Enhanced quota tracking with cost estimation
- [x] Request logging with debug mode

### Sprint 4 (Minggu 7-8): Cloud Sync & Reports ✅
- [x] Cloud sync implementation
- [x] Encrypted storage
- [x] Monthly reports with export
- [x] Data migration system

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: JSON file-based (db.json, usage.json, log.txt)
- **Format Translation**: Custom translator registry (8 formats)
- **OAuth**: Built-in OAuth manager with auto-refresh
- **Cloud Sync**: Encrypted storage with periodic sync
- **License**: MIT

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Community** - All the amazing contributors to open-source AI routing projects
- **OpenAI** - API standards and documentation
- **Anthropic** - Claude API and documentation
- **Google** - Gemini API and documentation

---

Built with ❤️ in Bali, Indonesia

Dwi & Tim GEM · 2026
