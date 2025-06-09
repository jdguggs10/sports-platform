#!/usr/bin/env node

/**
 * Integration Tests for Sports Proxy
 * Tests the complete OpenAI Responses API integration and workflows
 */

const { ResponsesAPIOrchestrator } = require('../src/mcp/orchestrator');
const { createMockEnv, TEST_CONFIG, TEST_DATA, helpers } = require('./test-utils');

class IntegrationTestSuite {
  constructor() {
    this.results = [];
    this.mockEnv = createMockEnv();
    this.responseIds = [];
  }

  async runAll() {
    console.log('🔗 Running Sports Proxy Integration Tests\n');
    
    try {
      await this.testResponsesAPIBasic();
      await this.testResponsesAPIComplete();
      await this.testHybridEnhanced();
      await this.testStateManagement();
      await this.testErrorHandling();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Integration test suite failed:', error);
      process.exit(1);
    }
  }

  async testResponsesAPIBasic() {
    console.log('📡 Testing Basic Responses API...');
    
    try {
      const response = await helpers.makeRequest('/responses', {
        body: JSON.stringify(TEST_DATA.requests.basic)
      });
      
      helpers.validateResponseStructure(response);
      this.responseIds.push(response.id);
      
      this.results.push(helpers.logTestResult(
        'Basic Responses API', 
        true,
        `Response ID: ${response.id}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Basic Responses API', 
        false, 
        error.message
      ));
    }
  }

  async testResponsesAPIComplete() {
    console.log('\n🔄 Testing Complete Integration Flow...');
    
    const orchestrator = new ResponsesAPIOrchestrator(this.mockEnv);
    
    try {
      // Test the full flow: natural language -> tool detection -> resolver -> enrichment -> data
      const result = await orchestrator.processResponsesAPIRequest({
        model: 'gpt-4.1',
        input: 'Get the roster for the Yankees and tell me about their star players',
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_team_info',
              description: 'Get MLB team information'
            }
          },
          {
            type: 'function', 
            function: {
              name: 'get_roster',
              description: 'Get team roster'
            }
          }
        ]
      });
      
      this.results.push(helpers.logTestResult(
        'Complete integration flow', 
        result && result.id,
        `Processed complex request successfully`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Complete integration flow', 
        false, 
        error.message
      ));
    }
  }

  async testHybridEnhanced() {
    console.log('\n🚀 Testing Enhanced Hybrid Approach...');
    
    const orchestrator = new ResponsesAPIOrchestrator(this.mockEnv);
    
    try {
      // Test the enhanced hybrid approach with approve/enrich step
      const result = await orchestrator.processResponsesAPIRequest({
        model: 'gpt-4.1',
        input: 'Tell me about the Yankees team',
        tools: [
          {
            type: 'function',
            function: {
              name: 'resolve_team',
              description: 'Resolve team information'
            }
          },
          {
            type: 'function',
            function: {
              name: 'getRoster', 
              description: 'Get team roster'
            }
          }
        ]
      });

      this.results.push(helpers.logTestResult(
        'Enhanced hybrid approach', 
        result && result.id,
        `Enhanced processing completed`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Enhanced hybrid approach', 
        false, 
        error.message
      ));
    }
  }

  async testStateManagement() {
    console.log('\n💾 Testing State Management...');
    
    if (this.responseIds.length === 0) {
      this.results.push(helpers.logTestResult(
        'State management', 
        false, 
        'No response IDs available for testing'
      ));
      return;
    }

    try {
      // Test retrieval of previous response
      const response = await helpers.makeRequest('/responses', {
        body: JSON.stringify({
          model: 'gpt-4.1',
          input: 'Continue from where we left off',
          previous_response_id: this.responseIds[0]
        })
      });

      this.results.push(helpers.logTestResult(
        'State management', 
        response && response.id,
        `Continued from response ${this.responseIds[0]}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'State management', 
        false, 
        error.message
      ));
    }
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');
    
    try {
      // Test with invalid request
      await helpers.makeRequest('/responses', {
        body: JSON.stringify({
          model: 'invalid-model',
          input: ''
        })
      });
      
      // Should not reach here
      this.results.push(helpers.logTestResult(
        'Error handling', 
        false, 
        'Expected error but request succeeded'
      ));
    } catch (error) {
      // Expected to fail
      this.results.push(helpers.logTestResult(
        'Error handling', 
        error.message.includes('HTTP'),
        `Properly handled error: ${error.message}`
      ));
    }
  }

  printResults() {
    const passed = this.results.filter(Boolean).length;
    const total = this.results.length;
    
    console.log(`\n📊 Integration Test Results: ${passed}/${total} passed`);
    
    if (passed === total) {
      console.log('✅ All integration tests passed!');
    } else {
      console.log('❌ Some integration tests failed');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new IntegrationTestSuite();
  suite.runAll().catch(error => {
    console.error('Integration test suite error:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestSuite;
