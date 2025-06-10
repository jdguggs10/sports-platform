/**
 * Baseball Entity Resolver MCP Worker
 * 
 * Lightweight LLM resolver for baseball player and team naming discrepancies.
 * Resolves fuzzy entity names to canonical IDs for MCP tool calls.
 * 
 * Features:
 * - Team name resolution with aliases
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
      
      return new Response('Baseball Entity Resolver MCP v1.0', {
        headers: { "Content-Type": "text/plain" }
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: error.message,
        service: 'baseball-resolver-mcp'
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
    const teamCount = await env.BASEBALL_DB.prepare(
      'SELECT COUNT(*) as count FROM teams'
    ).first();
    
    const playerCount = await env.BASEBALL_DB.prepare(
      'SELECT COUNT(*) as count FROM players WHERE active = TRUE'
    ).first();

    return jsonResponse({
      service: 'baseball-resolver-mcp',
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
      service: 'baseball-resolver-mcp',
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
    const { query, division, league, limit = 10 } = body;
    
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

    if (league) {
      sql += ` AND t.league = ?`;
      params.push(league);
    }

    sql += ` GROUP BY t.id ORDER BY t.name LIMIT ?`;
    params.push(limit);

    const teams = await env.BASEBALL_DB.prepare(sql).bind(...params).all();

    return jsonResponse({
      teams: teams.results || [],
      total: teams.results?.length || 0,
      query,
      filters: { division, league },
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

    const players = await env.BASEBALL_DB.prepare(sql).bind(...params).all();

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
    let team = await env.BASEBALL_DB.prepare(`
      SELECT t.*, 'exact' as match_type, 1.0 as confidence
      FROM teams t
      WHERE LOWER(t.name) = ? OR LOWER(t.abbreviation) = ? OR LOWER(t.city) = ?
    `).bind(normalizedName, normalizedName.toUpperCase(), normalizedName).first();

    // Try alias match
    if (!team) {
      team = await env.BASEBALL_DB.prepare(`
        SELECT t.*, ta.alias_type as match_type, 0.9 as confidence
        FROM teams t
        JOIN team_aliases ta ON t.id = ta.team_id
        WHERE LOWER(ta.alias) = ?
      `).bind(normalizedName).first();
    }

    // Try fuzzy match if enabled
    if (!team && options.fuzzy) {
      team = await env.BASEBALL_DB.prepare(`
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
    const aliases = await env.BASEBALL_DB.prepare(`
      SELECT alias, alias_type FROM team_aliases WHERE team_id = ?
    `).bind(team.id).all();

    team.aliases = aliases.results || [];

    // Add stats if requested
    if (options.includeStats) {
      const stats = await env.BASEBALL_DB.prepare(`
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
    
    const nameParts = normalizedName.split(' ');
    if (nameParts.length >= 2) {
      params.push(nameParts[0], nameParts.slice(1).join(' '));
    } else {
      params.push(normalizedName, normalizedName); // for first_name, last_name check
    }

    let playerTeamFilterSql = '';
    let playerTeamFilterParams = [];

    if (options.team) {
      playerTeamFilterSql = ` AND (LOWER(t.name) LIKE ? OR LOWER(t.abbreviation) = ? OR LOWER(t.city) LIKE ?)`;
      const teamPattern = `%${options.team.toLowerCase()}%`;
      playerTeamFilterParams.push(teamPattern, options.team.toUpperCase(), teamPattern);
    }

    let player = await env.BASEBALL_DB.prepare(sql + playerTeamFilterSql).bind(...params, ...playerTeamFilterParams).first();

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

      player = await env.BASEBALL_DB.prepare(sql + playerTeamFilterSql).bind(...params, ...playerTeamFilterParams).first();
    }

    // Try LLM-assisted fuzzy match if enabled
    let llmResolvedPlayer = null;
    if (!player && options.fuzzy && env.SPORTS_PROXY_URL) { // Check if SPORTS_PROXY_URL is configured
      try {
        const preliminaryCandidates = await getPlayerSuggestions(name, env, { team: options.team, limit: 3 });
        let llmInputPrompt = `You are an expert baseball entity resolver.
The user is searching for a player with the name: "${name}".`;
        if (options.team) {
          llmInputPrompt += ` They provided team context: "${options.team}".`;
        }
        llmInputPrompt += `
Based on our database, here are some potential matches:
${JSON.stringify(preliminaryCandidates.map(p => p.name))}

Please analyze this information and determine the most likely correct player.
Respond ONLY with a JSON object with the following fields:
- "resolved_name": The canonical name of the most likely player from the provided list, or your best educated guess if the list is insufficient but you are confident. If no good match, set to null.
- "confidence": A float score between 0.0 (no confidence) and 1.0 (very high confidence).
- "reasoning": A brief explanation for your choice.

JSON response:`;

        const llmServiceResponse = await fetch('https://sports-proxy.gerrygugger.workers.dev/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${env.LLM_SERVICE_API_KEY}` // If auth is needed
          },
          body: JSON.stringify({
            model: "gpt-4.1-nano",
            input: llmInputPrompt,
            instructions: "You are an expert sports entity resolver. Follow the format requirements exactly.",
            temperature: 0.1,
            max_completion_tokens: 200,
            stream: false
          }),
        });

        if (llmServiceResponse.ok) {
          const llmResponseData = await llmServiceResponse.json();
          // Use Responses API format: output_text instead of choices[0].message.content
          if (llmResponseData.output_text) {
            try {
              const llmOutput = JSON.parse(llmResponseData.output_text);
              if (llmOutput.resolved_name && llmOutput.confidence > 0.75) { // Confidence threshold
                const dbCheckSql = `
                  SELECT p.*, t.name as team_name, t.abbreviation as team_abbr
                  FROM players p LEFT JOIN teams t ON p.team_id = t.id
                  WHERE LOWER(p.name) = ?
                `;
                const finalPlayerRecord = await env.BASEBALL_DB.prepare(dbCheckSql + playerTeamFilterSql) // ensure team filter applies if context was used
                    .bind(llmOutput.resolved_name.toLowerCase(), ...playerTeamFilterParams)
                    .first();

                if (finalPlayerRecord) {
                  llmResolvedPlayer = {
                    ...finalPlayerRecord,
                    match_type: 'llm_assisted_fuzzy',
                    confidence: llmOutput.confidence,
                    llm_reasoning: llmOutput.reasoning
                  };
                }
              }
            } catch (parseError) {
              console.error('Error parsing LLM JSON response:', parseError);
            }
          }
        } else {
          console.error(`LLM service error: ${llmServiceResponse.status} ${await llmServiceResponse.text()}`);
        }
      } catch (error) {
        console.error('Error calling LLM service or processing response:', error);
      }
    }

    if (llmResolvedPlayer) {
      player = llmResolvedPlayer;
    } else if (!player && options.fuzzy) {
      // Fallback to original SQL fuzzy match if LLM didn't resolve or wasn't called
      sql = `
        SELECT p.*, t.name as team_name, t.abbreviation as team_abbr,
               'fuzzy_sql' as match_type, 0.7 as confidence
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE (LOWER(p.name) LIKE ? OR LOWER(p.last_name) LIKE ?)
      `;
      params = [`%${normalizedName}%`, `%${normalizedName}%`];

      let fuzzyOrderSql = ` ORDER BY 
        CASE 
          WHEN LOWER(p.name) LIKE ? THEN 1
          WHEN LOWER(p.last_name) LIKE ? THEN 2
          ELSE 3
        END
        LIMIT 1
      `;
      let fuzzyOrderParams = [`${normalizedName}%`, `${normalizedName}%`];
      
      player = await env.BASEBALL_DB.prepare(sql + playerTeamFilterSql + fuzzyOrderSql)
          .bind(...params, ...playerTeamFilterParams, ...fuzzyOrderParams)
          .first();
    }

    if (!player) return null;

    // Add aliases
    const aliases = await env.BASEBALL_DB.prepare(`
      SELECT alias, alias_type FROM player_aliases WHERE player_id = ?
    `).bind(player.id).all();

    player.aliases = aliases.results || [];

    // Add current season stats if requested
    if (options.includeStats) {
      const stats = await env.BASEBALL_DB.prepare(`
        SELECT * FROM player_stats WHERE player_id = ? AND season = 2025
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
    const suggestions = await env.BASEBALL_DB.prepare(`
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

    const suggestions = await env.BASEBALL_DB.prepare(sql).bind(...params).all();
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
        name: "resolve_baseball_team",
        description: "Resolve baseball team name to canonical team information with aliases and statistics",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Team name, city, or abbreviation (e.g., 'Yankees', 'New York', 'NYY')"
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
        name: "resolve_baseball_player",
        description: "Resolve baseball player name to canonical player information with aliases and statistics",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Player name or nickname (e.g., 'Aaron Judge', 'Judge', 'Shohei Ohtani')"
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
        name: "search_baseball_teams",
        description: "Search for baseball teams with filters and return multiple results",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for team name, city, or abbreviation"
            },
            division: {
              type: "string",
              description: "Filter by division (e.g., 'AL East', 'NL West')"
            },
            league: {
              type: "string",
              description: "Filter by league ('AL' or 'NL')"
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
        name: "search_baseball_players", 
        description: "Search for baseball players with filters and return multiple results",
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
              description: "Filter by position (e.g., 'P', 'C', '1B', 'OF')"
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