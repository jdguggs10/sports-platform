# Sports Proxy - OpenAI Responses API Orchestrator

Central orchestrator providing native OpenAI Responses API integration with intelligent sport routing and authentication.

**Production**: https://sports-proxy.gerrygugger.workers.dev ✅

## 🔧 Service-Specific Configuration

### Environment Variables
```bash
# Required service bindings
AUTH_MCP=auth-mcp
MLB_MCP=baseball-stats-mcp  
HOCKEY_MCP=hockey-stats-mcp

# Optional configuration
DEBUG=false
LOG_LEVEL=error
CACHE_TTL=300
```

### Local Development
```bash
# Start this service
cd workers/sports-proxy
wrangler dev --port 8081 --local

# Health check
curl http://localhost:8081/health
```

## 📡 Available Endpoints

### Core API
- `POST /responses` - OpenAI Responses API (primary endpoint)
- `GET /health` - Service health and binding status
- `GET /prefs?userId={id}` - User preferences
- `PATCH /prefs?userId={id}` - Update preferences
- `POST /scripts?userId={id}` - Save user scripts/macros

### Available Tools by Sport
**Meta Tools**: `resolve_team`, `resolve_player`, `resolve_league`
**Baseball**: `get_team_info`, `get_player_stats`, `get_team_roster`, `get_standings`, `get_schedule`
**Hockey**: `get_team_info`, `get_player_stats`, `get_team_roster`, `get_standings`, `get_schedule`
**Fantasy**: `get_league_info`, `get_team_roster`, `get_matchup_data`, `get_free_agents`

## 🏗️ Technical Implementation

### Service Binding Pattern
```javascript
// Call MCP services via bindings
const result = await env.MLB_MCP.fetch('/execute', {
  method: 'POST',
  body: JSON.stringify({ endpoint: 'team', query: { name: 'Yankees' } })
});
```

### Sport Detection Logic
```javascript
// Automatic sport detection from user input
function detectSport(input) {
  const baseballTerms = ['yankees', 'red sox', 'mlb', 'baseball'];
  const hockeyTerms = ['bruins', 'rangers', 'nhl', 'hockey'];
  // Implementation details...
}
```

## 🔍 Troubleshooting

### Common Issues
- **Service binding failures**: Check that dependent MCPs are running
- **Authentication errors**: Verify AUTH_MCP connection
- **Tool execution timeouts**: Check MCP service health
- **Cache issues**: Clear KV storage if needed

### Debug Commands
```bash
# Check service bindings
wrangler tail sports-proxy --format=pretty

# Test MCP connections  
curl http://localhost:8081/health

# Clear cache
wrangler kv:key delete --binding=CACHE_KV "cache:key"
```

---

For complete platform documentation, see [Platform Guide](../../docs/PLATFORM-GUIDE.md)

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