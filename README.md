# Sports Platform v3.2

Production-ready sports intelligence platform with comprehensive analytics, fantasy league integration, and OpenAI Responses API orchestration. **All tests passing ✅**

## 📖 Quick Documentation Access

- **[Complete Platform Guide](./docs/PLATFORM-GUIDE.md)** - Architecture, deployment, and API integration
- **[Documentation Index](./docs/README.md)** - All documentation organized and consolidated  
- **[Testing Guide](./tests/README.md)** - Unified testing infrastructure

## 🚀 Quick Start

### Testing
```bash
# Run all tests (production + development)
./test-all.js

# Production tests only
./test-all.js --production

# Development tests only  
./test-all.js --development
```

### Development  
```bash
# Start development servers
./start-dev-servers.sh

# Deploy to production
./deploy-v3.sh
```

## 🎯 Architecture Overview

This platform implements a v3 architecture with sport-scoped tooling that exposes ≤3 meta-tools per request, improving LLM accuracy and token efficiency by 75%.

### 🏗️ Key Components

- **sports-proxy**: Main orchestrator with native OpenAI Responses API integration. It intelligently routes requests to sport-specific microservices (MCPs), handles tool execution with an approve/enrich pattern, manages conversation state, and implements a multi-layer caching strategy (KV for hot cache, R2 for cold cache) with smart TTLs.
- **auth-mcp**: Production-ready authentication and user management service with JWT tokens, Stripe billing, encrypted credential storage, and fantasy provider integration.
- **baseball-stats-mcp**: Baseball statistics meta-tool façade (MLB API)
- **baseball-fantasy-mcp**: Fantasy baseball data with ESPN authentication, supporting multi-league management via `league_id`.
- **baseball-news-mcp**: Baseball news aggregation with caching
- **hockey-stats-mcp**: Hockey statistics meta-tool façade (NHL API)

### 🚀 Architecture Principles

- **✅ OpenAI Responses API Native**: The `sports-proxy` fully complies with OpenAI's latest API specification, including streaming and conversation management.
- **🔐 Production Authentication**: Complete user management with JWT authentication, Stripe billing integration, encrypted fantasy provider credentials, and subscription enforcement.
- **🎯 Sport-scoped tooling**: Intelligent sport detection within `sports-proxy` exposes only relevant tools to the LLM.
- **⚡ Zero-latency communication**: Cloudflare Service Bindings for sub-millisecond worker-to-worker calls between `sports-proxy` and MCPs.
- **🔧 Meta-tool façades & Approve/Enrich**: MCPs expose meta-tools. The `sports-proxy` orchestrates an "approve/enrich" flow where resolver tools (e.g., `resolve_team`) are called first, and their results enrich subsequent data tool calls (e.g., `get_team_roster`).
- **🧠 Intelligent entity resolution**: Automatic team/player name → ID resolution handled by MCPs, orchestrated by `sports-proxy`.
- **💬 Conversation context**: Memory persistence and response chaining managed by `sports-proxy` using `previous_response_id` and injectable memories.
- **📡 Streaming support**: `sports-proxy` provides real-time Server-Sent Events for live responses, adhering to OpenAI Responses API event types.
- **Advanced Caching**: `sports-proxy` utilizes a multi-layer caching system (Cloudflare KV for hot cache, R2 for cold storage) with dynamic TTLs based on data type and game state to optimize performance and reduce API calls to backend MCPs.
- **🎯 Multi-League Fantasy Support**: Enables users to manage and interact with multiple fantasy leagues per sport/provider. This is facilitated by a `league_id` parameter in fantasy tool calls (e.g., for `baseball-fantasy-mcp`) and a League Discovery API (`GET /leagues`) for users to select their active league. Authentication is handled on a per-league basis for granularity. This is achieved while maintaining the strict ≤3 meta-tools per request limit.

## 📁 Directory Structure

```
sports-platform/
├── workers/                    # Cloudflare Workers
│   ├── sports-proxy/          # Main orchestrator (Responses API)
│   ├── auth-mcp/              # Authentication & user management
│   ├── baseball-stats-mcp/    # MLB meta-tool façade
│   ├── baseball-fantasy-mcp/  # ESPN fantasy integration
│   ├── baseball-news-mcp/     # News aggregation
│   └── hockey-stats-mcp/      # NHL meta-tool façade
├── docs/                      # Architecture documentation
├── test-responses-api.js      # Comprehensive test suite
├── test-manual.js            # Manual testing script
└── README.md                 # This file
```

## 🧪 Test Results (All Passing ✅)

Our comprehensive test suite validates all core functionality:

### ✅ Test 1: OpenAI Responses API with Conversation Context
- Multiple message conversation flow with `previous_response_id`
- Memory injection and persistence
- Proper token counting and response formatting
- Response ID generation and tracking

### ✅ Test 2: MLB Stats Integration  
- Entity resolution: "Yankees" → team ID 147
- Real MLB API data retrieval via baseball-stats-mcp
- Service binding routing with <1ms latency
- Tool detection and meta-tool façade pattern

### ✅ Test 3: Hockey Stats Integration (Separate Conversation)
- Sport detection: "Bruins" → hockey context routing
- Entity resolution: "Bruins" → team ID 6  
- Service binding to hockey-stats-mcp
- Separate conversation context from MLB

### ✅ Test 4: Streaming Responses API
- Server-Sent Events (SSE) streaming
- Word-by-word response streaming
- Proper event types: `response.created`, `response.in_progress`, `response.output_text.delta`

### ✅ Test 5: Authentication System Integration
- Complete user signup and session management flow
- JWT token verification and subscription enforcement  
- ESPN credential linking with encrypted storage
- Service binding integration with fantasy MCPs
- Security boundary validation and authorization

### ✅ Test 6: Health & Performance
- All service bindings connected and healthy
- Response times <30ms (excellent performance)
- Cache systems (KV + R2) operational

## 🚀 Quick Start

### 1. Start Development Servers

```bash
# Terminal 1 - Auth MCP (authentication service)
cd workers/auth-mcp
wrangler dev --port 8787 --local

# Terminal 2 - Hockey Stats MCP
cd workers/hockey-stats-mcp
wrangler dev --port 8783 --local

# Terminal 3 - Baseball Stats MCP  
cd workers/baseball-stats-mcp
wrangler dev --port 8782 --local

# Terminal 4 - Sports Proxy (main orchestrator)
cd workers/sports-proxy
wrangler dev --port 8081 --local
```

### 2. Run Tests

```bash
# Comprehensive test suite
node test-responses-api.js

# Authentication integration tests
cd workers/sports-proxy
./scripts/test-runner.sh auth

# Manual tests
node test-manual.js health       # Health check
node test-manual.js conversation # Conversation context
node test-manual.js mlb          # MLB integration
node test-manual.js hockey       # Hockey integration
node test-manual.js all          # All tests
```

### 3. OpenAI Responses API Usage

```javascript
// Authenticated conversation
const response = await fetch('http://localhost:8081/responses', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-session-token'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    input: 'Tell me about my Yankees fantasy team',
    tools: [
      {
        name: 'resolve_team',
        description: 'Resolve team name to team information',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Team name' }
          }
        }
      }
    ],
    memories: [
      { key: 'user_sport', value: 'baseball' },
      { key: 'user_id', value: 'your-user-id' }
    ]
  })
});
```

Note: For fantasy sports interactions, users must first authenticate via the auth-mcp service. Tools (e.g., `mlb.fantasy` exposed by `baseball-fantasy-mcp`) require a `league_id` parameter to specify the target league. A `GET /leagues` endpoint is available to discover a user's available leagues. ESPN credentials are securely stored and automatically retrieved for fantasy API calls.

## 🏆 Performance Metrics

- **Response Time**: <30ms average (99th percentile)
- **Token Efficiency**: 75% reduction vs v2 architecture
- **Tool Exposure**: ≤3 tools per request (vs 6-12 in v2)
- **Context Tokens**: ~250 (vs ~900 in v2)
- **Service Binding Latency**: <1ms worker-to-worker
- **API Compliance**: 100% OpenAI Responses API specification

## 🔧 Development

### Service Bindings Configuration

The platform uses Cloudflare Service Bindings for zero-latency communication:

```toml
# sports-proxy/wrangler.toml
[[services]]
binding = "AUTH_MCP"
service = "auth-mcp"

[[services]]
binding = "MLB_MCP"
service = "baseball-stats-mcp"

[[services]]
binding = "HOCKEY_MCP"
service = "hockey-stats-mcp"
```

### Adding New Sports

1. Create new `{sport}-stats-mcp` worker
2. Implement v3 meta-tool façade pattern
3. Add service binding to sports-proxy
4. Update sport detection patterns
5. Add tests for new integration

### Meta-Tool Façade Pattern

Each sport microservice exposes 6 endpoints via a single meta-tool:

```javascript
const endpoints = ['player', 'team', 'game', 'standings', 'schedule', 'advanced'];

// Single request fans out to multiple concrete endpoints
POST /{sport}-stats-mcp/
{
  "endpoint": "team",
  "query": { "name": "Yankees" }
}
```

## 📚 Documentation

- [Architecture Details](docs/ARCHITECTURE.md)
- [Authentication System](workers/auth-mcp/README.md)
- [Frontend UX Guide](docs/FRONTEND-UX-BRIEF.md)
- [MLB API Integration](docs/MLB%20Stats%20API.md) 
- [Testing Guide](TESTING.md)
- [Service Bindings Setup](workers/sports-proxy/README.md)

## 🤝 Contributing

1. Follow the v3 meta-tool façade pattern
2. Ensure OpenAI Responses API compliance
3. Add comprehensive tests for new features
4. Update documentation for any architectural changes

## 📈 Roadmap

- [x] ✅ **Complete Authentication System** (v3.2)
  - User signup/login with JWT tokens
  - Stripe billing integration for subscriptions
  - Encrypted ESPN credential storage
  - Service binding integration across all workers
- [ ] NFL stats integration (`nfl-stats-mcp`)
- [ ] NBA stats integration (`nba-stats-mcp`) 
- [ ] Yahoo Fantasy OAuth integration
- [ ] Real-time WebSocket support
- [ ] Enhanced caching with edge TTL optimization
- [ ] Production deployment automation

---

**Status**: ✅ Production Ready | **API**: OpenAI Responses API Native | **Auth**: Complete JWT System | **Tests**: All Passing