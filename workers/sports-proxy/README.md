# Sports Proxy - OpenAI Responses API Orchestrator

🚀 **Production v3.2 - Multi-Sport Intelligence with Complete Authentication**

Central orchestrator providing native OpenAI Responses API integration with intelligent sport routing, JWT authentication, and analytics. **Production: https://sports-proxy.gerrygugger.workers.dev** ✅

## 🎯 Architecture

**"Menu, not meal"** design with production authentication:
- **Sports-Proxy**: API router with sport detection & user auth
- **Auth-MCP**: JWT tokens, Stripe billing, D1 analytics  
- **MCP Workers**: Baseball/Hockey stats, fantasy leagues (ESPN/Yahoo)
- **OpenAI gpt-4.1**: Natural language processing & tool orchestration

## 🚀 Production Features

- **JWT Authentication**: Secure user auth via auth-mcp service binding
- **Subscription Tiers**: Free/Pro/Elite with Stripe billing integration
- **Sport Detection**: Auto-detects MLB/Hockey with 75% token reduction
- **Entity Resolution**: "Yankees" → ID 147, "Judge" → ID 592450
- **Multi-layer Caching**: KV hot cache + R2 cold storage with smart TTLs
- **Fantasy Integration**: ESPN/Yahoo leagues with encrypted credential storage

## 🔧 Available Tools

**Meta**: resolve_team, resolve_player, resolve_league
**Baseball**: get_team_info, get_player_stats, get_team_roster, get_standings, get_schedule
**Hockey**: get_team_info, get_player_stats, get_team_roster, get_standings, get_schedule  
**Fantasy**: get_league_info, get_team_roster, get_matchup_data, get_free_agents

## 📡 Production Endpoints

### `/responses` - OpenAI Responses API (PRIMARY)
Production endpoint with complete authentication: https://sports-proxy.gerrygugger.workers.dev/responses

**Request:**
```json
{
  "model": "gpt-4.1",
  "input": "Get player stats for Mookie Betts this season",
  "tools": [{"type": "function", "function": {"name": "get_player_stats"}}],
  "stream": false
}
```

**Headers:** `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`

### `/health` - Service Status
```json
{"status": "healthy", "services": {"mcp": {...}, "auth": {...}, "cache": {...}}}
```

### `/prefs` - User Preferences (NEW)
- **GET /prefs?userId=<id>** - Retrieve preferences
- **PATCH /prefs?userId=<id>** - Update preferences

### `/scripts` - User Scripts (NEW)  
- **GET /scripts?userId=<id>** - List user scripts
- **POST /scripts?userId=<id>** - Create script

## 🔧 Configuration

### Environment Variables
```bash
# OpenAI & Model
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1

# Service Bindings (Cloudflare)
AUTH_MCP=auth-mcp
BASEBALL_STATS_MCP=baseball-stats-mcp
HOCKEY_STATS_MCP=hockey-stats-mcp
BASEBALL_FANTASY_MCP=baseball-fantasy-mcp

# Caching & Auth
CACHE_TTL_HOT=10
CACHE_TTL_COLD=300
REQUIRE_AUTH=true
ENVIRONMENT=production
```

### Service Bindings (wrangler.toml)
```toml
[[services]]
binding = "AUTH_MCP"
service = "auth-mcp"
environment = "production"

[[services]]
binding = "BASEBALL_STATS_MCP"
service = "baseball-stats-mcp"
environment = "production"
```

## 🚀 Deployment

1. **Setup:** `npm install && wrangler login`
2. **Secrets:** `wrangler secret put OPENAI_API_KEY`
3. **Resources:** `wrangler kv:namespace create "SPORTS_CACHE"`
4. **Deploy:** `./deploy-v3.sh` (from root) or `npm run deploy`
5. **Test:** `curl https://sports-proxy.gerrygugger.workers.dev/health`

## 📊 Performance & Caching

**Response Times (Production):**
- Cache hit: <50ms (KV) / <100ms (R2)
- Cache miss: 200-500ms (upstream + cache)
- Authentication: <30ms (auth-mcp)
- Service binding: <1ms (worker-to-worker)

**Caching Strategy:**
- Live games: 1s cache | Player stats: 60s | Team info: 5min | Fantasy: 30min

## 🔐 Authentication

**JWT Token:** `Authorization: Bearer <jwt_token_from_auth_mcp>`

**Subscription Tiers:**
- Free: 100 requests/day, basic sports only
- Pro: 1,000 requests/day, fantasy integration
- Elite: 10,000 requests/day, all features

## 🎯 Native OpenAI Integration

Point your OpenAI client directly to Sports Proxy:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://sports-proxy.gerrygugger.workers.dev",
    api_key="your_jwt_token"
)

response = client.responses.create(
    model="gpt-4.1",
    input="Get Yankees team info and standings",
    tools=[{"type": "function", "function": {"name": "get_team_info"}}]
)
```

## 🧪 Testing

```bash
# Health check
curl https://sports-proxy.gerrygugger.workers.dev/health

# With authentication
curl -X POST https://sports-proxy.gerrygugger.workers.dev/responses \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4.1","input":"Get Yankees info"}'
```

## 🔄 Migration from v2.x

**Breaking Changes:**
- ❌ API key auth → ✅ JWT token auth
- ❌ MLB only → ✅ Multi-sport + fantasy
- ❌ No user system → ✅ Complete user management

**Migration:** Replace API keys with JWT tokens, update base URL, leverage new user features.

## 🌟 Why Sports Platform v3.2?

- 🔐 Complete JWT authentication with Stripe billing
- 🚀 Multi-sport intelligence (Baseball + Hockey + Fantasy)
- 📊 Advanced analytics and user behavior tracking
- 💡 Optimized for OpenAI gpt-4.1
- 🔄 Automatic conversation state management
- 📡 Real-time streaming with semantic events
- 🛠️ Native function calling with entity resolution
- 🏆 Complete ESPN and Yahoo fantasy integration
- 💾 Smart multi-layer caching with dynamic TTLs

**Sports Platform v3.2 represents the production-ready future of sports data integration with AI.**