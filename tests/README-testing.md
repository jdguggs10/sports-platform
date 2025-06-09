# Sports Platform Testing Guide (v3.2)

Comprehensive testing for Sports Platform v3.2, focusing on architectural validation, performance, and production readiness.

## 🎯 Overview

This suite validates that the v3.2 implementation aligns with its documented architecture and performs optimally.
Key areas: Architectural Compliance, Performance, Connection Testing, v3.2 Features, and Production Readiness.

## 🚀 Quick Start

### Prerequisites

Ensure services are running:
- Sports Proxy: `cd workers/sports-proxy && npm run dev` (Port 8081)
- Hockey Stats MCP: `cd workers/hockey-stats-mcp && npm run dev` (Port 8783)
- Baseball Stats MCP: `cd workers/baseball-stats-mcp && npm run dev` (Port 8782)
  (Verify `baseball-stats-mcp` path; may be `mlbstats-mcp`)

### Run Tests

From `tests/` directory:
- Full suite: `node test-runner.js`
- Specific suites: `node test-runner.js architecture,performance`
- CI validation: `node ci-integration.js`
- Architectural deep dive: `node architectural-validator.js`

## 📋 Test Suite Components

### 1. Unified Test Runner (`test-runner.js`)

Orchestrates all tests. Usage: `node test-runner.js [suites]`
Available suites: `architecture`, `service-bindings`, `api-integration`, `fantasy-providers`, `performance`, `reliability`.
Features: Service orchestration, performance metrics, detailed reporting.

*Example: `api-integration` suite validates MLB/Hockey data retrieval (e.g., "Tell me about the Yankees").*

### 2. Architectural Validator (`architectural-validator.js`)

Deep validation of architectural compliance. Usage: `node architectural-validator.js [baseUrl]`
Validates: OpenAI Responses API (format, streaming, context), Service Bindings, Meta-Tool Façades (≤3 tools), v3.2 Multi-League (`league_id`), Security, Error Handling.

*Example: Validates OpenAI conversation memory (e.g., "Do you remember my name?") and SSE streaming.*

### 3. CI Integration (`ci-integration.js`)

Continuous integration and deployment validation. Usage: `node ci-integration.js`
CI Guards (Deployment Blockers):
1. Service Health
2. Tool Count Constraint (≤3 sport tools)
3. Responses API Compliance
4. `league_id` Requirement (v3.2 fantasy)
5. Service Binding Performance (<100ms)
6. Memory Leak Detection

## ⚙️ Configuration

### Test Configuration (`test-config.json`)

Defines service ports, paths, timeouts, and performance thresholds.
Example structure:
```json
{
  "services": { "...": { "port": 8081, "path": "..." } },
  "timeouts": { "service_startup": 15000, "..." },
  "performance_thresholds": { "health_check": 10, "..." }
}
```

### Environment Variables

- `TEST_BASE_URL=http://localhost:8081`
- `NODE_ENV=test`
- `LOG_LEVEL=error`

## 🎯 Test Architecture Focus

- **Service Binding Validation**: Tests worker-to-worker communication (e.g., `<100ms` for `mcp/call`).
- **OpenAI Responses API Compliance**: Ensures modern API usage (streaming, no deprecated Chat Completions).
- **Meta-Tool Façade Pattern**: Validates ≤3 tool constraint (e.g., `mcp/tools` check).
- **v3.2 Multi-League Features**: Tests `league_id` enforcement (e.g., in `mlb.fantasy` calls).

## 📊 Performance Benchmarks

### Target Metrics

| Component       | Target | Measurement |
|-----------------|--------|-------------|
| Health Check    | <10ms  | Response time |
| Service Binding | <100ms | Latency     |
| Tool Call       | <500ms | Execution   |
| Responses API   | <2s    | Processing  |

### Memory Usage

Monitors heap usage, aiming for baseline ~50MB and growth <5MB per 10 requests.

## 🛡️ Production Readiness

### CI Guards

Deployment blockers prevent issues in production (e.g., architecture compliance, performance degradation, tool count).

### Integration with CI/CD

Example: GitHub Actions runs `./start-dev-servers.sh`, then `node ci-integration.js` and `node architectural-validator.js`.

## 📈 Interpreting Results

### Success Indicators

Look for messages like: "🎉 All architectural connection tests passed!" and "🚀 Sports Platform v3.2 is production ready!"

### Failure Analysis & Troubleshooting

- **Service Binding Failures** (`<100ms` exceeded): Check `wrangler.toml` and service health.
- **Tool Count Violations** (>3 sport tools): Consolidate tools.
- **API Compliance Issues**: Update to OpenAI Responses API.
- **Services Not Connected**: Ensure dependent services start first.
- **Test Timeout / Fetch Failed**: Verify all services are running and healthy.
- **Entity Resolution Failures**: Check MCP data mappings.

**Debugging Commands:**
- Verbose test run: `DEBUG=true node test-runner.js architecture`
- Health checks: `curl http://localhost:8081/health` (proxy), `curl http://localhost:8782/health` (baseball), `curl http://localhost:8783/health` (hockey)
- Manual tool test: `curl -X POST http://localhost:8081/mcp/call -H "Content-Type: application/json" -d \'\'\'{"name": "mlb.stats", ...}\'\'\'`
- Logs: `wrangler tail <service-name>`

## 🔧 Development Workflow

### Adding New Tests

1. Identify component. 2. Add test to `test-runner.js` or `architectural-validator.js`. 3. Update `test-config.json` if needed. 4. Add CI guard in `ci-integration.js` if critical. 5. Update this document.

### Test-Driven Architecture

1. Define requirement. 2. Write failing test. 3. Implement to pass. 4. Add CI guard.

## 🎯 Testing Philosophy

**Architecture-First Testing**:
1. Test patterns, not details.
2. Focus on integrations.
3. Validate performance realistically.
4. Ensure production readiness.
5. Prevent regression via CI guards.

Goal: Ensure v3.2 matches architecture and performs optimally.

## 📚 Related Documentation

- [`/docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- [`/docs/V3.2-MIGRATION-GUIDE.md`](../docs/V3.2-MIGRATION-GUIDE.md)
- [`/docs/FRONTEND-UX-BRIEF.md`](../docs/FRONTEND-UX-BRIEF.md)
- [OpenAI Responses API Specification](https://platform.openai.com/docs/api-reference/responses)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Service Bindings Guide](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [`/workers/sports-proxy/test-yahoo-token-refresh.js`](../workers/sports-proxy/test-yahoo-token-refresh.js) (OAuth example)

---

*Sports Platform v3.2 Testing Suite - Ensuring architectural excellence and production readiness*
