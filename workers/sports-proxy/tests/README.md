# Sports Proxy Testing Suite

This directory contains the consolidated testing suite for the Sports Proxy worker, organized into focused test categories with shared utilities.

## Test Structure

### 📁 Consolidated Organization

```
tests/
├── test-utils.js          # Shared utilities, mocks, and configurations
├── unit.test.js           # Unit tests for individual components
├── integration.test.js    # Integration tests for API workflows
├── e2e.test.js           # End-to-end tests with real services
└── test-runner.js        # Unified test runner
```

### 🧪 Test Categories

#### Unit Tests (`unit.test.js`)
- **Purpose**: Test individual components in isolation
- **Coverage**: Orchestrator, Cache Manager, Schema Transforms, Health Checks
- **Duration**: Fast (~1-2 seconds)
- **Dependencies**: None (uses mocks)

#### Integration Tests (`integration.test.js`)  
- **Purpose**: Test complete workflows and API integrations
- **Coverage**: Responses API, Complete flows, Hybrid approaches, State management
- **Duration**: Medium (~5-10 seconds)
- **Dependencies**: Local worker running

#### End-to-End Tests (`e2e.test.js`)
- **Purpose**: Test real-world scenarios with external services
- **Coverage**: Worker deployment, Health endpoints, OpenAI integration, MCP support
- **Duration**: Slow (~10-30 seconds)
- **Dependencies**: OpenAI API key, deployed worker

## Usage

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only  
npm run test:e2e           # E2E tests only
```

### Run Multiple Suites
```bash
npm test unit integration  # Unit and integration tests
npm test unit e2e          # Unit and E2E tests
```

### Environment Setup

#### For Integration & E2E Tests
```bash
# Start local worker (required for integration/e2e tests)
npm run dev

# Set OpenAI API key (required for e2e tests)
export OPENAI_API_KEY="your-key-here"
```

#### Test Configuration
The test suite uses these default configurations:
- **Worker URL**: `http://localhost:8787`
- **API Key**: `sp_test_key` 
- **Timeouts**: 10s default, 30s for long operations

## Key Improvements

### ✅ Before vs After Consolidation

| **Before** | **After** |
|------------|-----------|
| 5 separate test files (832 lines) | 4 organized files + shared utils |
| Duplicated mock environments | Single shared mock factory |
| Repeated orchestrator setup | Centralized test utilities |
| Inconsistent test patterns | Standardized test structure |
| No unified test runner | Integrated test runner with results |
| Manual test execution | npm script integration |

### 🔄 Migration Benefits

1. **Reduced Duplication**: ~60% reduction in duplicated code
2. **Better Organization**: Clear separation of unit/integration/e2e concerns
3. **Shared Utilities**: Common mocks, helpers, and configurations
4. **Easier Maintenance**: Single place to update test infrastructure
5. **Better CI/CD**: Unified test runner for automated testing

### 🚀 Shared Utilities (`test-utils.js`)

- **Mock Environment Factory**: `createMockEnv(overrides)`
- **Test Data**: Predefined teams, players, and request templates
- **Helper Functions**: Common request patterns, validation, logging
- **Configuration**: Centralized timeouts, URLs, and settings

### 📊 Test Results

The test runner provides comprehensive results:
```
📊 FINAL TEST RESULTS
====================================
✅ UNIT: 8/8 passed
✅ INTEGRATION: 5/5 passed  
✅ E2E: 6/6 passed
─────────────────────────
🎯 OVERALL: 19/19 tests passed
⏱️  Duration: 12.34s
🎉 All tests passed successfully!
```

## Legacy Test Files

The following files have been consolidated and can be removed:
- `test-responses-api.js` → Merged into `integration.test.js`
- `test-responses-api-complete.js` → Merged into `integration.test.js` 
- `test-hybrid-enhanced.js` → Merged into `integration.test.js`
- `test-local.js` → Merged into `unit.test.js`
- `test-openai-mcp.js` → Merged into `e2e.test.js`

## Next Steps

1. **Remove Legacy Files**: Delete the 5 original test files after verification
2. **CI Integration**: Add test runner to deployment pipeline
3. **Test Coverage**: Add coverage reporting tools
4. **Performance Benchmarks**: Add performance regression testing
5. **Watch Mode**: Implement file watching for development
