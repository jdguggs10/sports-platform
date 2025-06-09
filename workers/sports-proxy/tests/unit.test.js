#!/usr/bin/env node

/**
 * Unit Tests for Sports Proxy Components
 * Tests individual components and utilities in isolation
 */

const { ResponsesAPIOrchestrator } = require('../src/mcp/orchestrator');
const { CacheManager } = require('../src/cache/manager');
const { transformMLBTeam } = require('../src/schemas/sports');
const { createMockEnv, TEST_CONFIG, TEST_DATA, helpers } = require('./test-utils');

class UnitTestSuite {
  constructor() {
    this.results = [];
    this.mockEnv = createMockEnv();
  }

  async runAll() {
    console.log('🧪 Running Sports Proxy Unit Tests\n');
    
    try {
      await this.testOrchestrator();
      await this.testCacheManager();
      await this.testSchemaTransforms();
      await this.testHealthChecks();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Unit test suite failed:', error);
      process.exit(1);
    }
  }

  async testOrchestrator() {
    console.log('📦 Testing MCP Orchestrator...');
    
    const orchestrator = new ResponsesAPIOrchestrator(this.mockEnv);
    
    // Test tool listing
    try {
      const tools = await orchestrator.listTools();
      this.results.push(helpers.logTestResult(
        'Orchestrator tool listing', 
        tools && tools.tools && tools.tools.length > 0,
        `Found ${tools?.tools?.length || 0} tools`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Orchestrator tool listing', 
        false, 
        error.message
      ));
    }

    // Test health check
    try {
      const health = await orchestrator.healthCheck();
      this.results.push(helpers.logTestResult(
        'Orchestrator health check', 
        health && typeof health === 'object',
        JSON.stringify(health)
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Orchestrator health check', 
        false, 
        error.message
      ));
    }
  }

  async testCacheManager() {
    console.log('\n🗃️  Testing Cache Manager...');
    
    const cache = new CacheManager(this.mockEnv);
    
    // Test cache key generation
    try {
      const key = cache._generateKey('get_team_info', { teamId: '147' });
      this.results.push(helpers.logTestResult(
        'Cache key generation', 
        typeof key === 'string' && key.length > 0,
        `Generated: ${key}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Cache key generation', 
        false, 
        error.message
      ));
    }

    // Test TTL calculation
    try {
      const ttl = cache.getSmartTTL('get_live_game', {});
      this.results.push(helpers.logTestResult(
        'Smart TTL calculation', 
        typeof ttl === 'number' && ttl > 0,
        `TTL: ${ttl}s`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Smart TTL calculation', 
        false, 
        error.message
      ));
    }
  }

  async testSchemaTransforms() {
    console.log('\n🔄 Testing Schema Transformations...');
    
    // Test MLB team transformation
    try {
      const mockTeam = {
        id: 147,
        name: "New York Yankees",
        abbreviation: "NYY",
        venue: { name: "Yankee Stadium" }
      };
      
      const transformed = transformMLBTeam(mockTeam);
      this.results.push(helpers.logTestResult(
        'MLB team transformation', 
        transformed && transformed.id === mockTeam.id.toString(),
        `Transformed team: ${transformed?.name}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'MLB team transformation', 
        false, 
        error.message
      ));
    }
  }

  async testHealthChecks() {
    console.log('\n🏥 Testing Health Check Components...');
    
    // Test basic health endpoint simulation
    try {
      const orchestrator = new ResponsesAPIOrchestrator(this.mockEnv);
      const healthData = await orchestrator.healthCheck();
      
      this.results.push(helpers.logTestResult(
        'Basic health check', 
        healthData !== null,
        `Status: ${JSON.stringify(healthData)}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Basic health check', 
        false, 
        error.message
      ));
    }
  }

  printResults() {
    const passed = this.results.filter(Boolean).length;
    const total = this.results.length;
    
    console.log(`\n📊 Unit Test Results: ${passed}/${total} passed`);
    
    if (passed === total) {
      console.log('✅ All unit tests passed!');
    } else {
      console.log('❌ Some unit tests failed');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new UnitTestSuite();
  suite.runAll().catch(error => {
    console.error('Unit test suite error:', error);
    process.exit(1);
  });
}

module.exports = UnitTestSuite;
