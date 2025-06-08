/**
 * Comprehensive Test Suite for Sports Platform v3
 * Tests OpenAI Responses API integration, conversation context, and microservice integration
 */

const BASE_URL = 'http://localhost:8081'; // sports-proxy dev server

class ResponsesAPITester {
  constructor() {
    this.conversationMemories = [];
    this.responseHistory = [];
  }

  async testEndpoint(testName, url, options, expectedStatus = 200) {
    console.log(`\n🧪 ${testName}`);
    console.log(`   URL: ${url}`);
    console.log(`   Method: ${options.method || 'GET'}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      
      console.log(`   Response: ${response.status} (${responseTime}ms)`);
      
      if (response.status === expectedStatus) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS`);
        
        // Store response for conversation context
        if (data.id) {
          this.responseHistory.push({
            id: data.id,
            testName,
            timestamp: new Date().toISOString(),
            data
          });
        }
        
        console.log(JSON.stringify(data, null, 2));
        return { success: true, data, responseTime };
      } else {
        const errorData = await response.text();
        console.log(`   ❌ FAILED - Expected ${expectedStatus}, got ${response.status}`);
        console.log(`   Error: ${errorData}`);
        return { success: false, error: errorData, status: response.status };
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Test 1: Basic conversation context without tools
  async testConversationContext() {
    console.log('\n🔄 TEST 1: OpenAI Responses API Conversation Context\n');
    
    // First message - greeting
    const test1 = await this.testEndpoint(
      'Message 1 - Initial Greeting',
      `${BASE_URL}/responses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'Hello! Are you there?',
          memories: [
            { key: 'user_name', value: 'TestUser' },
            { key: 'favorite_sport', value: 'baseball' }
          ],
          stream: false
        })
      }
    );

    if (!test1.success) return false;

    // Extract response ID for continuation
    const firstResponseId = test1.data.id;
    console.log(`   💾 Stored response ID: ${firstResponseId}`);

    // Second message - continuing conversation with context
    const test2 = await this.testEndpoint(
      'Message 2 - Conversation Continuation',
      `${BASE_URL}/responses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'Great! What can you help me with?',
          previous_response_id: firstResponseId,
          stream: false
        })
      }
    );

    if (!test2.success) return false;

    // Third message - test memory recall
    const test3 = await this.testEndpoint(
      'Message 3 - Memory Recall Test',
      `${BASE_URL}/responses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'Do you remember my name and favorite sport?',
          previous_response_id: test2.data.id,
          stream: false
        })
      }
    );

    return test3.success;
  }

  // Test 2: MLB Stats Integration with Responses API
  async testMLBStatsIntegration() {
    console.log('\n⚾ TEST 2: MLB Stats Integration via Responses API\n');

    // Define MLB tools
    const mlbTools = [
      {
        name: 'resolve_team',
        description: 'Resolve team name to team ID and information',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Team name' }
          },
          required: ['name']
        }
      },
      {
        name: 'get_team_info',
        description: 'Get MLB team information',
        input_schema: {
          type: 'object',
          properties: {
            teamId: { type: 'string', description: 'MLB team ID' },
            season: { type: 'string', description: 'Season year' }
          }
        }
      }
    ];

    // Message 1 - Team lookup
    const test1 = await this.testEndpoint(
      'MLB Test 1 - Yankees Team Info',
      `${BASE_URL}/responses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'Tell me about the New York Yankees team',
          tools: mlbTools,
          memories: [
            { key: 'user_name', value: 'MLBFan' },
            { key: 'favorite_team', value: 'Yankees' }
          ],
          stream: false
        })
      }
    );

    if (!test1.success) return false;

    // Message 2 - Player stats (continuing conversation)
    const test2 = await this.testEndpoint(
      'MLB Test 2 - Player Stats with Context',
      `${BASE_URL}/responses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'What about Aaron Judge stats?',
          tools: [...mlbTools, {
            name: 'get_player_stats',
            description: 'Get MLB player statistics',
            input_schema: {
              type: 'object',
              properties: {
                playerId: { type: 'string', description: 'MLB player ID' },
                season: { type: 'string', description: 'Season year' }
              }
            }
          }],
          previous_response_id: test1.data.id,
          stream: false
        })
      }
    );

    return test2.success;
  }

  // Test 3: Hockey Stats Integration (separate conversation)
  async testHockeyStatsIntegration() {
    console.log('\n🏒 TEST 3: Hockey Stats Integration (New Conversation)\n');

    // Define Hockey tools
    const hockeyTools = [
      {
        name: 'resolve_team',
        description: 'Resolve hockey team name to team ID and information',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Team name' }
          },
          required: ['name']
        }
      },
      {
        name: 'get_team_info',
        description: 'Get NHL team information',
        input_schema: {
          type: 'object',
          properties: {
            teamId: { type: 'string', description: 'NHL team ID' },
            season: { type: 'string', description: 'Season year' }
          }
        }
      }
    ];

    // Message 1 - Hockey team lookup (NEW conversation)
    const test1 = await this.testEndpoint(
      'Hockey Test 1 - Bruins Team Info',
      `${BASE_URL}/responses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'Tell me about the Boston Bruins hockey team',
          tools: hockeyTools,
          memories: [
            { key: 'user_name', value: 'HockeyFan' },
            { key: 'favorite_sport', value: 'hockey' }
          ],
          stream: false
        })
      }
    );

    if (!test1.success) return false;

    // Message 2 - Player stats (continuing hockey conversation)
    const test2 = await this.testEndpoint(
      'Hockey Test 2 - Player Stats with Context',
      `${BASE_URL}/responses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'What about Connor McDavid stats?',
          tools: [...hockeyTools, {
            name: 'get_player_stats',
            description: 'Get NHL player statistics',
            input_schema: {
              type: 'object',
              properties: {
                playerId: { type: 'string', description: 'NHL player ID' },
                season: { type: 'string', description: 'Season year' }
              }
            }
          }],
          previous_response_id: test1.data.id,
          stream: false
        })
      }
    );

    return test2.success;
  }

  // Test 4: Streaming Responses API
  async testStreamingResponses() {
    console.log('\n🌊 TEST 4: Streaming Responses API\n');

    try {
      console.log('   🧪 Testing Streaming Response...');
      
      const response = await fetch(`${BASE_URL}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          input: 'Hello, can you stream a response about baseball?',
          stream: true,
          memories: [{ key: 'test', value: 'streaming' }]
        })
      });

      if (!response.ok) {
        console.log(`   ❌ Failed to start stream: ${response.status}`);
        return false;
      }

      console.log('   ✅ Stream started successfully');
      console.log('   📡 Reading stream events...');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let eventCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event:') || line.startsWith('data:')) {
            console.log(`   📨 ${line}`);
            eventCount++;
          }
        }

        // Limit to prevent infinite streaming
        if (eventCount > 20) {
          break;
        }
      }

      console.log(`   ✅ Stream completed (${eventCount} events)`);
      return true;

    } catch (error) {
      console.log(`   ❌ Streaming error: ${error.message}`);
      return false;
    }
  }

  // Health check first
  async testHealthCheck() {
    console.log('\n🏥 HEALTH CHECK\n');
    
    return await this.testEndpoint(
      'Sports Proxy Health Check',
      `${BASE_URL}/health`,
      { method: 'GET' }
    );
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 SPORTS PLATFORM v3 COMPREHENSIVE TEST SUITE');
    console.log('===================================================');
    
    const results = {
      health: false,
      conversationContext: false,
      mlbIntegration: false,
      hockeyIntegration: false,
      streaming: false
    };

    // Health check first
    const healthResult = await this.testHealthCheck();
    results.health = healthResult.success;

    if (!results.health) {
      console.log('\n❌ Health check failed - stopping tests');
      return results;
    }

    // Test 1: Conversation Context
    results.conversationContext = await this.testConversationContext();

    // Test 2: MLB Integration
    results.mlbIntegration = await this.testMLBStatsIntegration();

    // Test 3: Hockey Integration
    results.hockeyIntegration = await this.testHockeyStatsIntegration();

    // Test 4: Streaming
    results.streaming = await this.testStreamingResponses();

    // Summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    
    const allPassed = Object.values(results).every(r => r);
    const passedCount = Object.values(results).filter(r => r).length;
    const totalCount = Object.keys(results).length;

    for (const [test, passed] of Object.entries(results)) {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    }

    console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Sports Platform v3 is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
    }

    return results;
  }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  const tester = new ResponsesAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = { ResponsesAPITester };