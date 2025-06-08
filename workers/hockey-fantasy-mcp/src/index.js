/**
 * Hockey Fantasy MCP - v3.1 Meta-Tool Façade with Multi-Provider Support
 * Exposes hockey.fantasy meta-tool with ESPN/Yahoo provider choice
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
          service: 'hockey-fantasy-mcp',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          endpoints: ['team_roster', 'scoreboard', 'transactions', 'league_settings', 'leagues'],
          auth_required: true
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // League discovery API endpoint for v3.2
      if (url.pathname === '/leagues' && request.method === 'GET') {
        const sport = url.searchParams.get('sport') || 'hockey';
        const provider = url.searchParams.get('provider');
        const uid = url.searchParams.get('uid');
        
        if (!provider || !uid) {
          return new Response(JSON.stringify({
            error: 'Missing required parameters: provider and uid'
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        try {
          const leagues = await discoverUserLeagues(uid, env, sport, provider);
          return new Response(JSON.stringify({
            sport,
            provider,
            leagues,
            meta: {
              service: 'hockey-fantasy-mcp',
              timestamp: new Date().toISOString(),
              total_leagues: leagues.length
            }
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: error.message,
            service: 'hockey-fantasy-mcp'
          }), {
            status: error.message.includes('authentication') ? 401 : 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
      
      // Main meta-tool endpoint
      if (request.method === 'POST') {
        const body = await request.json();
        const { provider, league_id, endpoint, query } = body;
        
        if (!provider) {
          return new Response(JSON.stringify({
            error: 'Missing provider parameter',
            available: ['espn', 'yahoo']
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (!league_id) {
          return new Response(JSON.stringify({
            error: 'Missing league_id parameter - required for v3.2',
            help: 'Use /leagues endpoint to discover available leagues'
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (!endpoint) {
          return new Response(JSON.stringify({
            error: 'Missing endpoint parameter',
            available: ['team_roster', 'scoreboard', 'transactions', 'league_settings']
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
        
        // Route to appropriate provider
        let result;
        if (provider === 'espn') {
          // Get user session and cookies
          const { swid, s2 } = await getUserCookies(uid, env, 'espn');
          if (!swid || !s2) {
            return new Response(JSON.stringify({
              error: 'ESPN authentication required. Please log in to ESPN.',
              login_required: true,
              provider: 'espn'
            }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          result = await fanOutToESPNFantasy(endpoint, query, { swid, s2 });
        } else if (provider === 'yahoo') {
          // Get Yahoo OAuth tokens
          const { access_token, refresh_token } = await getUserTokens(uid, env, 'yahoo');
          if (!access_token) {
            return new Response(JSON.stringify({
              error: 'Yahoo authentication required. Please authorize Yahoo Fantasy.',
              login_required: true,
              provider: 'yahoo'
            }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          result = await fanOutToYahooFantasy(endpoint, query, { access_token, refresh_token }, uid, env);
        } else {
          return new Response(JSON.stringify({
            error: `Unsupported provider: ${provider}`,
            available: ['espn', 'yahoo']
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response('Hockey Fantasy MCP v3.1 - Meta-Tool Façade with Multi-Provider Support', {
        headers: { "Content-Type": "text/plain" }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        service: 'hockey-fantasy-mcp'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

/**
 * Get user cookies from Durable Object storage (ESPN)
 */
async function getUserCookies(uid, env, provider = 'espn') {
  const userSessionId = env.USER_SESSION.idFromString(uid);
  const userSession = env.USER_SESSION.get(userSessionId);
  
  const request = new Request('https://localhost/getCookies', {
    method: 'POST',
    body: JSON.stringify({ sport: 'hockey', provider })
  });
  
  const response = await userSession.fetch(request);
  const data = await response.json();
  
  return {
    swid: data.swid,
    s2: data.s2
  };
}

/**
 * Get user OAuth tokens from Durable Object storage (Yahoo)
 */
async function getUserTokens(uid, env, provider = 'yahoo') {
  const userSessionId = env.USER_SESSION.idFromString(uid);
  const userSession = env.USER_SESSION.get(userSessionId);
  
  const request = new Request('https://localhost/getTokens', {
    method: 'POST',
    body: JSON.stringify({ sport: 'hockey', provider })
  });
  
  const response = await userSession.fetch(request);
  const data = await response.json();
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token
  };
}

/**
 * Fan out meta-tool requests to ESPN Fantasy endpoints
 */
async function fanOutToESPNFantasy(endpoint, query = {}, cookies) {
  // Map meta-tool endpoints to ESPN API URLs (hockey = fhl)
  const endpointMapping = {
    team_roster: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/fhl/seasons/2025/segments/0/leagues/${q.leagueId}/teams/${q.teamId}/roster`,
      params: {}
    },
    scoreboard: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/fhl/seasons/2025/segments/0/leagues/${q.leagueId}`,
      params: { view: 'mMatchup' }
    },
    transactions: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/fhl/seasons/2025/segments/0/leagues/${q.leagueId}`,
      params: { view: 'mTransactions2' }
    },
    league_settings: {
      buildUrl: (q) => `https://fantasy.espn.com/apis/v3/games/fhl/seasons/2025/segments/0/leagues/${q.leagueId}`,
      params: { view: 'mSettings' }
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
      provider: 'espn',
      timestamp: new Date().toISOString(),
      espn_url: url.toString(),
      authenticated: true
    }
  };
}

/**
 * Fan out meta-tool requests to Yahoo Fantasy endpoints
 */
async function fanOutToYahooFantasy(endpoint, query = {}, tokens, uid, env) {
  // Map meta-tool endpoints to Yahoo Fantasy API URLs (hockey)
  const endpointMapping = {
    team_roster: {
      buildUrl: (q) => `https://fantasysports.yahooapis.com/fantasy/v2/league/${q.leagueKey}/teams/${q.teamKey}/roster`,
      method: 'GET'
    },
    scoreboard: {
      buildUrl: (q) => `https://fantasysports.yahooapis.com/fantasy/v2/league/${q.leagueKey}/scoreboard`,
      method: 'GET'
    },
    transactions: {
      buildUrl: (q) => `https://fantasysports.yahooapis.com/fantasy/v2/league/${q.leagueKey}/transactions`,
      method: 'GET'
    },
    league_settings: {
      buildUrl: (q) => `https://fantasysports.yahooapis.com/fantasy/v2/league/${q.leagueKey}/settings`,
      method: 'GET'
    }
  };
  
  const mapping = endpointMapping[endpoint];
  if (!mapping) {
    throw new Error(`Unknown endpoint: ${endpoint}. Available: ${Object.keys(endpointMapping).join(', ')}`);
  }
  
  // Build Yahoo API URL
  const baseUrl = mapping.buildUrl(query);
  const url = new URL(baseUrl);
  url.searchParams.set('format', 'json');
  
  // Add any additional query parameters
  if (query.week) url.searchParams.set('week', query.week);
  if (query.count) url.searchParams.set('count', query.count);
  
  // Make authenticated request to Yahoo
  const yahooResponse = await fetch(url.toString(), {
    method: mapping.method,
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'User-Agent': 'Hockey-Fantasy-MCP/1.0',
      'Accept': 'application/json'
    }
  });
  
  if (!yahooResponse.ok) {
    if (yahooResponse.status === 401) {
      // Try to refresh the token
      const newTokens = await refreshYahooToken(tokens.refresh_token, env);
      if (newTokens) {
        // Update stored tokens
        await updateUserTokens(uid, env, 'yahoo', newTokens);
        
        // Retry the request with new token
        const retryResponse = await fetch(url.toString(), {
          method: mapping.method,
          headers: {
            'Authorization': `Bearer ${newTokens.access_token}`,
            'User-Agent': 'Hockey-Fantasy-MCP/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Yahoo API error after token refresh: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const data = await retryResponse.json();
        return {
          endpoint: endpoint,
          query: query,
          data: data,
          meta: {
            service: 'hockey-fantasy-mcp',
            provider: 'yahoo',
            timestamp: new Date().toISOString(),
            yahoo_url: url.toString(),
            authenticated: true,
            token_refreshed: true
          }
        };
      } else {
        throw new Error('Yahoo authentication expired and token refresh failed. Please re-authorize.');
      }
    }
    throw new Error(`Yahoo API error: ${yahooResponse.status} ${yahooResponse.statusText}`);
  }
  
  const data = await yahooResponse.json();
  
  return {
    endpoint: endpoint,
    query: query,
    data: data,
    meta: {
      service: 'baseball-fantasy-mcp',
      provider: 'yahoo',
      timestamp: new Date().toISOString(),
      yahoo_url: url.toString(),
      authenticated: true
    }
  };
}

/**
 * Refresh Yahoo OAuth token
 */
async function refreshYahooToken(refreshToken, env) {
  try {
    const response = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${env.YAHOO_CLIENT_ID}:${env.YAHOO_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    if (!response.ok) {
      console.error('Yahoo token refresh failed:', response.status, response.statusText);
      return null;
    }
    
    const tokens = await response.json();
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || refreshToken // Some providers don't return new refresh token
    };
  } catch (error) {
    console.error('Yahoo token refresh error:', error);
    return null;
  }
}

/**
 * Update user tokens in Durable Object storage
 */
async function updateUserTokens(uid, env, provider, tokens) {
  const userSessionId = env.USER_SESSION.idFromString(uid);
  const userSession = env.USER_SESSION.get(userSessionId);
  
  const request = new Request('https://localhost/setTokens', {
    method: 'POST',
    body: JSON.stringify({ 
      sport: 'hockey', 
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    })
  });
  
  await userSession.fetch(request);
}

/**
 * Discover user leagues for v3.2 multi-league support (Hockey)
 */
async function discoverUserLeagues(uid, env, sport, provider) {
  if (provider === 'espn') {
    // Get ESPN cookies
    const { swid, s2 } = await getUserCookies(uid, env, provider);
    if (!swid || !s2) {
      throw new Error('ESPN authentication required to discover leagues');
    }
    
    // ESPN user endpoint to get hockey leagues (fhl instead of flb)
    const espnResponse = await fetch('https://fantasy.espn.com/apis/v3/games/fhl/seasons/2025', {
      headers: {
        'Cookie': `swid=${swid}; espn_s2=${s2}`,
        'User-Agent': 'Mozilla/5.0 (compatible; Hockey-Fantasy-MCP/1.0)'
      }
    });
    
    if (!espnResponse.ok) {
      throw new Error('Failed to fetch ESPN hockey leagues');
    }
    
    const data = await espnResponse.json();
    return (data.leagues || []).map(league => ({
      id: league.id.toString(),
      name: league.settings?.name || `League ${league.id}`,
      provider: 'espn',
      sport: sport,
      teams: league.settings?.size || 0
    }));
    
  } else if (provider === 'yahoo') {
    // Get Yahoo tokens
    const { access_token } = await getUserTokens(uid, env, provider);
    if (!access_token) {
      throw new Error('Yahoo authentication required to discover leagues');
    }
    
    // Yahoo user leagues endpoint for hockey
    const yahooResponse = await fetch('https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nhl/leagues?format=json', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': 'Hockey-Fantasy-MCP/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!yahooResponse.ok) {
      throw new Error('Failed to fetch Yahoo hockey leagues');
    }
    
    const data = await yahooResponse.json();
    const leagues = data.fantasy_content?.users?.[0]?.user?.[1]?.games?.[0]?.game?.[1]?.leagues || [];
    
    return leagues.map(league => ({
      id: league[0]?.league_key || league.league_key,
      name: league[0]?.name || league.name || `League ${league[0]?.league_id || league.league_id}`,
      provider: 'yahoo',
      sport: sport,
      teams: league[0]?.num_teams || league.num_teams || 0
    }));
    
  } else {
    throw new Error(`Unsupported provider for league discovery: ${provider}`);
  }
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
      const sport = body.sport || 'hockey';
      const provider = body.provider || 'espn';
      
      // Get stored cookies for this sport and provider
      const cookies = await this.state.storage.get(`cookies:${sport}:${provider}`) || {};
      
      return new Response(JSON.stringify(cookies), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === '/setCookies') {
      const body = await request.json();
      const { sport, provider, swid, s2 } = body;
      
      // Store cookies for this sport and provider
      await this.state.storage.put(`cookies:${sport}:${provider}`, { swid, s2 });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === '/getTokens') {
      const body = await request.json();
      const sport = body.sport || 'hockey';
      const provider = body.provider || 'yahoo';
      
      // Get stored tokens for this sport and provider
      const tokens = await this.state.storage.get(`tokens:${sport}:${provider}`) || {};
      
      return new Response(JSON.stringify(tokens), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === '/setTokens') {
      const body = await request.json();
      const { sport, provider, access_token, refresh_token } = body;
      
      // Store tokens for this sport and provider
      await this.state.storage.put(`tokens:${sport}:${provider}`, { 
        access_token, 
        refresh_token,
        stored_at: Date.now()
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response('UserSession Durable Object - Multi-Provider Support', {
      headers: { "Content-Type": "text/plain" }
    });
  }
}