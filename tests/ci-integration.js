/**
 * CI Integration Tests - Sports Platform v3.2
 * 
 * Continuous Integration validation suite that can be run in CI/CD pipelines.
 * Focuses on deployment blockers and production readiness validation.
 */

const { SportsTestRunner } = require('./test-runner');
const { ArchitecturalValidator } = require('./architectural-validator');

class CIIntegration {
  constructor() {
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8081';
    this.environment = process.env.NODE_ENV || 'test';
    this.ciGuards = [];
    this.results = {
      guards: [],
      tests: [],
      architecture: [],
      overall: 'unknown'
    };
  }

  async run() {
    console.log('🤖 Sports Platform v3.2 CI Integration Running...');
    console.log(`   Environment: ${this.environment}`);
    console.log(`   Base URL: ${this.baseUrl}\n`);

    try {
      // Phase 1: CI Guards (deployment blockers)
      await this.runCIGuards();

      // Phase 2: Core test suite
      await this.runTestSuite();

      // Phase 3: Architectural validation
      await this.runArchitecturalValidation();

      // Phase 4: Generate CI report
      this.generateCIReport();

      // Phase 5: Determine CI result
      const ciPassed = this.determineCIResult();
      
      process.exit(ciPassed ? 0 : 1);

    } catch (error) {
      console.error('❌ CI Integration failed:', error.message);
      process.exit(1);
    }
  }

  async runCIGuards() {
    console.log('🛡️  Running CI Guards (Deployment Blockers)...\n');

    // CI Guard #1: Service Health
    await this.runGuard(
      'service-health',
      'All required services must be healthy',
      async () => {
        const services = [
          { name: 'sports-proxy', port: 8081 },
          { name: 'hockey-stats-mcp', port: 8783 },
          { name: 'baseball-stats-mcp', port: 8782 }
        ];

        const healthResults = {};
        for (const service of services) {
          try {
            const response = await fetch(`http://localhost:${service.port}/health`, {
              signal: AbortSignal.timeout(5000)
            });
            healthResults[service.name] = response.ok;
          } catch (error) {
            healthResults[service.name] = false;
          }
        }

        const allHealthy = Object.values(healthResults).every(Boolean);
        if (!allHealthy) {
          throw new Error(`Unhealthy services: ${JSON.stringify(healthResults)}`);
        }

        return healthResults;
      }
    );

    // CI Guard #2: Tool Count Constraint (≤3 tools)
    await this.runGuard(
      'tool-count-constraint',
      'Sport tools must be ≤3 for optimal LLM performance',
      async () => {
        const response = await fetch(`${this.baseUrl}/mcp/tools`);
        const tools = await response.json();
        
        const sportTools = tools.filter(tool => tool.name.includes('.'));
        
        if (sportTools.length > 3) {
          throw new Error(`Too many sport tools: ${sportTools.length} (limit: 3). Tools: ${sportTools.map(t => t.name).join(', ')}`);
        }

        return { toolCount: sportTools.length, tools: sportTools.map(t => t.name) };
      }
    );

    // CI Guard #3: OpenAI Responses API Compliance
    await this.runGuard(
      'responses-api-compliance',
      'Must use OpenAI Responses API, not deprecated Chat Completions',
      async () => {
        const response = await fetch(`${this.baseUrl}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4.1',
            input: 'CI Guard test',
            userId: 'ci-guard'
          })
        });

        if (!response.ok) {
          throw new Error(`Responses API endpoint failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.id || result.object !== 'response') {
          throw new Error('Response format not compliant with Responses API spec');
        }

        return { compliant: true, format: result.object };
      }
    );

    // CI Guard #4: v3.2 League ID Requirement
    await this.runGuard(
      'league-id-requirement',
      'Fantasy tools must require league_id parameter (v3.2)',
      async () => {
        const response = await fetch(`${this.baseUrl}/mcp/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'mlb.fantasy',
            arguments: {
              provider: 'espn',
              endpoint: 'team_roster'
              // Missing league_id - should fail
            }
          })
        });

        const result = await response.json();
        if (!result.error || !result.error.includes('league_id')) {
          throw new Error('league_id requirement not enforced');
        }

        return { enforced: true, requirement: 'league_id' };
      }
    );

    // CI Guard #5: Service Binding Performance
    await this.runGuard(
      'service-binding-performance',
      'Service binding calls must be <100ms',
      async () => {
        const startTime = performance.now();
        
        const response = await fetch(`${this.baseUrl}/mcp/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'mlb.stats',
            arguments: { endpoint: 'teams', team_id: '147' }
          })
        });

        const latency = performance.now() - startTime;

        if (!response.ok) {
          throw new Error(`Service binding call failed: ${response.status}`);
        }

        if (latency > 100) {
          throw new Error(`Service binding latency too high: ${Math.round(latency)}ms (limit: 100ms)`);
        }

        return { latency: Math.round(latency), threshold: 100 };
      }
    );

    // CI Guard #6: Memory Leak Detection
    await this.runGuard(
      'memory-leak-detection',
      'Memory usage must remain stable during operation',
      async () => {
        const initialMemory = process.memoryUsage().heapUsed;

        // Run multiple requests to detect memory leaks
        for (let i = 0; i < 10; i++) {
          await fetch(`${this.baseUrl}/mcp/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'hockey.stats',
              arguments: { endpoint: 'teams', team_id: '6' }
            })
          });
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = finalMemory - initialMemory;

        // Allow up to 5MB growth for reasonable operations
        if (memoryGrowth > 5 * 1024 * 1024) {
          throw new Error(`Excessive memory growth detected: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);
        }

        return { 
          memoryGrowth: Math.round(memoryGrowth / 1024) + 'KB',
          acceptable: memoryGrowth < 5 * 1024 * 1024
        };
      }
    );

    const guardsPassed = this.results.guards.filter(g => g.passed).length;
    const guardsTotal = this.results.guards.length;

    console.log(`\n🛡️  CI Guards: ${guardsPassed}/${guardsTotal} passed\n`);

    if (guardsPassed < guardsTotal) {
      console.log('❌ CI Guards failed - deployment blocked!');
      const failedGuards = this.results.guards.filter(g => !g.passed);
      failedGuards.forEach(guard => {
        console.log(`   ❌ ${guard.name}: ${guard.error}`);
      });
      throw new Error('CI Guards failed - cannot proceed with deployment');
    }
  }

  async runGuard(name, description, guardFn) {
    const startTime = performance.now();
    
    try {
      const result = await guardFn();
      const duration = Math.round(performance.now() - startTime);
      
      console.log(`✅ CI Guard: ${name} (${duration}ms)`);
      console.log(`   ${description}`);
      if (result && typeof result === 'object') {
        console.log(`   Result: ${JSON.stringify(result)}`);
      }
      console.log();

      this.results.guards.push({
        name,
        description,
        passed: true,
        duration,
        result
      });

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      console.log(`❌ CI Guard: ${name} (${duration}ms)`);
      console.log(`   ${description}`);
      console.log(`   Error: ${error.message}`);
      console.log();

      this.results.guards.push({
        name,
        description,
        passed: false,
        duration,
        error: error.message
      });
    }
  }

  async runTestSuite() {
    console.log('🧪 Running Core Test Suite...\n');

    try {
      // Run critical test suites only in CI
      const criticalSuites = 'architecture,service-bindings,api-integration';
      
      const runner = new SportsTestRunner();
      // Mock the service startup since CI assumes services are already running
      runner.startServices = async () => {
        console.log('   ⏩ Skipping service startup (CI mode)');
      };
      runner.stopServices = async () => {
        console.log('   ⏩ Skipping service shutdown (CI mode)');
      };

      await runner.run(criticalSuites);
      
      this.results.tests.push({
        suite: 'critical',
        passed: true,
        suites: criticalSuites.split(',')
      });

    } catch (error) {
      console.log(`❌ Test suite failed: ${error.message}`);
      this.results.tests.push({
        suite: 'critical',
        passed: false,
        error: error.message
      });
    }
  }

  async runArchitecturalValidation() {
    console.log('🏗️  Running Architectural Validation...\n');

    try {
      const validator = new ArchitecturalValidator(this.baseUrl);
      await validator.validate();
      
      const passed = validator.violations.length === 0;
      
      this.results.architecture.push({
        validations: validator.validations.length,
        violations: validator.violations.length,
        passed
      });

    } catch (error) {
      console.log(`❌ Architectural validation failed: ${error.message}`);
      this.results.architecture.push({
        passed: false,
        error: error.message
      });
    }
  }

  generateCIReport() {
    console.log('\n🤖 CI Integration Report');
    console.log('═'.repeat(50));

    // Guards summary
    const guardsPassed = this.results.guards.filter(g => g.passed).length;
    const guardsTotal = this.results.guards.length;
    console.log(`🛡️  CI Guards: ${guardsPassed}/${guardsTotal} passed`);

    // Tests summary
    const testsPassed = this.results.tests.filter(t => t.passed).length;
    const testsTotal = this.results.tests.length;
    console.log(`🧪 Test Suites: ${testsPassed}/${testsTotal} passed`);

    // Architecture summary
    const archPassed = this.results.architecture.filter(a => a.passed).length;
    const archTotal = this.results.architecture.length;
    console.log(`🏗️  Architecture: ${archPassed}/${archTotal} passed`);

    console.log();

    // Overall status
    const allPassed = guardsPassed === guardsTotal && 
                     testsPassed === testsTotal && 
                     archPassed === archTotal;

    if (allPassed) {
      console.log('✅ CI Integration: ALL CHECKS PASSED');
      console.log();
      console.log('🚀 Deployment Status: APPROVED');
      console.log('   ✅ All CI guards passed');
      console.log('   ✅ Critical tests passed');
      console.log('   ✅ Architecture validated');
      console.log('   ✅ Production ready!');
      
      this.results.overall = 'passed';
    } else {
      console.log('❌ CI Integration: CHECKS FAILED');
      console.log();
      console.log('🚫 Deployment Status: BLOCKED');
      
      if (guardsPassed < guardsTotal) {
        console.log('   ❌ CI guards failed - fix deployment blockers');
      }
      if (testsPassed < testsTotal) {
        console.log('   ❌ Critical tests failed - fix functionality issues');
      }
      if (archPassed < archTotal) {
        console.log('   ❌ Architecture validation failed - fix design violations');
      }

      this.results.overall = 'failed';
    }
  }

  determineCIResult() {
    return this.results.overall === 'passed';
  }

  // Static method for quick CI checks
  static async quickCheck(baseUrl = 'http://localhost:8081') {
    console.log('⚡ Quick CI Check...\n');

    try {
      // Quick health check
      const healthResponse = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      // Quick tool count check
      const toolsResponse = await fetch(`${baseUrl}/mcp/tools`);
      const tools = await toolsResponse.json();
      const sportTools = tools.filter(tool => tool.name.includes('.'));

      if (sportTools.length > 3) {
        throw new Error(`Too many sport tools: ${sportTools.length}`);
      }

      console.log('✅ Quick CI Check passed');
      console.log(`   Health: OK`);
      console.log(`   Tools: ${sportTools.length}/3`);
      
      return true;

    } catch (error) {
      console.log('❌ Quick CI Check failed:', error.message);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8081';
    const passed = await CIIntegration.quickCheck(baseUrl);
    process.exit(passed ? 0 : 1);
  } else {
    const ci = new CIIntegration();
    await ci.run();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ CI Integration crashed:', error);
    process.exit(1);
  });
}

module.exports = { CIIntegration };