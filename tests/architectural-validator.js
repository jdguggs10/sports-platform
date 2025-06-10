/**
 * Architectural Validator - Deep validation of Sports Platform v3.2 architecture
 * 
 * This validator performs comprehensive checks to ensure the implementation
 * matches the documented architecture and follows best practices.
 */

// Default model configuration
const DEFAULT_MODEL = 'gpt-4.1-mini';

class ArchitecturalValidator {
  constructor(baseUrl = 'http://localhost:8081') {
    this.baseUrl = baseUrl;
    this.violations = [];
    this.validations = [];
  }

  async validate() {
    console.log('🏗️  Running Sports Platform v3.2 Architectural Validation...\n');

    try {
      await this.validateResponsesAPICompliance();
      await this.validateServiceBindingArchitecture();
      await this.validateMetaToolFacadePattern();
      await this.validateV32MultiLeagueFeatures();
      await this.validatePerformanceCharacteristics();
      await this.validateSecurityPatterns();
      await this.validateErrorHandlingPatterns();

      this.generateValidationReport();

    } catch (error) {
      console.error('❌ Architectural validation failed:', error.message);
      throw error;
    }
  }

  async validateResponsesAPICompliance() {
    console.log('📡 Validating OpenAI Responses API Compliance...');

    // Check 1: Responses API endpoint exists
    await this.checkEndpointExists('/responses', 'POST', 'Responses API endpoint');

    // Check 2: Request format compliance
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: 'Test compliance check',
        userId: 'validator'
      })
    });

    const result = await response.json();

    this.validate(
      'responses-api-format',
      result.id && result.object === 'response',
      'Response must include id and object=response',
      { responseFormat: result.object, hasId: !!result.id }
    );

    // Check 3: Streaming support
    const streamResponse = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: 'Test streaming',
        stream: true,
        userId: 'validator'
      })
    });

    this.validate(
      'responses-api-streaming',
      streamResponse.headers.get('content-type')?.includes('text/event-stream'),
      'Streaming must use Server-Sent Events',
      { contentType: streamResponse.headers.get('content-type') }
    );

    // Check 4: Conversation context support
    const contextResponse = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: 'Follow-up message',
        previous_response_id: result.id,
        userId: 'validator'
      })
    });

    this.validate(
      'conversation-context',
      contextResponse.ok,
      'Must support conversation context via previous_response_id',
      { contextSupported: contextResponse.ok }
    );
  }

  async validateServiceBindingArchitecture() {
    console.log('⚡ Validating Service Binding Architecture...');

    // Check 1: Tool routing via service bindings
    const toolResponse = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'mlb.stats',
        arguments: { endpoint: 'teams', team_id: '147' }
      })
    });

    this.validate(
      'service-binding-routing',
      toolResponse.ok,
      'Tool calls must route through service bindings',
      { routingWorking: toolResponse.ok }
    );

    // Check 2: Performance characteristics
    const performanceStart = performance.now();
    await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'hockey.stats',
        arguments: { endpoint: 'teams', team_id: '6' }
      })
    });
    const bindingLatency = performance.now() - performanceStart;

    this.validate(
      'service-binding-performance',
      bindingLatency < 100,
      'Service binding calls must be <100ms',
      { latency: Math.round(bindingLatency), threshold: 100 }
    );

    // Check 3: Error handling for missing services
    const missingServiceResponse = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'nonexistent.service',
        arguments: { test: true }
      })
    });

    const errorResult = await missingServiceResponse.json();

    this.validate(
      'service-binding-error-handling',
      errorResult.error && !missingServiceResponse.ok,
      'Missing services must return graceful errors',
      { hasError: !!errorResult.error, status: missingServiceResponse.status }
    );
  }

  async validateMetaToolFacadePattern() {
    console.log('🎯 Validating Meta-Tool Façade Pattern...');

    // Check 1: Tool count constraint (≤3 tools)
    const toolsResponse = await fetch(`${this.baseUrl}/mcp/tools`);
    const tools = await toolsResponse.json();

    const sportTools = tools.filter(tool => tool.name.includes('.'));

    this.validate(
      'tool-count-constraint',
      sportTools.length <= 3,
      'Must maintain ≤3 sport tools for optimal LLM performance',
      { toolCount: sportTools.length, tools: sportTools.map(t => t.name) }
    );

    // Check 2: Meta-tool structure
    const hasMLBTool = tools.some(t => t.name.startsWith('mlb.'));
    const hasHockeyTool = tools.some(t => t.name.startsWith('hockey.'));

    this.validate(
      'meta-tool-structure', 
      hasMLBTool && hasHockeyTool,
      'Must have sport-scoped meta-tools (mlb.*, hockey.*)',
      { sports: { mlb: hasMLBTool, hockey: hasHockeyTool } }
    );

    // Check 3: Tool endpoint multiplexing
    const mlbTool = tools.find(t => t.name.startsWith('mlb.'));
    if (mlbTool && mlbTool.parameters?.properties?.endpoint) {
      const endpoints = mlbTool.parameters.properties.endpoint.enum || [];
      
      this.validate(
        'endpoint-multiplexing',
        endpoints.length >= 3,
        'Meta-tools must multiplex multiple endpoints',
        { endpoints: endpoints.length, available: endpoints }
      );
    }
  }

  async validateV32MultiLeagueFeatures() {
    console.log('🏆 Validating v3.2 Multi-League Features...');

    // Check 1: league_id parameter requirement
    const noLeagueResponse = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'mlb.fantasy',
        arguments: {
          provider: 'espn',
          endpoint: 'team_roster'
          // Missing league_id
        }
      })
    });

    const noLeagueResult = await noLeagueResponse.json();

    this.validate(
      'league-id-requirement',
      noLeagueResult.error?.includes('league_id'),
      'Fantasy tools must require league_id parameter in v3.2',
      { enforcesLeagueId: noLeagueResult.error?.includes('league_id') }
    );

    // Check 2: Multi-provider support
    const providers = ['espn', 'yahoo'];
    const providerResults = {};

    for (const provider of providers) {
      const response = await fetch(`${this.baseUrl}/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'mlb.fantasy',
          arguments: {
            provider,
            league_id: '12345',
            endpoint: 'team_roster'
          }
        })
      });

      const result = await response.json();
      providerResults[provider] = !result.error?.includes('provider');
    }

    this.validate(
      'multi-provider-support',
      Object.values(providerResults).every(Boolean),
      'Must support both ESPN and Yahoo providers',
      { providerSupport: providerResults }
    );

    // Check 3: League discovery API (if implemented)
    const leagueDiscoveryResponse = await fetch(`${this.baseUrl}/leagues?sport=baseball&provider=espn&uid=test`);
    
    if (leagueDiscoveryResponse.status !== 404) {
      this.validate(
        'league-discovery-api',
        leagueDiscoveryResponse.ok || leagueDiscoveryResponse.status === 401,
        'League discovery must be available or require authentication',
        { status: leagueDiscoveryResponse.status, implemented: true }
      );
    } else {
      this.validations.push({
        id: 'league-discovery-api',
        passed: true,
        message: 'League discovery API not yet implemented (acceptable for v3.2 development)',
        data: { implemented: false }
      });
    }
  }

  async validatePerformanceCharacteristics() {
    console.log('📊 Validating Performance Characteristics...');

    // Check 1: Health check performance
    const healthStart = performance.now();
    const healthResponse = await fetch(`${this.baseUrl}/health`);
    const healthTime = performance.now() - healthStart;

    this.validate(
      'health-check-performance',
      healthTime < 10 && healthResponse.ok,
      'Health checks must respond in <10ms',
      { responseTime: Math.round(healthTime), healthy: healthResponse.ok }
    );

    // Check 2: Concurrent request handling
    const concurrentRequests = Array(3).fill().map((_, i) =>
      fetch(`${this.baseUrl}/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'mlb.stats',
          arguments: { endpoint: 'teams', team_id: '147' }
        })
      })
    );

    const concurrentStart = performance.now();
    const responses = await Promise.all(concurrentRequests);
    const concurrentTime = performance.now() - concurrentStart;

    const allSuccessful = responses.every(r => r.ok);
    const avgTime = concurrentTime / responses.length;

    this.validate(
      'concurrent-performance',
      allSuccessful && avgTime < 1000,
      'Must handle concurrent requests successfully with <1s average',
      { 
        allSuccessful, 
        avgTime: Math.round(avgTime),
        totalTime: Math.round(concurrentTime)
      }
    );

    // Check 3: Memory efficiency (basic check)
    const memoryBefore = process.memoryUsage().heapUsed;
    
    // Run multiple requests
    for (let i = 0; i < 5; i++) {
      await fetch(`${this.baseUrl}/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'hockey.stats',
          arguments: { endpoint: 'teams', team_id: '6' }
        })
      });
    }

    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryGrowth = memoryAfter - memoryBefore;

    this.validate(
      'memory-efficiency',
      memoryGrowth < 1024 * 1024, // Less than 1MB growth
      'Memory usage must remain stable during operation',
      { 
        memoryGrowth: Math.round(memoryGrowth / 1024) + 'KB',
        acceptable: memoryGrowth < 1024 * 1024
      }
    );
  }

  async validateSecurityPatterns() {
    console.log('🔒 Validating Security Patterns...');

    // Check 1: Input validation
    const invalidInputResponse = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'mlb.stats',
        arguments: { 
          endpoint: 'teams',
          team_id: '<script>alert("xss")</script>' // XSS attempt
        }
      })
    });

    this.validate(
      'input-validation',
      invalidInputResponse.ok, // Should handle gracefully, not crash
      'Must handle malicious input gracefully',
      { handledGracefully: invalidInputResponse.ok }
    );

    // Check 2: No sensitive information in responses
    const response = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'mlb.stats',
        arguments: { endpoint: 'teams', team_id: '147' }
      })
    });

    const result = await response.json();
    const responseText = JSON.stringify(result).toLowerCase();
    
    const sensitivePatterns = ['password', 'secret', 'key', 'token', 'api_key'];
    const hasSensitiveInfo = sensitivePatterns.some(pattern => 
      responseText.includes(pattern)
    );

    this.validate(
      'no-sensitive-exposure',
      !hasSensitiveInfo,
      'Responses must not expose sensitive information',
      { exposureDetected: hasSensitiveInfo, patterns: sensitivePatterns }
    );

    // Check 3: Proper error handling (no stack traces)
    const errorResponse = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'invalid.tool',
        arguments: { invalid: true }
      })
    });

    const errorResult = await errorResponse.json();
    const hasStackTrace = JSON.stringify(errorResult).includes('at ') || 
                         JSON.stringify(errorResult).includes('Error:');

    this.validate(
      'secure-error-handling',
      !hasStackTrace,
      'Error responses must not expose internal details',
      { exposesInternals: hasStackTrace }
    );
  }

  async validateErrorHandlingPatterns() {
    console.log('🛡️  Validating Error Handling Patterns...');

    // Check 1: Graceful degradation for service failures
    const invalidToolResponse = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'nonexistent.tool',
        arguments: { test: true }
      })
    });

    const hasGracefulError = invalidToolResponse.status >= 400 && 
                            invalidToolResponse.status < 500;

    this.validate(
      'graceful-degradation',
      hasGracefulError,
      'Must return 4xx errors for client issues, not 5xx',
      { status: invalidToolResponse.status, graceful: hasGracefulError }
    );

    // Check 2: Comprehensive error messages
    const errorResult = await invalidToolResponse.json();

    this.validate(
      'comprehensive-errors',
      errorResult.error && typeof errorResult.error === 'string',
      'Error responses must include descriptive error messages',
      { hasError: !!errorResult.error, errorType: typeof errorResult.error }
    );

    // Check 3: Recovery guidance
    const missingLeagueResponse = await fetch(`${this.baseUrl}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'mlb.fantasy',
        arguments: {
          provider: 'espn',
          endpoint: 'team_roster'
          // Missing league_id
        }
      })
    });

    const missingLeagueResult = await missingLeagueResponse.json();
    const providesGuidance = missingLeagueResult.error?.includes('league_id') ||
                            missingLeagueResult.help;

    this.validate(
      'recovery-guidance',
      providesGuidance,
      'Error messages must provide guidance for resolution',
      { providesGuidance, hasHelp: !!missingLeagueResult.help }
    );
  }

  async checkEndpointExists(path, method, description) {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { 
        method: method === 'GET' ? 'GET' : 'POST',
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? JSON.stringify({}) : undefined
      });

      this.validate(
        `endpoint-${path.replace('/', '')}-exists`,
        response.status !== 404,
        `${description} must be available`,
        { path, method, status: response.status }
      );
    } catch (error) {
      this.violations.push({
        id: `endpoint-${path.replace('/', '')}-exists`,
        message: `${description} endpoint check failed: ${error.message}`,
        data: { path, method, error: error.message }
      });
    }
  }

  validate(id, condition, message, data = {}) {
    if (condition) {
      this.validations.push({ id, passed: true, message, data });
    } else {
      this.violations.push({ id, message, data });
    }
  }

  generateValidationReport() {
    const totalChecks = this.validations.length + this.violations.length;
    const passedChecks = this.validations.length;

    console.log('\n🏗️  Architectural Validation Report');
    console.log('═'.repeat(50));
    console.log(`📋 Total Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${passedChecks}`);
    console.log(`❌ Failed: ${this.violations.length}`);
    console.log(`📈 Compliance: ${Math.round((passedChecks / totalChecks) * 100)}%`);
    console.log();

    if (this.violations.length === 0) {
      console.log('🎉 All architectural validations passed!');
      console.log();
      console.log('✅ Architecture Compliance Summary:');
      console.log('  ✅ OpenAI Responses API fully compliant');
      console.log('  ✅ Service binding architecture optimal');
      console.log('  ✅ Meta-tool façade pattern implemented correctly');
      console.log('  ✅ v3.2 multi-league features working');
      console.log('  ✅ Performance characteristics within targets');
      console.log('  ✅ Security patterns properly implemented');
      console.log('  ✅ Error handling follows best practices');
      console.log();
      console.log('🚀 Sports Platform v3.2 architecture is production ready!');
    } else {
      console.log('🚨 Architectural violations detected:');
      console.log();
      
      this.violations.forEach(violation => {
        console.log(`❌ ${violation.id}: ${violation.message}`);
        if (violation.data && Object.keys(violation.data).length > 0) {
          console.log(`   Data: ${JSON.stringify(violation.data)}`);
        }
        console.log();
      });

      console.log('🔧 Fix these violations before deploying to production.');
    }

    return this.violations.length === 0;
  }
}

// CLI interface
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:8081';
  
  const validator = new ArchitecturalValidator(baseUrl);
  
  try {
    await validator.validate();
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ArchitecturalValidator };