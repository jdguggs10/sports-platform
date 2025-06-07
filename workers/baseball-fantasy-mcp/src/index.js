/**
 * Baseball Fantasy MCP - v3 Meta-Tool Façade with ESPN Auth
 * Exposes baseball.fantasy meta-tool with authenticated ESPN endpoints
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          service: 'baseball-fantasy-mcp',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          endpoints: ['team_roster', 'scoreboard', 'transactions', 'league_settings', 'waivers'],
          auth_required: true
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Main meta-tool endpoint
      if (request.method === 'POST') {
        const body = await request.json();
        const { endpoint, query } = body;
        
        if (!endpoint) {
          return new Response(JSON.stringify({
            error: 'Missing endpoint parameter',
            available: ['team_roster', 'scoreboard', 'transactions', 'league_settings', 'waivers']
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Check authentication
        const uid = query.uid;
        if (!uid) {
          return new Response(JSON.stringify({
            error: 'User ID required for fantasy data'
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Get user session and cookies
        const { swid, s2 } = await getUserCookies(uid, env);
        if (!swid || !s2) {
          return new Response(JSON.stringify({
            error: 'ESPN authentication required. Please log in to ESPN.',
            login_required: true
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Fan out to ESPN fantasy endpoints
        const result = await fanOutToESPNFantasy(endpoint, query, { swid, s2 });
        
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response('Baseball Fantasy MCP v3 - Meta-Tool Façade with Auth', {
        headers: { "Content-Type": "text/plain" }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        service: 'baseball-fantasy-mcp'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

/**
 * Get user cookies from Durable Object storage
 */
async function getUserCookies(uid, env) {
  const userSessionId = env.USER_SESSION.idFromString(uid);
  const userSession = env.USER_SESSION.get(userSessionId);
  
  const request = new Request('https://localhost/getCookies', {
    method: 'POST',
    body: JSON.stringify({ sport: 'baseball' })
  });
  
  const response = await userSession.fetch(request);
  const data = await response.json();
  
  return {
    swid: data.swid,
    s2: data.s2
  };
}

/**
 * Fan out meta-tool requests to ESPN Fantasy endpoints
 */
async function fanOutToESPNFantasy(endpoint, query = {}, cookies) {
  // Map meta-tool endpoints to ESPN API URLs
  const endpointMapping = {
    team_roster: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/flb/seasons/2025/segments/0/leagues/${q.leagueId}/teams/${q.teamId}/roster`,
      params: {}
    },
    scoreboard: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/flb/seasons/2025/segments/0/leagues/${q.leagueId}`,
      params: { view: 'mMatchup' }
    },
    transactions: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/flb/seasons/2025/segments/0/leagues/${q.leagueId}`,
      params: { view: 'mTransactions2' }
    },
    league_settings: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/flb/seasons/2025/segments/0/leagues/${q.leagueId}`,
      params: { view: 'mSettings' }
    },
    waivers: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/flb/seasons/2025/segments/0/leagues/${q.leagueId}`,
      params: { view: 'waiverWire' }
    }
  };
  
  const mapping = endpointMapping[endpoint];
  if (!mapping) {
    throw new Error(`Unknown endpoint: ${endpoint}. Available: ${Object.keys(endpointMapping).join(', ')}`);
  }
  
  // Build ESPN API URL with parameters
  const baseUrl = mapping.buildUrl(query);
  const url = new URL(baseUrl);
  
  // Add query parameters
  Object.entries(mapping.params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  // Add any additional query parameters
  if (query.week) url.searchParams.set('scoringPeriodId', query.week);
  if (query.count) url.searchParams.set('count', query.count);
  
  // Make authenticated request to ESPN
  const espnResponse = await fetch(url.toString(), {
    headers: {
      'Cookie': `swid=${cookies.swid}; espn_s2=${cookies.s2}`,
      'User-Agent': 'Mozilla/5.0 (compatible; Baseball-Fantasy-MCP/1.0)'
    }
  });
  
  if (!espnResponse.ok) {
    if (espnResponse.status === 401) {
      throw new Error('ESPN authentication expired. Please log in again.');
    }
    throw new Error(`ESPN API error: ${espnResponse.status} ${espnResponse.statusText}`);
  }
  
  const data = await espnResponse.json();
  
  return {
    endpoint: endpoint,
    query: query,
    data: data,
    meta: {
      service: 'baseball-fantasy-mcp',
      timestamp: new Date().toISOString(),
      espn_url: url.toString(),
      authenticated: true
    }
  };
}

/**
 * Durable Object for user session storage
 */
export class UserSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/getCookies') {
      const body = await request.json();
      const sport = body.sport || 'baseball';
      
      // Get stored cookies for this sport
      const cookies = await this.state.storage.get(`cookies:${sport}`) || {};
      
      return new Response(JSON.stringify(cookies), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === '/setCookies') {
      const body = await request.json();
      const { sport, swid, s2 } = body;
      
      // Store cookies for this sport
      await this.state.storage.put(`cookies:${sport}`, { swid, s2 });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response('UserSession Durable Object', {
      headers: { "Content-Type": "text/plain" }
    });
  }
}