# Sports Platform API Reference

Complete API documentation for Sports Platform v3.2 - Production-ready endpoints with 4 sport-specific entity resolvers and integration guides.

## 🚀 Base URLs

| Environment | URL | Status |
|-------------|-----|--------|
| **Production** | `https://sports-proxy.gerrygugger.workers.dev` | ✅ Live |
| **Development** | `http://localhost:8081` | Local |

## 🔐 Authentication

All API endpoints require authentication via JWT session tokens obtained from the Auth MCP service.

### Headers
```http
Authorization: Bearer <session-token>
Content-Type: application/json
```

### Getting Session Tokens
```javascript
// 1. Signup
POST https://auth-mcp.gerrygugger.workers.dev/auth/signup
{
  "email": "user@example.com",
  "turnstileToken": "captcha-token"
}

// 2. Login with magic link
POST https://auth-mcp.gerrygugger.workers.dev/auth/login
{
  "magicToken": "received-via-email"
}
// Returns: { "sessionToken": "jwt-token", "userId": "user-id" }
```

## 📡 Core API Endpoints

### OpenAI Responses API (Primary)

**POST** `/responses`

Native OpenAI Responses API implementation with sports intelligence.

#### Request
```javascript
{
  "model": "gpt-4",
  "input": "Get me the Yankees roster and recent performance",
  "instructions": "Use casual tone, focus on key insights", // Optional
  "tools": ["resolve_team", "get_team_roster", "get_player_stats"], // Optional
  "memories": [ // Optional
    { "key": "user_sport", "value": "baseball" },
    { "key": "favorite_team", "value": "Yankees" }
  ],
  "previous_response_id": "resp_123", // Optional for conversation context
  "stream": true // Optional, enables SSE streaming
}
```

#### Response (Non-streaming)
```javascript
{
  "id": "resp_456",
  "object": "response",
  "created": 1703123456,
  "model": "gpt-4",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Here's the current Yankees roster and performance analysis..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 250,
    "completion_tokens": 180,
    "total_tokens": 430
  }
}
```

#### Response (Streaming)
Server-Sent Events format:
```
event: response.created
data: {"id": "resp_456", "object": "response", "created": 1703123456}

event: response.in_progress
data: {"id": "resp_456", "object": "response.in_progress"}

event: response.output_text.delta
data: {"id": "resp_456", "delta": "Here's"}

event: response.output_text.delta
data: {"id": "resp_456", "delta": " the current"}

event: response.done
data: {"id": "resp_456", "object": "response.done", "usage": {...}}
```

### Health Check

**GET** `/health`

Service health and status monitoring.

#### Response
```javascript
{
  "status": "healthy",
  "timestamp": "2024-12-21T10:30:00Z",
  "version": "3.2",
  "services": {
    "auth_mcp": "connected",
    "mlb_mcp": "connected", 
    "hockey_mcp": "connected"
  },
  "performance": {
    "avg_response_time": 28,
    "cache_hit_rate": 0.89
  }
}
```

## 🔧 User Management Endpoints

### User Preferences

**GET** `/prefs?userId={user-id}`

Retrieve user preferences and settings.

**PATCH** `/prefs?userId={user-id}`

Update user preferences.

#### Request
```javascript
{
  "favoriteTeam": "Yankees",
  "communicationStyle": "casual", // casual, professional, detailed
  "defaultSport": "baseball",
  "timezone": "America/New_York"
}
```

### User Scripts/Macros

**GET** `/scripts?userId={user-id}`

Get saved user scripts and macros.

**POST** `/scripts?userId={user-id}`

Save a new script/macro.

#### Request
```javascript
{
  "id": "yankees-update",
  "name": "Yankees Daily Update",
  "description": "Get latest Yankees news and roster changes",
  "content": "Get me today's Yankees news, roster updates, and upcoming games",
  "sport": "baseball",
  "tags": ["yankees", "daily", "news"]
}
```

## 🏀 Sport-Specific Entity Resolution Tools

### Baseball Entity Resolution

#### resolve_baseball_team
Resolve team name to canonical MLB team information with confidence scoring.
```javascript
{
  "name": "resolve_baseball_team",
  "input": { 
    "name": "Yankees",
    "fuzzy": true,
    "includeStats": false
  }
}
// Returns: {
//   "resolved": true,
//   "team": {
//     "id": 147, 
//     "name": "New York Yankees", 
//     "abbreviation": "NYY",
//     "match_type": "exact",
//     "confidence": 1.0,
//     "aliases": ["yankees", "ny yankees", "bronx bombers"]
//   }
// }
```

#### resolve_baseball_player
Resolve player name to canonical MLB player information.
```javascript
{
  "name": "resolve_baseball_player",
  "input": { 
    "name": "Judge",
    "team": "Yankees",
    "fuzzy": true,
    "includeStats": false
  }
}
// Returns: {
//   "resolved": true,
//   "player": {
//     "id": 592450,
//     "name": "Aaron Judge",
//     "team_id": 147,
//     "match_type": "alias",
//     "confidence": 0.9,
//     "aliases": ["judge", "aaron judge", "aj"]
//   }
// }
```

#### search_baseball_teams
Search for MLB teams with filters.
```javascript
{
  "name": "search_baseball_teams",
  "input": {
    "query": "new york",
    "division": "AL East",
    "limit": 10
  }
}
```

#### search_baseball_players
Search for MLB players with filters.
```javascript
{
  "name": "search_baseball_players",
  "input": {
    "query": "aaron",
    "team": "Yankees",
    "position": "OF",
    "active": true,
    "limit": 10
  }
}
```


### Hockey Entity Resolution

#### resolve_hockey_team
Resolve NHL team name to canonical team information.
```javascript
{
  "name": "resolve_hockey_team",
  "input": { 
    "name": "Bruins",
    "fuzzy": true,
    "includeStats": false
  }
}
// Returns: {
//   "resolved": true,
//   "team": {
//     "id": 6,
//     "name": "Boston Bruins",
//     "abbreviation": "BOS",
//     "match_type": "alias",
//     "confidence": 0.9,
//     "aliases": ["bruins", "boston bruins", "bs"]
//   }
// }
```

#### resolve_hockey_player
Resolve NHL player name to canonical player information.
```javascript
{
  "name": "resolve_hockey_player",
  "input": { 
    "name": "McDavid",
    "team": "Oilers",
    "fuzzy": true,
    "includeStats": false
  }
}
```

#### search_hockey_teams
Search for NHL teams with filters.
```javascript
{
  "name": "search_hockey_teams",
  "input": {
    "query": "boston",
    "division": "Atlantic",
    "conference": "Eastern"
  }
}
```

#### search_hockey_players
Search for NHL players with filters.
```javascript
{
  "name": "search_hockey_players",
  "input": {
    "query": "connor",
    "team": "Oilers",
    "position": "C",
    "active": true
  }
}
```

### Football Entity Resolution (Placeholder)

#### resolve_football_team
Resolve NFL team name to canonical team information.
```javascript
{
  "name": "resolve_football_team",
  "input": { 
    "name": "Patriots",
    "fuzzy": true,
    "includeStats": false
  }
}
// Returns placeholder NFL team data
```

#### resolve_football_player
Resolve NFL player name to canonical player information.
```javascript
{
  "name": "resolve_football_player",
  "input": { 
    "name": "Brady",
    "team": "Patriots",
    "fuzzy": true
  }
}
// Returns placeholder NFL player data
```

### Basketball Entity Resolution (Placeholder)

#### resolve_basketball_team
Resolve NBA team name to canonical team information.
```javascript
{
  "name": "resolve_basketball_team",
  "input": { 
    "name": "Lakers",
    "fuzzy": true,
    "includeStats": false
  }
}
// Returns placeholder NBA team data
```

#### resolve_basketball_player
Resolve NBA player name to canonical player information.
```javascript
{
  "name": "resolve_basketball_player",
  "input": { 
    "name": "LeBron",
    "team": "Lakers",
    "fuzzy": true
  }
}
// Returns placeholder NBA player data
```

### Legacy Fantasy Tools

Legacy fantasy tools require `league_id` parameter and authenticated ESPN/Yahoo credentials.

#### get_league_info
Get fantasy league information and settings.
```javascript
{
  "name": "get_league_info",
  "input": { "league_id": 12345, "provider": "espn" }
}
```

#### get_fantasy_roster
Get fantasy team roster.
```javascript
{
  "name": "get_fantasy_roster", 
  "input": { "league_id": 12345, "team_id": 1, "provider": "espn" }
}
```

## 🔐 Authentication MCP Endpoints

### User Management

**POST** `/auth/signup`
```javascript
{
  "email": "user@example.com",
  "turnstileToken": "captcha-token"
}
```

**POST** `/auth/login`
```javascript
{
  "magicToken": "token-from-email"
}
```

**POST** `/auth/logout`
```javascript
{
  "sessionToken": "current-session-token"
}
```

### Subscription Management

**GET** `/subscription?userId={user-id}`

Get current subscription status.

**POST** `/subscription/upgrade`
```javascript
{
  "userId": "user-id",
  "plan": "pro", // free, pro, elite
  "stripeToken": "stripe-payment-token"
}
```

### Fantasy Credentials

**POST** `/credentials/espn`
```javascript
{
  "userId": "user-id",
  "espn_s2": "encrypted-cookie-value",
  "swid": "user-swid-value"
}
```

**GET** `/credentials/espn?userId={user-id}`

Retrieve stored ESPN credentials (encrypted).

## 📊 Analytics & Insights

### Usage Analytics

**GET** `/analytics/usage?userId={user-id}&days=30`

Get user usage analytics and insights.

**GET** `/analytics/tools?userId={user-id}&sport=baseball`

Get tool usage breakdown by sport.

## 🚨 Error Handling

### Standard Error Response
```javascript
{
  "error": {
    "type": "authentication_error",
    "code": "invalid_token", 
    "message": "Session token is invalid or expired",
    "details": {
      "timestamp": "2024-12-21T10:30:00Z",
      "request_id": "req_123"
    }
  }
}
```

### Entity Resolution Error Response
```javascript
{
  "resolved": false,
  "query": "unknown player",
  "suggestions": [
    {
      "name": "Aaron Judge",
      "team_name": "New York Yankees",
      "relevance": 1
    }
  ]
}
```

### Error Types
- `authentication_error`: Invalid or expired tokens
- `authorization_error`: Insufficient permissions
- `validation_error`: Invalid request parameters
- `rate_limit_error`: Too many requests
- `service_error`: Internal service issues
- `external_api_error`: Third-party API failures
- `entity_resolution_error`: Entity not found or ambiguous

### HTTP Status Codes
- `200` Success
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden 
- `404` Not Found
- `429` Rate Limited
- `500` Internal Server Error
- `503` Service Unavailable

## 🚀 Rate Limits

| Tier | Requests/Hour | Concurrent | Tools/Request | Entity Resolvers |
|------|---------------|------------|---------------|------------------|
| **Free** | 100 | 2 | 3 | Baseball + Hockey |
| **Pro** | 1,000 | 5 | 3 | All 4 Sports |
| **Elite** | 10,000 | 10 | 3 | All 4 Sports + Priority |

## 📈 Performance Optimization

### Caching Headers
```http
Cache-Control: public, max-age=300
X-Cache-Status: HIT
X-Response-Time: 28ms
```

### Request Optimization
- Use `memories` for user context to reduce repeated queries
- Leverage conversation context with `previous_response_id`
- Enable streaming for real-time responses
- Batch related requests when possible

---

For more detailed integration examples, see the [Development Guide](./DEVELOPMENT-GUIDE.md).
