/**
 * Hockey Entity Resolver MCP Worker
 * 
 * Lightweight LLM resolver for hockey player and team naming discrepancies.
 * Resolves fuzzy entity names to canonical IDs for MCP tool calls.
 * 
 * Features:
 * - NHL team name resolution with aliases
 * - Player name resolution with nicknames
 * - Fuzzy matching with confidence scores
 * - OpenAI-compatible tool schemas
 * - Database-backed entity resolution
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
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      
      // Health check
      if (url.pathname === '/health') {
        return handleHealthCheck(env);
      }
      
      // OpenAI Tools Schema Endpoint
      if (url.pathname === '/openai-tools.json') {
        return new Response(JSON.stringify(getOpenAIToolSchemas()), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Main resolver endpoints
      if (request.method === 'POST') {
        const body = await request.json();
        
        switch (url.pathname) {
          case '/resolve/team':
            return handleTeamResolution(body, env);
          
          case '/resolve/player':
            return handlePlayerResolution(body, env);
          
          case '/resolve/batch':
            return handleBatchResolution(body, env);
          
          case '/search/teams':
            return handleTeamSearch(body, env);
          
          case '/search/players':
            return handlePlayerSearch(body, env);
          
          default:
            return jsonResponse({ error: 'Unknown endpoint' }, 404);
        }
      }
      
      return new Response('Hockey Entity Resolver MCP v1.0', {
        headers: { "Content-Type": "text/plain" }
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: error.message,
        service: 'hockey-resolver-mcp'
      }, 500);
    }
  }
};

/**
 * Health check with database connectivity test
 */
async function handleHealthCheck(env) {
  try {
    // Test database connection
    const teamCount = await env.HOCKEY_DB.prepare(
      'SELECT COUNT(*) as count FROM teams'
    ).first();
    
    const playerCount = await env.HOCKEY_DB.prepare(
      'SELECT COUNT(*) as count FROM players WHERE active = TRUE'
    ).first();

    return jsonResponse({
      service: 'hockey-resolver-mcp',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        connected: true,
        teams: teamCount?.count || 0,
        active_players: playerCount?.count || 0
      },
      endpoints: [
        '/resolve/team',
        '/resolve/player', 
        '/resolve/batch',
        '/search/teams',
        '/search/players'
      ]
    });
  } catch (error) {
    return jsonResponse({
      service: 'hockey-resolver-mcp',
      status: 'unhealthy',
      error: error.message
    }, 500);
  }
}

/**
 * Resolve team name to canonical team information
 */
async function handleTeamResolution(body, env) {
  try {
    const { name, fuzzy = true, includeStats = false } = body;
    
    if (!name) {
      return jsonResponse({ error: 'Team name is required' }, 400);
    }

    const result = await resolveTeam(name, env, { fuzzy, includeStats });
    
    if (!result) {
      return jsonResponse({
        resolved: false,
        query: name,
        suggestions: await getTeamSuggestions(name, env)
      });
    }

    return jsonResponse({
      resolved: true,
      query: name,
      team: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Team resolution error:', error);
    return jsonResponse({ error: 'Team resolution failed' }, 500);
  }
}

/**
 * Resolve player name to canonical player information
 */
async function handlePlayerResolution(body, env) {
  try {
    const { name, team, fuzzy = true, includeStats = false } = body;
    
    if (!name) {
      return jsonResponse({ error: 'Player name is required' }, 400);
    }

    const result = await resolvePlayer(name, env, { team, fuzzy, includeStats });
    
    if (!result) {
      return jsonResponse({
        resolved: false,
        query: name,
        suggestions: await getPlayerSuggestions(name, env, { team })
      });
    }

    return jsonResponse({
      resolved: true,
      query: name,
      player: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Player resolution error:', error);
    return jsonResponse({ error: 'Player resolution failed' }, 500);
  }
}

/**
 * Batch resolution for multiple entities
 */
async function handleBatchResolution(body, env) {
  try {
    const { entities, options = {} } = body;
    
    if (!entities || !Array.isArray(entities)) {
      return jsonResponse({ error: 'Entities array is required' }, 400);
    }

    const results = await Promise.all(
      entities.map(async (entity) => {
        if (entity.type === 'team') {
          const resolved = await resolveTeam(entity.name, env, options);
          return {
            query: entity.name,
            type: 'team',
            resolved: !!resolved,
            result: resolved
          };
        } else if (entity.type === 'player') {
          const resolved = await resolvePlayer(entity.name, env, { ...options, team: entity.team });
          return {
            query: entity.name,
            type: 'player',
            resolved: !!resolved,
            result: resolved
          };
        }
        return {
          query: entity.name,
          type: entity.type,
          resolved: false,
          error: 'Unknown entity type'
        };
      })
    );

    return jsonResponse({
      batch_results: results,
      total: entities.length,
      resolved: results.filter(r => r.resolved).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch resolution error:', error);
    return jsonResponse({ error: 'Batch resolution failed' }, 500);
  }
}

/**
 * Search teams with filtering
 */
async function handleTeamSearch(body, env) {
  try {
    const { query, division, conference, limit = 10 } = body;
    
    let sql = `
      SELECT t.*, COUNT(ta.alias) as alias_count
      FROM teams t
      LEFT JOIN team_aliases ta ON t.id = ta.team_id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ` AND (t.name LIKE ? OR t.city LIKE ? OR t.abbreviation LIKE ?)`;
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (division) {
      sql += ` AND t.division = ?`;
      params.push(division);
    }

    if (conference) {
      sql += ` AND t.conference = ?`;
      params.push(conference);
    }

    sql += ` GROUP BY t.id ORDER BY t.name LIMIT ?`;
    params.push(limit);

    const teams = await env.HOCKEY_DB.prepare(sql).bind(...params).all();

    return jsonResponse({
      teams: teams.results || [],
      total: teams.results?.length || 0,
      query,
      filters: { division, conference },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Team search error:', error);
    return jsonResponse({ error: 'Team search failed' }, 500);
  }
}

/**
 * Search players with filtering
 */
async function handlePlayerSearch(body, env) {
  try {
    const { query, team, position, active = true, limit = 10 } = body;
    
    let sql = `
      SELECT p.*, t.name as team_name, t.abbreviation as team_abbr,
             COUNT(pa.alias) as alias_count
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN player_aliases pa ON p.id = pa.player_id
      WHERE 1=1
    `;
    const params = [];

    if (active !== null) {
      sql += ` AND p.active = ?`;
      params.push(active);
    }

    if (query) {
      sql += ` AND (p.name LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ?)`;
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (team) {
      sql += ` AND (t.name LIKE ? OR t.abbreviation = ? OR t.city LIKE ?)`;
      params.push(`%${team}%`, team.toUpperCase(), `%${team}%`);
    }

    if (position) {
      sql += ` AND p.position = ?`;
      params.push(position.toUpperCase());
    }

    sql += ` GROUP BY p.id ORDER BY p.name LIMIT ?`;
    params.push(limit);

    const players = await env.HOCKEY_DB.prepare(sql).bind(...params).all();

    return jsonResponse({
      players: players.results || [],
      total: players.results?.length || 0,
      query,
      filters: { team, position, active },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Player search error:', error);
    return jsonResponse({ error: 'Player search failed' }, 500);
  }
}

/**
 * Core team resolution logic
 */
async function resolveTeam(name, env, options = {}) {
  try {
    const normalizedName = name.toLowerCase().trim();
    
    // Try exact match first
    let team = await env.HOCKEY_DB.prepare(`
      SELECT t.*, 'exact' as match_type, 1.0 as confidence
      FROM teams t
      WHERE LOWER(t.name) = ? OR LOWER(t.abbreviation) = ? OR LOWER(t.city) = ?
    `).bind(normalizedName, normalizedName.toUpperCase(), normalizedName).first();

    // Try alias match
    if (!team) {
      team = await env.HOCKEY_DB.prepare(`
        SELECT t.*, ta.alias_type as match_type, 0.9 as confidence
        FROM teams t
        JOIN team_aliases ta ON t.id = ta.team_id
        WHERE LOWER(ta.alias) = ?
      `).bind(normalizedName).first();
    }

    // Try fuzzy match if enabled
    if (!team && options.fuzzy) {
      team = await env.HOCKEY_DB.prepare(`
        SELECT t.*, 'fuzzy' as match_type, 0.7 as confidence
        FROM teams t
        WHERE LOWER(t.name) LIKE ? OR LOWER(t.city) LIKE ?
        ORDER BY 
          CASE 
            WHEN LOWER(t.name) LIKE ? THEN 1
            WHEN LOWER(t.city) LIKE ? THEN 2
            ELSE 3
          END
        LIMIT 1
      `).bind(`%${normalizedName}%`, `%${normalizedName}%`, `${normalizedName}%`, `${normalizedName}%`).first();
    }

    if (!team) return null;

    // Add aliases
    const aliases = await env.HOCKEY_DB.prepare(`
      SELECT alias, alias_type FROM team_aliases WHERE team_id = ?
    `).bind(team.id).all();

    team.aliases = aliases.results || [];

    // Add stats if requested
    if (options.includeStats) {
      const stats = await env.HOCKEY_DB.prepare(`
        SELECT 
          COUNT(*) as total_players,
          COUNT(CASE WHEN active = TRUE THEN 1 END) as active_players
        FROM players WHERE team_id = ?
      `).bind(team.id).first();
      
      team.roster_stats = stats;
    }

    return team;

  } catch (error) {
    console.error('Team resolution error:', error);
    return null;
  }
}

/**
 * Core player resolution logic
 */
async function resolvePlayer(name, env, options = {}) {
  try {
    const normalizedName = name.toLowerCase().trim();
    
    let sql = `
      SELECT p.*, t.name as team_name, t.abbreviation as team_abbr,
             'exact' as match_type, 1.0 as confidence
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE LOWER(p.name) = ? OR (LOWER(p.first_name) = ? AND LOWER(p.last_name) = ?)
    `;
    let params = [normalizedName];
    
    // Handle first/last name split
    const nameParts = normalizedName.split(' ');
    if (nameParts.length >= 2) {
      params.push(nameParts[0], nameParts.slice(1).join(' '));
    } else {
      params.push(normalizedName, normalizedName);
    }

    // Add team filter if provided
    if (options.team) {
      sql += ` AND (LOWER(t.name) LIKE ? OR LOWER(t.abbreviation) = ? OR LOWER(t.city) LIKE ?)`;
      const teamPattern = `%${options.team.toLowerCase()}%`;
      params.push(teamPattern, options.team.toUpperCase(), teamPattern);
    }

    let player = await env.HOCKEY_DB.prepare(sql).bind(...params).first();

    // Try alias match
    if (!player) {
      sql = `
        SELECT p.*, t.name as team_name, t.abbreviation as team_abbr,
               pa.alias_type as match_type, 0.9 as confidence
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        JOIN player_aliases pa ON p.id = pa.player_id
        WHERE LOWER(pa.alias) = ?
      `;
      params = [normalizedName];

      if (options.team) {
        sql += ` AND (LOWER(t.name) LIKE ? OR LOWER(t.abbreviation) = ? OR LOWER(t.city) LIKE ?)`;
        const teamPattern = `%${options.team.toLowerCase()}%`;
        params.push(teamPattern, options.team.toUpperCase(), teamPattern);
      }

      player = await env.HOCKEY_DB.prepare(sql).bind(...params).first();
    }

    // Try fuzzy match if enabled
    if (!player && options.fuzzy) {
      sql = `
        SELECT p.*, t.name as team_name, t.abbreviation as team_abbr,
               'fuzzy' as match_type, 0.7 as confidence
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE LOWER(p.name) LIKE ? OR LOWER(p.last_name) LIKE ?
      `;
      params = [`%${normalizedName}%`, `%${normalizedName}%`];

      if (options.team) {
        sql += ` AND (LOWER(t.name) LIKE ? OR LOWER(t.abbreviation) = ? OR LOWER(t.city) LIKE ?)`;
        const teamPattern = `%${options.team.toLowerCase()}%`;
        params.push(teamPattern, options.team.toUpperCase(), teamPattern);
      }

      sql += ` ORDER BY 
        CASE 
          WHEN LOWER(p.name) LIKE ? THEN 1
          WHEN LOWER(p.last_name) LIKE ? THEN 2
          ELSE 3
        END
        LIMIT 1
      `;
      params.push(`${normalizedName}%`, `${normalizedName}%`);

      player = await env.HOCKEY_DB.prepare(sql).bind(...params).first();
    }

    if (!player) return null;

    // Add aliases
    const aliases = await env.HOCKEY_DB.prepare(`
      SELECT alias, alias_type FROM player_aliases WHERE player_id = ?
    `).bind(player.id).all();

    player.aliases = aliases.results || [];

    // Add current season stats if requested
    if (options.includeStats) {
      const stats = await env.HOCKEY_DB.prepare(`
        SELECT * FROM player_stats WHERE player_id = ? AND season = '2024-25'
      `).bind(player.id).first();
      
      player.current_stats = stats;
    }

    return player;

  } catch (error) {
    console.error('Player resolution error:', error);
    return null;
  }
}

/**
 * Get team suggestions for failed resolution
 */
async function getTeamSuggestions(name, env, limit = 5) {
  try {
    const suggestions = await env.HOCKEY_DB.prepare(`
      SELECT t.name, t.abbreviation, t.city,
             CASE 
               WHEN LOWER(t.name) LIKE ? THEN 1
               WHEN LOWER(t.city) LIKE ? THEN 2
               WHEN LOWER(t.abbreviation) LIKE ? THEN 3
               ELSE 4
             END as relevance
      FROM teams t
      WHERE LOWER(t.name) LIKE ? OR LOWER(t.city) LIKE ? OR LOWER(t.abbreviation) LIKE ?
      ORDER BY relevance, t.name
      LIMIT ?
    `).bind(
      `%${name.toLowerCase()}%`, `%${name.toLowerCase()}%`, `%${name.toLowerCase()}%`,
      `%${name.toLowerCase()}%`, `%${name.toLowerCase()}%`, `%${name.toLowerCase()}%`,
      limit
    ).all();

    return suggestions.results || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get player suggestions for failed resolution
 */
async function getPlayerSuggestions(name, env, options = {}, limit = 5) {
  try {
    let sql = `
      SELECT p.name, p.position, t.name as team_name, t.abbreviation as team_abbr,
             CASE 
               WHEN LOWER(p.name) LIKE ? THEN 1
               WHEN LOWER(p.last_name) LIKE ? THEN 2
               ELSE 3
             END as relevance
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.active = TRUE AND (LOWER(p.name) LIKE ? OR LOWER(p.last_name) LIKE ?)
    `;
    let params = [
      `%${name.toLowerCase()}%`, `%${name.toLowerCase()}%`,
      `%${name.toLowerCase()}%`, `%${name.toLowerCase()}%`
    ];

    if (options.team) {
      sql += ` AND (LOWER(t.name) LIKE ? OR LOWER(t.abbreviation) = ?)`;
      params.push(`%${options.team.toLowerCase()}%`, options.team.toUpperCase());
    }

    sql += ` ORDER BY relevance, p.name LIMIT ?`;
    params.push(limit);

    const suggestions = await env.HOCKEY_DB.prepare(sql).bind(...params).all();
    return suggestions.results || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get OpenAI-compatible tool schemas
 */
function getOpenAIToolSchemas() {
  return [
    {
      type: "function",
      function: {
        name: "resolve_hockey_team",
        description: "Resolve hockey team name to canonical NHL team information with aliases and statistics",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Team name, city, or abbreviation (e.g., 'Bruins', 'Boston', 'BOS')"
            },
            fuzzy: {
              type: "boolean",
              description: "Enable fuzzy matching for partial names (default: true)"
            },
            includeStats: {
              type: "boolean", 
              description: "Include team roster statistics (default: false)"
            }
          },
          required: ["name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "resolve_hockey_player",
        description: "Resolve hockey player name to canonical NHL player information with aliases and statistics",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Player name or nickname (e.g., 'Connor McDavid', 'McDavid', 'McJesus')"
            },
            team: {
              type: "string",
              description: "Optional team filter to disambiguate common names"
            },
            fuzzy: {
              type: "boolean",
              description: "Enable fuzzy matching for partial names (default: true)"
            },
            includeStats: {
              type: "boolean",
              description: "Include current season statistics (default: false)"
            }
          },
          required: ["name"]
        }
      }
    },
    {
      type: "function", 
      function: {
        name: "search_hockey_teams",
        description: "Search for NHL teams with filters and return multiple results",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for team name, city, or abbreviation"
            },
            division: {
              type: "string",
              description: "Filter by division (e.g., 'Atlantic', 'Metropolitan', 'Central', 'Pacific')"
            },
            conference: {
              type: "string",
              description: "Filter by conference ('Eastern' or 'Western')"
            },
            limit: {
              type: "integer",
              description: "Maximum number of results (default: 10)"
            }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "search_hockey_players", 
        description: "Search for NHL players with filters and return multiple results",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for player name"
            },
            team: {
              type: "string",
              description: "Filter by team name, city, or abbreviation"
            },
            position: {
              type: "string",
              description: "Filter by position (e.g., 'C', 'LW', 'RW', 'D', 'G')"
            },
            active: {
              type: "boolean",
              description: "Filter by active status (default: true)"
            },
            limit: {
              type: "integer",
              description: "Maximum number of results (default: 10)"
            }
          }
        }
      }
    }
  ];
}

/**
 * Helper function to create JSON responses
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    }
  });
}