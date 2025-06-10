/**
 * Shared test utilities for Sports Proxy
 * Common mocks, configurations, and helper functions
 */

// Import default model configuration
const DEFAULT_MODEL = 'gpt-4.1-mini';

// Test configuration constants
const TEST_CONFIG = {
  WORKER_URL: 'http://localhost:8787',
  API_KEY: 'sp_test_key',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TIMEOUTS: {
    DEFAULT: 10000,
    LONG: 30000
  }
};

// Common mock environment for all tests
function createMockEnv(overrides = {}) {
  return {
    MLB_MCP_URL: 'https://mlbstats-mcp.gerrygugger.workers.dev',
    ESPN_MCP_URL: 'https://espn-mcp.example.workers.dev',
    CACHE_TTL_HOT: '10',
    CACHE_TTL_COLD: '300',
    ENVIRONMENT: 'development',
    MLB_MCP: {
      async fetch(request) {
        const body = await request.json();
        const { command, params } = body;
        
        // Mock resolver responses
        if (command === 'resolve_team') {
          const name = params.name?.toLowerCase();
          if (name?.includes('yankees')) {
            return new Response(JSON.stringify({
              result: { id: 147, name: "New York Yankees", abbreviation: "NYY", resolved: true }
            }));
          }
          if (name?.includes('dodgers')) {
            return new Response(JSON.stringify({
              result: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD", resolved: true }
            }));
          }
        }
        
        if (command === 'resolve_player') {
          const name = params.name?.toLowerCase();
          if (name?.includes('judge')) {
            return new Response(JSON.stringify({
              result: { id: 592450, name: "Aaron Judge", team: "New York Yankees", resolved: true }
            }));
          }
        }
        
        if (command === 'getRoster' && params.pathParams?.teamId) {
          const teamId = params.pathParams.teamId;
          const rosters = {
            '147': [{ person: { id: 592450, fullName: "Aaron Judge" }, position: { name: "RF" } }],
            '119': [{ person: { id: 605141, fullName: "Mookie Betts" }, position: { name: "RF" } }]
          };
          
          return new Response(JSON.stringify({
            result: { roster: rosters[teamId] || [] }
          }));
        }
        
        // Default response
        return new Response(JSON.stringify({ result: null }));
      }
    },
    ...overrides
  };
}

// Common test data
const TEST_DATA = {
  teams: {
    yankees: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
    dodgers: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" }
  },
  players: {
    judge: { id: 592450, name: "Aaron Judge", team: "New York Yankees" }
  },
  requests: {
    basic: {
      model: DEFAULT_MODEL,
      input: 'Get team info for the Yankees',
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_team_info',
            description: 'Get MLB team information'
          }
        }
      ]
    },
    complex: {
      model: DEFAULT_MODEL,
      input: 'Get the roster for the Yankees and tell me about Aaron Judge',
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
            name: 'get_player_info',
            description: 'Get player information'
          }
        }
      ]
    }
  }
};

// Helper functions
const helpers = {
  async makeRequest(endpoint, options = {}) {
    const response = await fetch(`${TEST_CONFIG.WORKER_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.API_KEY}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return response.json();
  },

  validateResponseStructure(response, requiredFields = []) {
    const defaultFields = ['id', 'model', 'output', 'usage'];
    const allFields = [...defaultFields, ...requiredFields];
    
    for (const field of allFields) {
      if (!(field in response)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return true;
  },

  async waitForCondition(condition, timeout = TEST_CONFIG.TIMEOUTS.DEFAULT) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  logTestResult(testName, success, details = '') {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}${details ? ': ' + details : ''}`);
    return success;
  }
};

module.exports = {
  TEST_CONFIG,
  createMockEnv,
  TEST_DATA,
  helpers
};
