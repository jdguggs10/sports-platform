# Sports Platform Testing Guide (v3.2)

Comprehensive testing infrastructure for validating architectural connections, performance, and production readiness for Sports Platform v3.2.

## 🎯 Overview

This testing suite focuses on **architectural validation** rather than unit testing. It ensures that the Sports Platform v3.2 implementation matches the documented architecture and performs optimally in production environments.

### Key Testing Areas

- **🏗️ Architectural Compliance**: OpenAI Responses API, service bindings, meta-tool patterns
- **⚡ Performance Validation**: Service binding latency, concurrent requests, memory usage
- **🔗 Connection Testing**: Worker-to-worker communication, API integration, error handling
- **🏆 v3.2 Features**: Multi-league support, provider selection, league discovery
- **🛡️ Production Readiness**: CI guards, deployment blockers, reliability checks

## 🚀 Quick Start

### Prerequisites

Ensure all services are running as per the v3.2 setup:

```bash
# Terminal 1: Sports Proxy
cd workers/sports-proxy
npm run dev  # Port 8081

# Terminal 2: Hockey Stats MCP
cd workers/hockey-stats-mcp  
npm run dev  # Port 8783

# Terminal 3: Baseball Stats MCP
# Note: The path in tests/README.md was workers/mlbstats-mcp, ensure this is correct.
# Assuming it's baseball-stats-mcp based on TESTING.MD and common naming.
cd workers/baseball-stats-mcp 
npm run dev  # Port 8782 
# Or if it is indeed mlbstats-mcp:
# cd workers/mlbstats-mcp
# npm run dev  # Port 8782
```

### Run Tests

```bash
# From project root
cd tests

# Run complete test suite
node test-runner.js

# Run specific test suites
node test-runner.js architecture,performance

# Run CI integration (deployment validation)
node ci-integration.js

# Quick health check (part of CI integration script)
node ci-integration.js --quick

# Architectural deep dive
node architectural-validator.js
```

## 📋 Test Suite Components

### 1. Unified Test Runner (`test-runner.js`)

**Comprehensive orchestration of all testing activities.**

```bash
node test-runner.js [suites]
```

**Available Test Suites:**
- `architecture` - Core architectural patterns and compliance
- `service-bindings` - Zero-latency worker communication  
- `api-integration` - External API integration and data flow (includes MLB, Hockey, etc.)
- `fantasy-providers` - Multi-provider fantasy support (ESPN/Yahoo)
- `performance` - Performance benchmarks and resource usage
- `reliability` - Error handling and graceful degradation

**Features:**
- ✅ Automated service orchestration (startup/shutdown)
- ✅ Parallel service startup, sequential test execution
- ✅ Comprehensive performance metrics
- ✅ Detailed reporting with pass/fail breakdown
- ✅ Configurable timeouts and thresholds

**Example: MLB Stats Integration (via `api-integration` suite)**
This validates MLB data retrieval and entity resolution.
*   **Test Flow**:
    1.  "Tell me about the New York Yankees team"
        *   Tools: `resolve_team` for entity resolution.
        *   Expected: Team ID 147 resolution + real MLB API data.
    2.  "What about Aaron Judge stats?" (with conversation context)
        *   Tools: `resolve_player`, `get_player_stats`.
        *   Expected: Player resolution + statistics data.
*   **Sample MLB API Response Snippet (Illustrative)**:
    ```json
    {
      "id": "resp_1749318772396_pgjf74grjv",
      "data": {
        "teams": [{
          "id": 147,
          "name": "New York Yankees",
          "venue": { "name": "Yankee Stadium" },
          "division": { "name": "American League East" }
        }]
      },
      "meta": {
        "service": "baseball-stats-mcp",
        "mlb_api_url": "https://statsapi.mlb.com/api/v1/teams/147?season=2025",
        "resolved_entities": true
      }
    }
    ```

**Example: Hockey Stats Integration (via `api-integration` suite)**
This validates sport detection and hockey routing.
*   **Test Flow**:
    1.  "Tell me about the Boston Bruins hockey team" (New conversation)
        *   Tools: `resolve_team` for hockey context.
        *   Expected: Team ID 6 resolution + NHL data.
    2.  "What about Connor McDavid stats?" (Continues hockey conversation)
        *   Tools: `resolve_player`, `get_player_stats`.
        *   Expected: Hockey player resolution.
*   **Sample Hockey Response Snippet (Illustrative)**:
    ```json
    {
      "endpoint": "team",
      "query": { "name": "bruins", "teamId": 6, "teamName": "Boston Bruins" },
      "data": {
        "teams": [{
          "id": 6, "name": "Boston Bruins", "abbreviation": "BOS", 
          "division": "Atlantic", "venue": "TD Garden", "mock": true 
        }]
      },
      "meta": { "service": "hockey-stats-mcp", "resolved_entities": true }
    }
    ```

### 2. Architectural Validator (`architectural-validator.js`)

**Deep validation of architectural compliance.**

```bash
node architectural-validator.js [baseUrl]
```

**Validation Areas:**
- **OpenAI Responses API**: Format compliance, streaming, conversation context.
- **Service Bindings**: Performance, error handling, routing.
- **Meta-Tool Façades**: Tool count constraints (≤3), endpoint multiplexing.
- **v3.2 Multi-League**: `league_id` requirements, provider support.
- **Security Patterns**: Input validation, sensitive data exposure.
- **Error Handling**: Graceful degradation, recovery guidance.

**Example: OpenAI Responses API - Conversation Context Validation**
*   **Purpose**: Validates conversation memory and response chaining.
*   **Test Flow**:
    1.  Message 1: "Hello! My name is John and I love baseball" (includes memories)
    2.  Message 2: "Great! What can you help me with?" (uses `previous_response_id`)
    3.  Message 3: "Do you remember my name and favorite sport?" (tests memory recall)
*   **Expected**: Proper response ID generation, context preservation, memory injection.

**Example: OpenAI Responses API - Streaming Validation**
*   **Purpose**: Validates Server-Sent Events (SSE) streaming.
*   **Test Flow**: POST to `/responses` with `"stream": true`, parse events.
*   **Expected Events**: `response.created`, `response.in_progress`, `response.output_text.delta`, `response.completed`.
*   **Sample Events**:
    ```
    event: response.created
    data: {"id":"resp_stream_example","object":"response"}

    event: response.output_text.delta
    data: {"delta":"Streaming "}

    event: response.output_text.delta
    data: {"delta":"works."}

    event: response.completed
    data: {"id":"resp_stream_example","status":"completed"}
    ```

### 3. CI Integration (`ci-integration.js`)

**Continuous integration and deployment validation.**

```bash
node ci-integration.js
```

**CI Guards (Deployment Blockers):**
1.  **Service Health** - All required services operational.
    *   **Example Health Check Response Snippet**:
        ```json
        {
          "status": "healthy",
          "timestamp": "2025-06-07T17:52:52.380Z",
          "services": {
            "mcp": { "mlb": { "status": "healthy" }, "hockey": { "status": "healthy" } },
            "cache": { "hotCacheAvailable": true }
          }
        }
        ```
2.  **Tool Count Constraint** - ≤3 sport tools for LLM performance.
3.  **Responses API Compliance** - No deprecated Chat Completions usage.
4.  **League ID Requirement** - v3.2 fantasy tools enforce `league_id`.
5.  **Service Binding Performance** - <100ms latency requirement.
6.  **Memory Leak Detection** - Stable memory usage during operation.

## ⚙️ Configuration

### Test Configuration (`test-config.json`)

```json
{
  "services": {
    "sports-proxy": { "port": 8081, "path": "../workers/sports-proxy" },
    "hockey-stats-mcp": { "port": 8783, "path": "../workers/hockey-stats-mcp" },
    "baseball-stats-mcp": { "port": 8782, "path": "../workers/baseball-stats-mcp" } 
    // Or mlbstats-mcp if that's the correct name/path
    // "baseball-stats-mcp": { "port": 8782, "path": "../workers/mlbstats-mcp" } 
  },
  "timeouts": {
    "service_startup": 15000,
    "test_execution": 30000,
    "service_health": 5000
  },
  "performance_thresholds": {
    "health_check": 10,
    "service_binding": 100,
    "tool_call": 500,
    "responses_api": 2000
  }
}
```

### Environment Variables

```bash
TEST_BASE_URL=http://localhost:8081  # Test target URL
NODE_ENV=test                        # Environment mode
LOG_LEVEL=error                      # Reduce noise during testing
# From TESTING.MD (if still relevant for v3.2)
# ENVIRONMENT=development
# CACHE_TTL_HOT=10
# CACHE_TTL_COLD=300
```

## 🎯 Test Architecture Focus

### Service Binding Validation

Tests the zero-latency worker-to-worker communication architecture:
```javascript
// Validates <100ms service binding performance
const response = await fetch(\`\${baseUrl}/mcp/call\`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'mlb.stats',
    arguments: { endpoint: 'teams', team_id: '147' }
  })
});
```

### OpenAI Responses API Compliance

Ensures modern API usage (not deprecated Chat Completions):
```javascript
// Validates Responses API format and streaming
const response = await fetch(\`\${baseUrl}/responses\`, {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4.1', // Or current model
    input: 'Test message',
    stream: true
  })
});
```

### Meta-Tool Façade Pattern

Validates the ≤3 tool constraint for optimal LLM performance:
```javascript
// Ensures tool count stays within limits
const tools = await fetch(\`\${baseUrl}/mcp/tools\`).then(r => r.json());
const sportTools = tools.filter(t => t.name.includes('.'));
assert(sportTools.length <= 3, 'Too many sport tools');
```

### v3.2 Multi-League Features

Tests `league_id` parameter enforcement and provider support:
```javascript
// Validates league_id requirement
const response = await fetch(\`\${baseUrl}/mcp/call\`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'mlb.fantasy',
    arguments: {
      provider: 'espn',
      endpoint: 'team_roster'
      // Missing league_id should fail
    }
  })
});
```

## 📊 Performance Benchmarks

### Target Metrics

| Component           | Target | Measurement           |
|---------------------|--------|-----------------------|
| Health Check        | <10ms  | Response time         |
| Service Binding     | <100ms | Worker-to-worker latency|
| Tool Call           | <500ms | End-to-end tool execution|
| Responses API       | <2s    | Full request processing|
| Concurrent Requests | <1s avg| Average response time |

### Memory Usage

- **Baseline**: ~50MB heap usage
- **Growth Limit**: <5MB per 10 requests
- **Leak Detection**: Monitors heap growth over multiple requests

## 🛡️ Production Readiness

### CI Guards

The test suite includes deployment blockers that prevent problematic code from reaching production:
1.  **Architecture Compliance** - Prevents regression to deprecated patterns
2.  **Performance Degradation** - Blocks slow service binding implementations  
3.  **Tool Explosion** - Prevents >3 tool deployments that hurt LLM performance
4.  **Feature Regression** - Ensures v3.2 league features work correctly
5.  **Memory Leaks** - Detects resource management issues
6.  **Error Handling** - Validates graceful failure modes

### Integration with CI/CD

```yaml
# Example GitHub Actions integration
- name: Run Sports Platform Tests
  run: |
    # Start services (ensure start-dev-servers.sh is up-to-date)
    ./start-dev-servers.sh 
    
    # Wait for readiness
    sleep 10 # Adjust as needed
    
    # Run CI validation
    cd tests && node ci-integration.js
    
    # Architectural deep dive (optional in CI, good for detailed checks)
    node architectural-validator.js http://localhost:8081 
```

## 📈 Interpreting Results

### Success Indicators

```
🎉 All architectural connection tests passed!

🏗️ Validated Architecture Components:
  ✅ OpenAI Responses API compliance
  ✅ Service binding communication (<100ms)
  ✅ Meta-tool façade (≤3 tools)
  ✅ v3.2 league_id parameter enforcement
  ✅ Multi-provider fantasy support
  ✅ MLB/Hockey API integration
  ✅ Conversation context preservation
  ✅ Error handling and recovery
  ✅ Performance benchmarks
  ✅ Reliability safeguards

🚀 Sports Platform v3.2 is production ready!
```

### Failure Analysis & Troubleshooting

Common failure patterns and resolutions:

**Service Binding Failures:**
```
❌ service-binding-latency: Service binding calls must be <100ms
   Data: {"latency": 150, "threshold": 100}
```
*Resolution: Check `wrangler.toml` service bindings configuration in the respective worker (e.g., `sports-proxy/wrangler.toml`). Ensure target services are running and healthy.*

**Tool Count Violations:**
```
❌ tool-count-constraint: Must maintain ≤3 sport tools
   Data: {"toolCount": 5, "tools": ["mlb.stats", "mlb.fantasy", ...]}
```
*Resolution: Consolidate tools or remove excess sport implementations to adhere to the meta-tool façade pattern.*

**API Compliance Issues:**
```
❌ responses-api-compliance: Response format not compliant with Responses API spec
   Data: {"format": "chat.completion", "hasId": false}
```
*Resolution: Update to use OpenAI Responses API instead of deprecated Chat Completions API.*

**Services Not Connected (from `wrangler dev` output):**
```
env.MLB_MCP (baseball-stats-mcp)     Worker    local [not connected]
```
*Resolution: Ensure the dependent service (e.g., `baseball-stats-mcp`) is started *before* the service that binds to it (e.g., `sports-proxy`). Check ports and service names in `wrangler.toml` files.*

**Test Timeout / Fetch Failed:**
```
❌ ERROR: fetch failed / Test timed out
```
*Resolution: Ensure all required services (`sports-proxy`, `hockey-stats-mcp`, `baseball-stats-mcp`) are running, healthy, and accessible on the configured ports. Check for errors in service logs.*

**Entity Resolution Failures:**
```
❌ Team "xyz" not found
```
*Resolution: Check entity mappings and data sources within the respective MCP services (e.g., `baseball-stats-mcp` for MLB teams).*

### Debugging Test Failures & Manual Checks

```bash
# Run specific test suite with verbose output
DEBUG=true node test-runner.js architecture

# Test individual components/validators
node architectural-validator.js http://localhost:8081

# Quick health check for the main proxy
curl http://localhost:8081/health

# Direct health checks for MCP services
curl http://localhost:8782/health # Baseball MCP
curl http://localhost:8783/health # Hockey MCP

# Manual tool testing via sports-proxy
curl -X POST http://localhost:8081/mcp/call \
  -H "Content-Type: application/json" \
  -d \'\'\'{"name": "mlb.stats", "arguments": {"endpoint": "teams", "team_id": "147"}}\'\'\'

# View logs for services (requires wrangler to be installed and configured)
wrangler tail hockey-stats-mcp
wrangler tail baseball-stats-mcp # or mlbstats-mcp
wrangler tail sports-proxy
```

## 🔧 Development Workflow

### Adding New Tests

1.  **Identify architectural component** to test.
2.  **Add test function** to an appropriate suite in `test-runner.js` or as a specific check in `architectural-validator.js`.
3.  **Update configuration** in `test-config.json` if needed (e.g., new service paths, ports).
4.  **Add CI guard** in `ci-integration.js` if the test is critical for deployment.
5.  **Update this documentation** (`README-testing.md`) with new test coverage or examples.

### Test-Driven Architecture

1.  **Define architectural requirement** (e.g., "service bindings must be <50ms").
2.  **Write failing test** that validates the requirement.
3.  **Implement architecture** to make the test pass.
4.  **Add CI guard** to prevent regression.

## 🎯 Testing Philosophy

This test suite follows the **Architecture-First Testing** philosophy:

1.  **Test architectural patterns, not implementation details.**
2.  **Focus on integration points and communication boundaries.**  
3.  **Validate performance characteristics under realistic conditions.**
4.  **Ensure production readiness through comprehensive validation.**
5.  **Prevent architectural regression through CI guards.**

The goal is to ensure that the Sports Platform v3.2 implementation matches the documented architecture and performs optimally in production environments.

## 📚 Related Documentation

Primarily from `tests/README.md` (v3.2), with relevant additions from `TESTING.MD` (v3):

- [`/docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) - Complete architectural specification
- [`/docs/V3.2-MIGRATION-GUIDE.md`](../docs/V3.2-MIGRATION-GUIDE.md) - v3.2 feature migration
- [`/docs/FRONTEND-UX-BRIEF.md`](../docs/FRONTEND-UX-BRIEF.md) - Frontend integration guide
- [OpenAI Responses API Specification](https://platform.openai.com/docs/api-reference/responses) (If still the target)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Service Bindings Guide](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [`/workers/sports-proxy/test-yahoo-token-refresh.js`](../workers/sports-proxy/test-yahoo-token-refresh.js) - OAuth testing (example)

---

*Sports Platform v3.2 Testing Suite - Ensuring architectural excellence and production readiness*
