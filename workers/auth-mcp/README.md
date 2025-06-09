# Auth MCP - Authentication & User Management

Production-ready authentication and user management service for Sports Platform v3.2.

**Production**: https://auth-mcp.gerrygugger.workers.dev ✅

## 🔧 Service-Specific Configuration

### Environment Variables
```bash
# Database
DATABASE=sports-platform-db

# Stripe integration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security
TURNSTILE_SECRET_KEY=...
JWT_SECRET=...

# Storage
KV_CREDENTIALS=auth-credentials
KV_CACHE=auth-cache
```

### Database Schema
```sql
-- Key tables managed by this service
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

CREATE TABLE fantasy_credentials (
  user_id TEXT,
  provider TEXT,
  credentials TEXT, -- Encrypted JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Local Development
```bash
# Start this service (start first - required by others)
cd workers/auth-mcp
wrangler dev --port 8787 --local

# Run migrations
wrangler d1 migrations apply sports-platform-db --local

# Health check
curl http://localhost:8787/health
```

## 📡 Available Endpoints

### Authentication
- `POST /auth/signup` - User registration with Turnstile
- `POST /auth/login` - Magic link authentication  
- `POST /auth/logout` - Session termination
- `GET /auth/verify` - Token verification

### User Management
- `GET /user/{id}` - Get user profile
- `PATCH /user/{id}` - Update user profile
- `DELETE /user/{id}` - Delete user account

### Subscription Management
- `GET /subscription?userId={id}` - Get subscription status
- `POST /subscription/upgrade` - Upgrade subscription
- `POST /subscription/webhook` - Stripe webhook handler

### Fantasy Credentials
- `POST /credentials/{provider}` - Store encrypted credentials
- `GET /credentials/{provider}?userId={id}` - Retrieve credentials
- `DELETE /credentials/{provider}?userId={id}` - Remove credentials

## 🏗️ Technical Implementation

### JWT Token Structure
```javascript
{
  "userId": "user-123",
  "email": "user@example.com", 
  "plan": "pro",
  "iat": 1703123456,
  "exp": 1703209856
}
```

### Credential Encryption
```javascript
// Credentials are encrypted before storage
const encryptedCredentials = await encrypt(JSON.stringify({
  espn_s2: "cookie-value",
  swid: "user-swid"
}), env.ENCRYPTION_KEY);
```

### Service Binding Integration
```javascript
// Other services call auth via binding
const authResult = await env.AUTH_MCP.fetch('/auth/verify', {
  method: 'POST',
  body: JSON.stringify({ token: sessionToken })
});
```

## 🔍 Troubleshooting

### Common Issues
- **Database connection**: Check D1 binding configuration
- **Stripe webhooks**: Verify endpoint URL and secret
- **Encryption errors**: Ensure ENCRYPTION_KEY is set
- **Session persistence**: Check Durable Objects health

### Debug Commands
```bash
# Check database
wrangler d1 execute sports-platform-db --command "SELECT COUNT(*) FROM users;"

# Test auth flow
curl -X POST http://localhost:8787/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","turnstileToken":"test"}'

# Check logs
wrangler tail auth-mcp --format=pretty
```

---

For complete authentication integration guide, see [Development Guide](../../docs/DEVELOPMENT-GUIDE.md)
│  │ • auth-mcp.fetch('/user/credentials?provider=espn')        │ │
│  │ • Decrypted ESPN cookies/Yahoo tokens                      │ │
│  │ • League-specific credential scoping                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Deploy Auth MCP

```bash
# Clone and setup
git clone <repository>
cd workers/auth-mcp

# Install dependencies
npm install

# Deploy with infrastructure setup
./deploy.sh staging
```

### 2. Configure Secrets

```bash
# JWT signing key
wrangler secret put JWT_SECRET
# Enter: your-super-secret-jwt-key

# Credential encryption key
wrangler secret put ENCRYPTION_KEY
# Enter: your-32-char-encryption-key

# Turnstile (optional)
wrangler secret put TURNSTILE_SECRET_KEY
# Enter: your-turnstile-secret

# Stripe (optional)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 3. Test Integration

```bash
# Run comprehensive tests
node test-auth.js

# Test from sports-proxy
cd ../sports-proxy
./scripts/test-runner.sh auth
```

## 📡 API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | User registration with Turnstile |
| `/auth/login` | POST | Magic link to session token exchange |
| `/auth/verify` | GET | JWT token verification |

### User Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user/profile` | GET | User profile with subscription status |
| `/user/credentials` | GET | Retrieve fantasy provider credentials |
| `/auth/link-espn` | POST | Link ESPN SWID/espn_s2 cookies |

### Billing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/billing/create-session` | POST | Create Stripe checkout session |
| `/billing/webhook` | POST | Handle Stripe webhooks |

### System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health and diagnostics |

## 🔐 Authentication Flow

### 1. User Signup
```javascript
const response = await fetch('/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    turnstileToken: 'captcha-token'
  })
});

const { userId, magicToken } = await response.json();
```

### 2. Session Creation
```javascript
const sessionResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    magicToken: magicToken
  })
});

const { sessionToken, user } = await sessionResponse.json();
```

### 3. Authenticated Requests
```javascript
const profileResponse = await fetch('/user/profile', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
});
```

## 🏆 Fantasy Provider Integration

### ESPN Cookie Linking
```javascript
await fetch('/auth/link-espn', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    leagueId: 'your-espn-league-id',
    swid: 'your-espn-swid',
    espnS2: 'your-espn-s2-cookie',
    turnstileToken: 'captcha-token'
  })
});
```

### Credential Retrieval (Internal)
```javascript
// Used by fantasy MCPs via service binding
const credResponse = await env.AUTH_MCP.fetch('/user/credentials?provider=espn&leagueId=123', {
  headers: {
    'Authorization': 'Bearer system-internal-token',
    'X-User-ID': userId
  }
});

const { credentials } = await credResponse.json();
// { swid: 'decrypted-swid', espnS2: 'decrypted-s2' }
```

## 💳 Billing Integration

### Create Subscription
```javascript
const billingResponse = await fetch('/billing/create-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan: 'pro' // or 'elite'
  })
});

const { sessionId, url } = await billingResponse.json();
// Redirect user to Stripe checkout: window.location.href = url
```

### Webhook Handling
```javascript
// Stripe webhook endpoint
app.post('/billing/webhook', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'invoice.payment_succeeded':
      // Activate subscription
      break;
    case 'customer.subscription.deleted':
      // Cancel subscription
      break;
  }
});
```

## 🔧 Configuration

### Environment Variables

```toml
# wrangler.toml
[vars]
JWT_ISSUER = "sports-platform.workers.dev"
JWT_AUDIENCE = "sports-api"
TURNSTILE_SITE_KEY = "your-site-key"
STRIPE_PUBLISHABLE_KEY = "pk_test_..."
```

### Secrets (via wrangler secret put)
- `JWT_SECRET` - JWT signing key
- `ENCRYPTION_KEY` - Credential encryption key
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    status TEXT NOT NULL, -- active | past_due | canceled
    plan TEXT NOT NULL,   -- pro | elite
    current_period_end TIMESTAMP
);

-- Fantasy credentials table (encrypted)
CREATE TABLE fantasy_credentials (
    user_id TEXT NOT NULL REFERENCES users(id),
    provider TEXT NOT NULL, -- espn | yahoo
    league_id TEXT NOT NULL,
    swid TEXT,      -- ESPN only (encrypted)
    espn_s2 TEXT,   -- ESPN only (encrypted)
    access_token TEXT,  -- Yahoo only (encrypted)
    refresh_token TEXT, -- Yahoo only (encrypted)
    PRIMARY KEY (user_id, provider, league_id)
);
```

## 🧪 Testing

### Unit Tests
```bash
# Test auth endpoints
node test-auth.js

# Expected output:
# ✅ Health endpoint responds
# ✅ Signup returns user ID
# ✅ Login returns session token
# ✅ Token verification works
```

### Integration Tests
```bash
# From sports-proxy directory
./scripts/test-runner.sh auth

# Tests complete user flow:
# 1. Signup → Login → Profile
# 2. ESPN credential linking
# 3. Sports proxy authentication
# 4. Fantasy MCP integration
```

### Load Testing
```bash
# Use any HTTP load testing tool
ab -n 1000 -c 10 http://localhost:8787/health
```

## 🔍 Observability

### Request Tracing
All requests include trace headers:
```
X-Request-ID: abc12345
X-Trace-ID: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

### Structured Logging
```javascript
// Request start
console.log('[abc12345] POST /auth/login - Start', {
  traceId: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
  userAgent: 'Mozilla/5.0...',
  ip: '192.168.1.1',
  timestamp: '2025-01-06T10:00:00Z'
});

// Request complete
console.log('[abc12345] POST /auth/login - Complete', {
  traceId: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
  duration: 150,
  timestamp: '2025-01-06T10:00:00Z'
});
```

### Error Tracking
```javascript
// Error with context
console.error('[abc12345] POST /auth/login - Error', {
  traceId: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
  error: 'Invalid magic token',
  stack: '...',
  duration: 50,
  timestamp: '2025-01-06T10:00:00Z'
});
```

## 🚀 Deployment

### Staging
```bash
./deploy.sh staging
```

### Production
```bash
./deploy.sh production
```

### Deployment Checklist
- [ ] D1 database created and migrated
- [ ] KV namespaces created
- [ ] All secrets configured
- [ ] Stripe webhook endpoint updated
- [ ] Turnstile domain configured
- [ ] Health check passing
- [ ] Integration tests passing

## 🔒 Security

### JWT Security
- Tokens signed with HS256 algorithm
- Short expiration times (24 hours for sessions)
- Magic link tokens expire in 15 minutes
- Secure, HttpOnly session cookies

### Credential Encryption
- ESPN cookies encrypted at rest using Web Crypto API
- Encryption keys stored in Cloudflare Secrets
- Per-user, per-league credential isolation

### Rate Limiting
- Durable Object-based rate limiting
- Turnstile CAPTCHA on sensitive endpoints
- IP-based request limiting

### Input Validation
- Email format validation
- Turnstile token verification
- SQL injection prevention (parameterized queries)
- XSS prevention (JSON responses only)

## 📊 Performance

### Response Times
- Health check: <50ms
- Token verification: <100ms
- Credential retrieval: <150ms (KV hit) / <300ms (DB fallback)
- User signup: <500ms

### Caching Strategy
- Credentials cached in KV for 24 hours
- Session data in Durable Objects (edge-local)
- Hot token validation cache

### Scalability
- Cloudflare Workers: Auto-scaling to millions of requests
- D1: Strongly consistent for user data
- KV: Eventually consistent for credentials
- Durable Objects: Regional persistence

## 🤝 Integration with Sports Platform

### Service Binding Pattern
```javascript
// In sports-proxy wrangler.toml
[[services]]
binding = "AUTH_MCP"
service = "auth-mcp"

// In sports-proxy code
const user = await env.AUTH_MCP.fetch('/auth/verify', {
  headers: { 'Authorization': authHeader }
});
```

### User Context Propagation
```javascript
// Sports proxy adds user context to downstream requests
const enhancedRequest = new Request(originalRequest.url, {
  ...originalRequest,
  headers: {
    ...originalRequest.headers,
    'X-User-ID': user.userId,
    'X-Subscription-Plan': user.subscription?.plan || 'none'
  }
});
```

### Fantasy MCP Integration
```javascript
// Fantasy MCPs retrieve credentials
async function getUserCredentials(userId, env, provider, leagueId) {
  const response = await env.AUTH_MCP.fetch(
    `/user/credentials?provider=${provider}&leagueId=${leagueId}`,
    {
      headers: {
        'Authorization': 'Bearer system-internal-token',
        'X-User-ID': userId
      }
    }
  );
  
  return response.json();
}
```

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Basic authentication (signup/login)
- ✅ JWT token management
- ✅ ESPN credential storage
- ✅ Stripe billing integration
- ✅ Service binding integration

### Phase 2 (Planned)
- [ ] Yahoo OAuth integration
- [ ] Multi-factor authentication
- [ ] Advanced rate limiting
- [ ] Audit logging
- [ ] Password-based auth option

### Phase 3 (Future)
- [ ] Social login (Google, GitHub)
- [ ] SAML/SSO integration
- [ ] Advanced analytics
- [ ] Compliance features (GDPR, etc.)

---

**Auth MCP v1.0 - Production-ready authentication for Sports Platform** 🔐

*Built with Cloudflare Workers, D1, KV, and Durable Objects*