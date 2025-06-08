# Sports Platform v3.2 Testing Suite

Comprehensive testing infrastructure for validating architectural connections, performance, and production readiness.

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

Ensure all services are running:

```bash
# Terminal 1: Sports Proxy
cd workers/sports-proxy
npm run dev  # Port 8081

# Terminal 2: Hockey Stats MCP
cd workers/hockey-stats-mcp  
npm run dev  # Port 8783

# Terminal 3: Baseball Stats MCP
cd workers/mlbstats-mcp
npm run dev  # Port 8782
```

### Run All Tests

```bash
# From project root
cd tests

# Run complete test suite
node test-runner.js

# Run specific test suites
node test-runner.js architecture,performance

# Run CI integration (deployment validation)
node ci-integration.js

# Quick health check
node ci-integration.js --quick

# Architectural deep dive
node architectural-validator.js
```

## 📋 Test Suite Components

### 1. Unified Test Runner (`test-runner.js`)

**Comprehensive orchestration of all testing activities**

```bash
node test-runner.js [suites]
```

**Available Test Suites:**
- `architecture` - Core architectural patterns and compliance
- `service-bindings` - Zero-latency worker communication  
- `api-integration` - External API integration and data flow
- `fantasy-providers` - Multi-provider fantasy support (ESPN/Yahoo)
- `performance` - Performance benchmarks and resource usage
- `reliability` - Error handling and graceful degradation

**Features:**
- ✅ Automated service orchestration (startup/shutdown)
- ✅ Parallel service startup, sequential test execution
- ✅ Comprehensive performance metrics
- ✅ Detailed reporting with pass/fail breakdown
- ✅ Configurable timeouts and thresholds

### 2. Architectural Validator (`architectural-validator.js`)

**Deep validation of architectural compliance**

```bash
node architectural-validator.js [baseUrl]
```

**Validation Areas:**
- **OpenAI Responses API**: Format compliance, streaming, conversation context
- **Service Bindings**: Performance, error handling, routing
- **Meta-Tool Façades**: Tool count constraints (≤3), endpoint multiplexing
- **v3.2 Multi-League**: league_id requirements, provider support
- **Security Patterns**: Input validation, sensitive data exposure
- **Error Handling**: Graceful degradation, recovery guidance

### 3. CI Integration (`ci-integration.js`)

**Continuous integration and deployment validation**

```bash
node ci-integration.js
```

**CI Guards (Deployment Blockers):**
1. **Service Health** - All required services operational
2. **Tool Count Constraint** - ≤3 sport tools for LLM performance
3. **Responses API Compliance** - No deprecated Chat Completions usage
4. **League ID Requirement** - v3.2 fantasy tools enforce league_id
5. **Service Binding Performance** - <100ms latency requirement
6. **Memory Leak Detection** - Stable memory usage during operation

## ⚙️ Configuration

### Test Configuration (`test-config.json`)

```json
{
  "services": {
    "sports-proxy": { "port": 8081, "path": "../workers/sports-proxy" },
    "hockey-stats-mcp": { "port": 8783, "path": "../workers/hockey-stats-mcp" },
    "baseball-stats-mcp": { "port": 8782, "path": "../workers/mlbstats-mcp" }
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
```

## 🎯 Test Architecture Focus

### Service Binding Validation

Tests the zero-latency worker-to-worker communication architecture:

```javascript
// Validates <100ms service binding performance
const response = await fetch(`${baseUrl}/mcp/call`, {
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
const response = await fetch(`${baseUrl}/responses`, {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4.1',
    input: 'Test message',
    stream: true
  })
});
```

### Meta-Tool Façade Pattern

Validates the ≤3 tool constraint for optimal LLM performance:

```javascript
// Ensures tool count stays within limits
const tools = await fetch(`${baseUrl}/mcp/tools`).then(r => r.json());
const sportTools = tools.filter(t => t.name.includes('.'));
assert(sportTools.length <= 3, 'Too many sport tools');
```

### v3.2 Multi-League Features

Tests league_id parameter enforcement and provider support:

```javascript
// Validates league_id requirement
const response = await fetch(`${baseUrl}/mcp/call`, {
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

| Component | Target | Measurement |
|-----------|--------|-------------|
| Health Check | <10ms | Response time |
| Service Binding | <100ms | Worker-to-worker latency |
| Tool Call | <500ms | End-to-end tool execution |
| Responses API | <2s | Full request processing |
| Concurrent Requests | <1s avg | Average response time |

### Memory Usage

- **Baseline**: ~50MB heap usage
- **Growth Limit**: <5MB per 10 requests
- **Leak Detection**: Monitors heap growth over multiple requests

## 🛡️ Production Readiness

### CI Guards

The test suite includes deployment blockers that prevent problematic code from reaching production:

1. **Architecture Compliance** - Prevents regression to deprecated patterns
2. **Performance Degradation** - Blocks slow service binding implementations  
3. **Tool Explosion** - Prevents >3 tool deployments that hurt LLM performance
4. **Feature Regression** - Ensures v3.2 league features work correctly
5. **Memory Leaks** - Detects resource management issues
6. **Error Handling** - Validates graceful failure modes

### Integration with CI/CD

```yaml
# Example GitHub Actions integration
- name: Run Sports Platform Tests
  run: |
    # Start services
    ./start-dev-servers.sh
    
    # Wait for readiness
    sleep 10
    
    # Run CI validation
    cd tests && node ci-integration.js
    
    # Architectural deep dive
    node architectural-validator.js
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

### Failure Analysis

Common failure patterns and resolutions:

**Service Binding Failures:**
```
❌ service-binding-latency: Service binding calls must be <100ms
   Data: {"latency": 150, "threshold": 100}
```
*Resolution: Check wrangler.toml service bindings configuration*

**Tool Count Violations:**
```
❌ tool-count-constraint: Must maintain ≤3 sport tools
   Data: {"toolCount": 5, "tools": ["mlb.stats", "mlb.fantasy", "hockey.stats", "hockey.fantasy", "nfl.stats"]}
```
*Resolution: Consolidate tools or remove excess sport implementations*

**API Compliance Issues:**
```
❌ responses-api-compliance: Response format not compliant with Responses API spec
   Data: {"format": "chat.completion", "hasId": false}
```
*Resolution: Update to use OpenAI Responses API instead of Chat Completions*

## 🔧 Development Workflow

### Adding New Tests

1. **Identify architectural component** to test
2. **Add test function** to appropriate suite in `test-runner.js`
3. **Update configuration** in `test-config.json` if needed
4. **Add CI guard** in `ci-integration.js` if deployment critical
5. **Update documentation** with new test coverage

### Test-Driven Architecture

1. **Define architectural requirement** (e.g., "service bindings must be <50ms")
2. **Write failing test** that validates the requirement
3. **Implement architecture** to make test pass
4. **Add CI guard** to prevent regression

### Debugging Test Failures

```bash
# Run specific test suite with verbose output
DEBUG=true node test-runner.js architecture

# Test individual components
node architectural-validator.js http://localhost:8081

# Quick health check
curl http://localhost:8081/health

# Manual tool testing
curl -X POST http://localhost:8081/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"name": "mlb.stats", "arguments": {"endpoint": "teams", "team_id": "147"}}'
```

## 🎯 Testing Philosophy

This test suite follows the **Architecture-First Testing** philosophy:

1. **Test architectural patterns, not implementation details**
2. **Focus on integration points and communication boundaries**  
3. **Validate performance characteristics under realistic conditions**
4. **Ensure production readiness through comprehensive validation**
5. **Prevent architectural regression through CI guards**

The goal is to ensure that the Sports Platform v3.2 implementation matches the documented architecture and performs optimally in production environments.

## 📚 Related Documentation

- [`/docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) - Complete architectural specification
- [`/docs/V3.2-MIGRATION-GUIDE.md`](../docs/V3.2-MIGRATION-GUIDE.md) - v3.2 feature migration
- [`/docs/FRONTEND-UX-BRIEF.md`](../docs/FRONTEND-UX-BRIEF.md) - Frontend integration guide
- [`/workers/sports-proxy/test-yahoo-token-refresh.js`](../workers/sports-proxy/test-yahoo-token-refresh.js) - OAuth testing

---

*Sports Platform v3.2 Testing Suite - Ensuring architectural excellence and production readiness*