/**
 * Baseball Stats MCP - v3 Meta-Tool Façade
 * Exposes baseball.stats meta-tool that fans out to 6 concrete endpoints
 * Integrates with mlbstats-mcp via Service Binding for zero-latency communication
 */

// MLB Team name to ID mapping (from mlbstats-mcp)
const MLB_TEAMS = {
  // American League East
  "yankees": { id: 147, name: "New York Yankees", abbreviation: "NYY" },
  "new york yankees": { id: 147, name: "New York Yankees", abbreviation: "NYY" },
  "nyy": { id: 147, name: "New York Yankees", abbreviation: "NYY" },
  
  "red sox": { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
  "boston red sox": { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
  "boston": { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
  "bos": { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
  
  "blue jays": { id: 142, name: "Toronto Blue Jays", abbreviation: "TOR" },
  "toronto blue jays": { id: 142, name: "Toronto Blue Jays", abbreviation: "TOR" },
  "toronto": { id: 142, name: "Toronto Blue Jays", abbreviation: "TOR" },
  "tor": { id: 142, name: "Toronto Blue Jays", abbreviation: "TOR" },
  
  "rays": { id: 139, name: "Tampa Bay Rays", abbreviation: "TB" },
  "tampa bay rays": { id: 139, name: "Tampa Bay Rays", abbreviation: "TB" },
  "tampa bay": { id: 139, name: "Tampa Bay Rays", abbreviation: "TB" },
  "tb": { id: 139, name: "Tampa Bay Rays", abbreviation: "TB" },
  
  "orioles": { id: 110, name: "Baltimore Orioles", abbreviation: "BAL" },
  "baltimore orioles": { id: 110, name: "Baltimore Orioles", abbreviation: "BAL" },
  "baltimore": { id: 110, name: "Baltimore Orioles", abbreviation: "BAL" },
  "bal": { id: 110, name: "Baltimore Orioles", abbreviation: "BAL" },
  
  // Additional major teams for quick resolution
  "dodgers": { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
  "los angeles dodgers": { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
  "la dodgers": { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
  "lad": { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
  
  "giants": { id: 137, name: "San Francisco Giants", abbreviation: "SF" },
  "san francisco giants": { id: 137, name: "San Francisco Giants", abbreviation: "SF" },
  "san francisco": { id: 137, name: "San Francisco Giants", abbreviation: "SF" },
  "sf": { id: 137, name: "San Francisco Giants", abbreviation: "SF" },
  
  "astros": { id: 117, name: "Houston Astros", abbreviation: "HOU" },
  "houston astros": { id: 117, name: "Houston Astros", abbreviation: "HOU" },
  "houston": { id: 117, name: "Houston Astros", abbreviation: "HOU" },
  "hou": { id: 117, name: "Houston Astros", abbreviation: "HOU" },
  
  "braves": { id: 144, name: "Atlanta Braves", abbreviation: "ATL" },
  "atlanta braves": { id: 144, name: "Atlanta Braves", abbreviation: "ATL" },
  "atlanta": { id: 144, name: "Atlanta Braves", abbreviation: "ATL" },
  "atl": { id: 144, name: "Atlanta Braves", abbreviation: "ATL" },
  
  "mets": { id: 121, name: "New York Mets", abbreviation: "NYM" },
  "new york mets": { id: 121, name: "New York Mets", abbreviation: "NYM" },
  "nym": { id: 121, name: "New York Mets", abbreviation: "NYM" }
};

// Common player mappings
const MLB_PLAYERS = {
  "aaron judge": { id: 592450, name: "Aaron Judge", team: "New York Yankees" },
  "judge": { id: 592450, name: "Aaron Judge", team: "New York Yankees" },
  "mookie betts": { id: 605141, name: "Mookie Betts", team: "Los Angeles Dodgers" },
  "betts": { id: 605141, name: "Mookie Betts", team: "Los Angeles Dodgers" },
  "shohei ohtani": { id: 660271, name: "Shohei Ohtani", team: "Los Angeles Dodgers" },
  "ohtani": { id: 660271, name: "Shohei Ohtani", team: "Los Angeles Dodgers" },
  "freddie freeman": { id: 518692, name: "Freddie Freeman", team: "Los Angeles Dodgers" },
  "freeman": { id: 518692, name: "Freddie Freeman", team: "Los Angeles Dodgers" },
  "ronald acuna jr": { id: 660670, name: "Ronald Acuna Jr.", team: "Atlanta Braves" },
  "acuna": { id: 660670, name: "Ronald Acuna Jr.", team: "Atlanta Braves" },
  "mike trout": { id: 545361, name: "Mike Trout", team: "Los Angeles Angels" },
  "trout": { id: 545361, name: "Mike Trout", team: "Los Angeles Angels" }
};

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
          service: 'baseball-stats-mcp',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          endpoints: ['player', 'team', 'game', 'standings', 'schedule', 'advanced'],
          version: '3.0.0',
          integration: 'mlbstats-mcp via Service Binding'
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Main meta-tool endpoint
      if (request.method === 'POST') {
        const body = await request.json();
        let { endpoint, query } = body;
        
        if (!endpoint) {
          return new Response(JSON.stringify({
            error: 'Missing endpoint parameter',
            available: ['player', 'team', 'game', 'standings', 'schedule', 'advanced']
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Intelligent entity resolution
        query = await resolveEntities(query, env);
        
        // Fan out to concrete MLB Stats API endpoints
        const result = await fanOutToMLBStats(endpoint, query, env);
        
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response('Baseball Stats MCP v3 - Meta-Tool Façade', {
        headers: { "Content-Type": "text/plain" }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        service: 'baseball-stats-mcp'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

/**
 * Intelligent entity resolution before API calls
 */
async function resolveEntities(query, env) {
  if (!query || typeof query !== 'object') {
    return query || {};
  }
  
  const resolved = { ...query };
  
  // Resolve team names
  if (query.name && !query.teamId && !query.id) {
    const teamName = query.name.toLowerCase();
    const teamInfo = MLB_TEAMS[teamName];
    if (teamInfo) {
      resolved.teamId = teamInfo.id;
      resolved.teamName = teamInfo.name;
      resolved.teamAbbr = teamInfo.abbreviation;
    }
  }
  
  // Resolve player names
  if (query.name && !query.playerId && !query.id) {
    const playerName = query.name.toLowerCase();
    const playerInfo = MLB_PLAYERS[playerName];
    if (playerInfo) {
      resolved.playerId = playerInfo.id;
      resolved.playerName = playerInfo.name;
      resolved.playerTeam = playerInfo.team;
    }
  }
  
  return resolved;
}

/**
 * Fan out meta-tool requests to concrete MLB Stats endpoints
 * Direct MLB API integration with intelligent entity resolution
 */
async function fanOutToMLBStats(endpoint, query = {}, env) {
  
  // Map meta-tool endpoints to direct MLB API paths
  const endpointMapping = {
    player: {
      apiPath: 'people/{playerId}/stats',
      buildUrl: (q) => {
        const playerId = q.playerId || q.id;
        if (!playerId) throw new Error('Player ID required');
        const params = new URLSearchParams({
          stats: q.stats || 'season',
          group: q.group || 'hitting',
          season: q.season || '2025'
        });
        return `people/${playerId}/stats?${params}`;
      }
    },
    team: {
      apiPath: 'teams/{teamId}',
      buildUrl: (q) => {
        const teamId = q.teamId || q.id;
        if (!teamId) throw new Error('Team ID required');
        const params = new URLSearchParams({ season: q.season || '2025' });
        return `teams/${teamId}?${params}`;
      }
    },
    roster: {
      apiPath: 'teams/{teamId}/roster',
      buildUrl: (q) => {
        const teamId = q.teamId || q.id;
        if (!teamId) throw new Error('Team ID required');
        const params = new URLSearchParams({ season: q.season || '2025' });
        return `teams/${teamId}/roster?${params}`;
      }
    },
    game: {
      apiPath: 'game/{gamePk}/feed/live',
      buildUrl: (q) => {
        const gameId = q.gameId || q.id;
        if (!gameId) throw new Error('Game ID required');
        return `game/${gameId}/feed/live`;
      }
    },
    standings: {
      apiPath: 'standings',
      buildUrl: (q) => {
        const params = new URLSearchParams({ season: q.season || '2025' });
        if (q.divisionId) params.append('divisionId', q.divisionId);
        return `standings?${params}`;
      }
    },
    schedule: {
      apiPath: 'schedule',
      buildUrl: (q) => {
        const params = new URLSearchParams({ sportId: '1' });
        if (q.date) params.append('date', q.date);
        else params.append('date', new Date().toISOString().split('T')[0]);
        if (q.teamId) params.append('teamId', q.teamId);
        return `schedule?${params}`;
      }
    },
    advanced: {
      apiPath: 'people/{playerId}/stats',
      buildUrl: (q) => {
        const playerId = q.playerId || q.id;
        if (!playerId) throw new Error('Player ID required');
        const params = new URLSearchParams({
          stats: 'statSplits',
          group: q.group || 'hitting',
          season: q.season || '2025'
        });
        if (q.situation) params.append('sitCodes', q.situation);
        return `people/${playerId}/stats?${params}`;
      }
    }
  };
  
  const mapping = endpointMapping[endpoint];
  if (!mapping) {
    throw new Error(`Unknown endpoint: ${endpoint}. Available: ${Object.keys(endpointMapping).join(', ')}`);
  }
  
  // Use intelligent entity resolution for missing IDs
  if (endpoint === 'team' && !query.teamId && !query.id && query.name) {
    const teamInfo = resolveTeam(query.name);
    if (teamInfo) {
      query.teamId = teamInfo.id;
    } else {
      throw new Error(`Team "${query.name}" not found`);
    }
  }
  
  if (endpoint === 'player' && !query.playerId && !query.id && query.name) {
    const playerInfo = resolvePlayer(query.name);
    if (playerInfo) {
      query.playerId = playerInfo.id;
    } else {
      throw new Error(`Player "${query.name}" not found`);
    }
  }
  
  // Build direct MLB API URL
  const mlbApiUrl = `https://statsapi.mlb.com/api/v1/${mapping.buildUrl(query)}`;
  
  // Call MLB API directly
  const response = await fetch(mlbApiUrl, {
    headers: {
      'User-Agent': 'Baseball-Stats-MCP/3.0',
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    endpoint: endpoint,
    query: query,
    data: data,
    meta: {
      service: 'baseball-stats-mcp',
      timestamp: new Date().toISOString(),
      mlb_api_url: mlbApiUrl,
      resolved_entities: query.teamId || query.playerId ? true : false
    }
  };
}

/**
 * Resolve team name to team info
 */
function resolveTeam(teamName) {
  const normalizedName = teamName.toLowerCase().trim();
  return MLB_TEAMS[normalizedName] || null;
}

/**
 * Resolve player name to player info  
 */
function resolvePlayer(playerName) {
  const normalizedName = playerName.toLowerCase().trim();
  return MLB_PLAYERS[normalizedName] || null;
}