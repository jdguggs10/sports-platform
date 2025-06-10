#!/usr/bin/env node

/**
 * End-to-End Tests for Sports Proxy
 * Tests real API interactions and OpenAI MCP integration
 */

const https = require('https');
const { createMockEnv, TEST_CONFIG, TEST_DATA, helpers } = require('./test-utils');

// Import default model configuration
const DEFAULT_MODEL = 'gpt-4.1-mini';

class E2ETestSuite {
  constructor() {
    this.results = [];
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async runAll() {
    console.log('🌐 Running Sports Proxy E2E Tests\n');
    
    if (!this.openaiApiKey) {
      console.log('⚠️  OPENAI_API_KEY not found, skipping OpenAI integration tests');
      console.log('Set it with: export OPENAI_API_KEY="your-key-here"');
    }
    
    try {
      await this.testWorkerDeployment();
      await this.testHealthEndpoint();
      if (this.openaiApiKey) {
        await this.testOpenAIIntegration();
        await this.testMCPSupport();
      }
      await this.testPerformance();
      
      this.printResults();
    } catch (error) {
      console.error('❌ E2E test suite failed:', error);
      process.exit(1);
    }
  }

  async testWorkerDeployment() {
    console.log('🚀 Testing Worker Deployment...');
    
    try {
      const response = await fetch(TEST_CONFIG.WORKER_URL);
      const success = response.status === 200 || response.status === 404; // 404 is ok for root
      
      this.results.push(helpers.logTestResult(
        'Worker deployment', 
        success,
        `Status: ${response.status}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Worker deployment', 
        false, 
        `Cannot reach worker: ${error.message}`
      ));
    }
  }

  async testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.WORKER_URL}/health`);
      const data = await response.json();
      
      this.results.push(helpers.logTestResult(
        'Health endpoint', 
        response.ok && data,
        `Health: ${JSON.stringify(data)}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Health endpoint', 
        false, 
        error.message
      ));
    }
  }

  async testOpenAIIntegration() {
    console.log('\n🤖 Testing OpenAI API Integration...');
    
    return new Promise((resolve) => {
      const testPayload = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Hello, can you help me test MCP integration?"
          }
        ],
        max_tokens: 100
      };

      const postData = JSON.stringify(testPayload);

      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            this.results.push(helpers.logTestResult(
              'OpenAI API integration', 
              res.statusCode === 200 && response.choices,
              `Model: ${response.model || 'N/A'}`
            ));
          } catch (error) {
            this.results.push(helpers.logTestResult(
              'OpenAI API integration', 
              false, 
              `Parse error: ${error.message}`
            ));
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        this.results.push(helpers.logTestResult(
          'OpenAI API integration', 
          false, 
          `Request error: ${error.message}`
        ));
        resolve();
      });

      req.setTimeout(TEST_CONFIG.TIMEOUTS.LONG, () => {
        this.results.push(helpers.logTestResult(
          'OpenAI API integration', 
          false, 
          'Request timeout'
        ));
        req.destroy();
        resolve();
      });

      req.write(postData);
      req.end();
    });
  }

  async testMCPSupport() {
    console.log('\n🔌 Testing MCP Support...');
    
    try {
      // Test if our worker supports MCP-style requests
      const response = await helpers.makeRequest('/responses', {
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          input: 'Test MCP integration with sports data',
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_team_info',
                description: 'Get team information via MCP'
              }
            }
          ]
        })
      });

      this.results.push(helpers.logTestResult(
        'MCP support', 
        response && response.id,
        `MCP-style request processed: ${response.id}`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'MCP support', 
        false, 
        error.message
      ));
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    const start = Date.now();
    
    try {
      const response = await helpers.makeRequest('/responses', {
        body: JSON.stringify(TEST_DATA.requests.basic)
      });
      
      const duration = Date.now() - start;
      const success = duration < 5000; // Should complete within 5 seconds
      
      this.results.push(helpers.logTestResult(
        'Performance test', 
        success,
        `Response time: ${duration}ms`
      ));
    } catch (error) {
      this.results.push(helpers.logTestResult(
        'Performance test', 
        false, 
        error.message
      ));
    }
  }

  printResults() {
    const passed = this.results.filter(Boolean).length;
    const total = this.results.length;
    
    console.log(`\n📊 E2E Test Results: ${passed}/${total} passed`);
    
    if (passed === total) {
      console.log('✅ All E2E tests passed!');
    } else {
      console.log('❌ Some E2E tests failed');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new E2ETestSuite();
  suite.runAll().catch(error => {
    console.error('E2E test suite error:', error);
    process.exit(1);
  });
}

module.exports = E2ETestSuite;
