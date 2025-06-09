# Sports Platform Complete Guide

## 🎯 Platform Overview

The Sports Platform v3.2 is a production-ready microservices architecture providing comprehensive sports intelligence, fantasy league management, and user analytics through OpenAI's Responses API integration.

### **Core Value Proposition**
- **Unified Sports Data**: Real-time access to baseball and hockey statistics
- **Fantasy Management**: Multi-provider ESPN/Yahoo integration
- **Intelligent Analytics**: User behavior insights and business intelligence
- **Scalable Architecture**: Cloudflare Workers with D1 database
- **Premium Experience**: Subscription-based advanced features

---

## 🏗️ Architecture Overview

### **Microservices Architecture**
```
Production Deployment:
├── Auth MCP (https://auth-mcp.gerrygugger.workers.dev)
│   ├── User Authentication & JWT Management
│   ├── Subscription Management via Stripe
│   ├── Fantasy Credentials Storage
│   └── D1 Analytics Database
│
├── Sports Proxy (https://sports-proxy.gerrygugger.workers.dev)
│   ├── OpenAI Responses API Orchestration
│   ├── Multi-layer Prompt System
│   ├── Advanced Caching (KV + R2)
│   └── User Analytics Tracking
│
├── Baseball Services
│   ├── Stats MCP (pybaseball integration)
│   ├── Fantasy MCP (ESPN API integration)
│   └── News MCP (ESPN news feeds)
│
└── Hockey Services
    ├── Stats MCP (NHL API integration)
    └── Fantasy MCP (Yahoo API integration)
```

### **Data Architecture Evolution**

#### **Previous (v3.1) - Distributed Storage**
```
❌ Limitations:
• Durable Objects for session data (isolated)
• KV for user preferences (scattered)
• No cross-user analytics capabilities
• Manual data aggregation required
```

#### **Current (v3.2) - Centralized D1 Analytics**
```
✅ D1 Database Schema:
├── User Management (users, subscriptions, fantasy_credentials)
├── Analytics Tables
│   ├── user_preferences - Centralized settings
│   ├── user_scripts - Macro/template storage
│   ├── tool_usage_logs - Complete tool analytics
│   ├── conversation_logs - User interaction tracking
│   ├── fantasy_usage_logs - Provider analytics
│   ├── user_daily_metrics - Aggregated metrics
│   ├── platform_daily_metrics - System-wide analytics
│   └── user_tier_analytics - Subscription insights
```

---

## 🚀 Deployment Status

### **Production Services**

| Service | URL | Status | Features |
|---------|-----|--------|----------|
| **Auth MCP** | https://auth-mcp.gerrygugger.workers.dev | ✅ Live | User auth, subscriptions, analytics |
| **Sports Proxy** | https://sports-proxy.gerrygugger.workers.dev | ✅ Live | API orchestration, caching |
| **Baseball Stats** | https://baseball-stats-mcp.gerrygugger.workers.dev | ✅ Live | pybaseball integration |
| **Baseball Fantasy** | https://baseball-fantasy-mcp.gerrygugger.workers.dev | ✅ Live | ESPN API integration |
| **Hockey Stats** | https://hockey-stats-mcp.gerrygugger.workers.dev | ✅ Live | NHL API integration |
| **Hockey Fantasy** | https://hockey-fantasy-mcp.gerrygugger.workers.dev | ✅ Live | Yahoo API integration |

### **Service Health Verification**
```bash
# Quick health check
curl https://sports-proxy.gerrygugger.workers.dev/health
curl https://auth-mcp.gerrygugger.workers.dev/health
```

---

## 📊 Analytics & Business Intelligence

### **User Behavior Analytics**
The platform now provides comprehensive insights into user behavior patterns:

```sql
-- Example analytics queries now possible:

-- Tool usage by sport
SELECT tool_name, sport, COUNT(*) as usage_count
FROM tool_usage_logs 
WHERE timestamp >= date('now', '-30 days')
GROUP BY tool_name, sport
ORDER BY usage_count DESC;

-- Fantasy provider preferences
SELECT provider, COUNT(DISTINCT user_id) as users
FROM fantasy_usage_logs
GROUP BY provider;

-- Subscription tier performance
SELECT s.plan, AVG(m.total_requests) as avg_requests
FROM user_daily_metrics m
JOIN subscriptions s ON m.user_id = s.user_id
WHERE s.status = 'active'
GROUP BY s.plan;
```

### **Business Intelligence Capabilities**
- **Feature Adoption**: Track which tools drive user engagement
- **Revenue Optimization**: Correlate usage patterns with subscription tiers
- **Churn Prediction**: Analyze behavior patterns for retention strategies
- **Capacity Planning**: Data-driven resource allocation

---

## 🔑 API Integration Guide

### **Authentication Flow**
```javascript
// 1. User Signup
const signupResponse = await fetch('https://auth-mcp.gerrygugger.workers.dev/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    turnstileToken: 'captcha-token'
  })
});

// 2. Magic Link Login
const loginResponse = await fetch('https://auth-mcp.gerrygugger.workers.dev/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    magicToken: 'received-via-email'
  })
});

const { sessionToken } = await loginResponse.json();
```

### **OpenAI Responses API Integration**
```javascript
// Primary API endpoint for sports intelligence
const response = await fetch('https://sports-proxy.gerrygugger.workers.dev/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    input: 'Get me the latest Yankees roster and stats',
    instructions: 'Use casual tone, focus on key insights',
    tools: ['resolve_team', 'get_team_roster', 'get_player_stats'],
    stream: true
  })
});
```

### **User Preferences Management**
```javascript
// Set user preferences
await fetch('https://sports-proxy.gerrygugger.workers.dev/prefs?userId=user-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    favoriteTeam: 'Yankees',
    communicationStyle: 'casual',
    defaultSport: 'baseball'
  })
});

// Save reusable scripts/macros
await fetch('https://sports-proxy.gerrygugger.workers.dev/scripts?userId=user-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'yankees-update',
    name: 'Yankees Daily Update',
    description: 'Get latest Yankees news and roster changes',
    content: 'Get me today\'s Yankees news, roster updates, and upcoming games',
    sport: 'baseball'
  })
});
```

---

## 💰 Subscription Management

### **Subscription Tiers**
- **Free**: Basic sports data access, limited requests
- **Pro**: Advanced analytics, fantasy integration, higher limits
- **Elite**: Premium features, priority support, unlimited access

### **Stripe Integration**
```javascript
// Create billing session
const billingResponse = await fetch('https://auth-mcp.gerrygugger.workers.dev/billing/create-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({ plan: 'pro' })
});

const { url } = await billingResponse.json();
// Redirect user to Stripe checkout
window.location.href = url;
```

---

## 🎮 Fantasy Sports Integration

### **ESPN Integration**
```javascript
// Link ESPN credentials
await fetch('https://auth-mcp.gerrygugger.workers.dev/auth/link-espn', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    leagueId: '12345',
    swid: 'espn-swid-token',
    espnS2: 'espn-s2-token',
    turnstileToken: 'captcha-token'
  })
});

// Access fantasy data
const fantasyData = await fetch('https://sports-proxy.gerrygugger.workers.dev/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    input: 'Show me my ESPN fantasy baseball league standings',
    tools: ['get_fantasy_league', 'get_league_standings']
  })
});
```

---

## 🚀 Performance & Caching

### **Multi-Layer Caching Strategy**
1. **KV Cache (Hot Data)**: Fast access for frequently requested data
2. **R2 Cache (Cold Data)**: Long-term storage for historical data
3. **Smart TTL**: Dynamic cache duration based on data type

### **Cache Performance**
- **Sports Stats**: 5-15 minute TTL (during games: 1 minute)
- **Fantasy Data**: 30 minutes TTL
- **User Preferences**: 24 hours TTL
- **News/Updates**: 2-5 minutes TTL

### **Performance Metrics**
- **Average Response Time**: <200ms (cached), <800ms (live)
- **Cache Hit Rate**: 65-80% depending on usage patterns
- **Uptime**: 99.9% (Cloudflare Workers SLA)

---

## 🔧 Development & Deployment

### **Local Development Setup**
```bash
# Clone repository
git clone [repository-url]
cd sports-platform

# Install dependencies
npm install

# Start development servers
./start-dev-servers.sh

# Run comprehensive tests
./tests/test-all.js
```

### **Deployment Process**
```bash
# Deploy all services
./deploy-v3.sh

# Deploy individual service
cd workers/auth-mcp && wrangler deploy

# Verify deployment
./tests/test-production-services.js
```

### **Environment Configuration**
Required environment variables:
- `JWT_SECRET`: JWT signing secret
- `STRIPE_SECRET_KEY`: Stripe API key
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile
- `ENCRYPTION_KEY`: Data encryption key

---

## 📈 Analytics Dashboard Capabilities

### **User Analytics**
- Tool usage patterns by sport and time
- Conversation flow analysis
- Session duration and engagement metrics
- Feature adoption and retention rates

### **Platform Analytics**
- System-wide usage statistics
- Popular tools and endpoints
- Performance bottleneck identification
- Revenue and subscription metrics

### **Fantasy Sports Insights**
- Provider preference analysis (ESPN vs Yahoo)
- League engagement patterns
- Multi-league user behavior
- Credential refresh analytics

---

## 🔮 Roadmap & Future Enhancements

### **Phase 1: Advanced Analytics (Next)**
- Real-time analytics dashboards
- Predictive user behavior models
- Advanced business intelligence reports
- Automated insights and recommendations

### **Phase 2: Expansion (Q1 2025)**
- Additional sports (Football, Basketball)
- More fantasy providers integration
- Mobile application development
- Advanced personalization features

### **Phase 3: AI Enhancement (Q2 2025)**
- Custom AI models for sports predictions
- Personalized content generation
- Advanced natural language processing
- Automated fantasy team optimization

---

## 🛠️ Troubleshooting & Support

### **Common Issues**
1. **Authentication Errors**: Check JWT token validity and expiration
2. **Rate Limiting**: Implement proper backoff strategies
3. **Cache Misses**: Monitor cache hit rates and adjust TTL
4. **Fantasy API Failures**: Handle credential refresh logic

### **Monitoring & Observability**
- **Health Endpoints**: All services provide `/health` endpoints
- **Request Tracing**: Comprehensive logging with trace IDs
- **Error Tracking**: Structured error responses with request IDs
- **Performance Metrics**: Response time and cache hit tracking

### **Support Channels**
- **Documentation**: Complete API reference and guides
- **Health Dashboard**: Real-time service status monitoring
- **Error Logs**: Detailed error tracking and debugging
- **Performance Analytics**: Usage patterns and optimization insights

---

*Sports Platform v3.2 - Production Ready with Advanced Analytics*  
*Last Updated: December 8, 2024*