#!/usr/bin/env node

/**
 * Unified Test Runner for Sports Proxy
 * Consolidates all test types into a single entry point
 */

const UnitTestSuite = require('./unit.test');
const IntegrationTestSuite = require('./integration.test');
const E2ETestSuite = require('./e2e.test');

class SportsProxyTestRunner {
  constructor() {
    this.suites = {
      unit: new UnitTestSuite(),
      integration: new IntegrationTestSuite(),
      e2e: new E2ETestSuite()
    };
    
    this.results = {
      unit: { passed: 0, total: 0 },
      integration: { passed: 0, total: 0 },
      e2e: { passed: 0, total: 0 }
    };
  }

  async runAll() {
    console.log('🧪 Sports Proxy - Consolidated Test Suite');
    console.log('==========================================\n');
    
    const startTime = Date.now();
    
    try {
      // Run test suites in sequence
      await this.runSuite('unit');
      await this.runSuite('integration');
      await this.runSuite('e2e');
      
      this.printFinalResults(startTime);
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  async runSuite(suiteName) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Running ${suiteName.toUpperCase()} tests`);
    console.log(`${'='.repeat(50)}`);
    
    try {
      await this.suites[suiteName].runAll();
      // Extract results if the suite provides them
      if (this.suites[suiteName].results) {
        const results = this.suites[suiteName].results;
        this.results[suiteName].passed = results.filter(Boolean).length;
        this.results[suiteName].total = results.length;
      }
    } catch (error) {
      console.error(`❌ ${suiteName} suite failed:`, error.message);
      // Don't exit here, continue with other suites
    }
  }

  async runSpecific(suiteNames) {
    console.log('🧪 Sports Proxy - Specific Test Suites');
    console.log('======================================\n');
    
    const startTime = Date.now();
    
    for (const suiteName of suiteNames) {
      if (this.suites[suiteName]) {
        await this.runSuite(suiteName);
      } else {
        console.log(`⚠️  Unknown test suite: ${suiteName}`);
      }
    }
    
    this.printFinalResults(startTime);
  }

  printFinalResults(startTime) {
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    
    let totalPassed = 0;
    let totalTests = 0;
    
    Object.entries(this.results).forEach(([suite, result]) => {
      if (result.total > 0) {
        const status = result.passed === result.total ? '✅' : '❌';
        console.log(`${status} ${suite.toUpperCase()}: ${result.passed}/${result.total} passed`);
        totalPassed += result.passed;
        totalTests += result.total;
      }
    });
    
    console.log('-'.repeat(60));
    console.log(`🎯 OVERALL: ${totalPassed}/${totalTests} tests passed`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    
    if (totalPassed === totalTests && totalTests > 0) {
      console.log('🎉 All tests passed successfully!');
    } else {
      console.log('💥 Some tests failed');
      process.exit(1);
    }
  }

  static printUsage() {
    console.log('Usage: npm test [suite...]');
    console.log('');
    console.log('Available test suites:');
    console.log('  unit        - Unit tests for individual components');
    console.log('  integration - Integration tests for API workflows');
    console.log('  e2e         - End-to-end tests with real services');
    console.log('');
    console.log('Examples:');
    console.log('  npm test              # Run all test suites');
    console.log('  npm test unit         # Run only unit tests');
    console.log('  npm test unit e2e     # Run unit and e2e tests');
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    SportsProxyTestRunner.printUsage();
    process.exit(0);
  }
  
  const runner = new SportsProxyTestRunner();
  
  if (args.length === 0) {
    // Run all tests
    runner.runAll();
  } else {
    // Run specific suites
    runner.runSpecific(args);
  }
}

module.exports = SportsProxyTestRunner;
