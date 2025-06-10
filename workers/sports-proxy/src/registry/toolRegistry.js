/**
 * Dynamic Tool Registry - Fetches and caches tool schemas from MCP services
 * Implements API Gateway fan-out pattern for tool discovery
 */

class ToolRegistry {
  constructor(env, cacheManager) {
    this.env = env;
    this.cacheManager = cacheManager;
    this.mcpServices = {
      baseball: env.MLB_MCP,
      hockey: env.HOCKEY_MCP,
      espn: env.ESPN_MCP
    };
    this.toolSchemas = new Map(); // In-memory cache for current request
    this.lastRefresh = 0;
    this.REFRESH_INTERVAL = 300000; // 5 minutes
  }

  /**
   * Initialize tool registry at startup - fetch all MCP tool schemas
   */
  async initialize() {
    console.log('ToolRegistry: Initializing tool discovery...');
    await this.refreshAllSchemas();
  }

  /**
   * Get tools for a specific sport, with auto-refresh if stale
   */
  async getToolsForSport(sport) {
    // Check if refresh needed
    const now = Date.now();
    if (now - this.lastRefresh > this.REFRESH_INTERVAL) {
      await this.refreshAllSchemas();
    }

    // Normalize sport name
    const normalizedSport = this.normalizeSportName(sport);
    
    // Get from cache or return empty array
    return this.toolSchemas.get(normalizedSport) || [];
  }

  /**
   * Get all available tools across all sports
   */
  async getAllTools() {
    const now = Date.now();
    if (now - this.lastRefresh > this.REFRESH_INTERVAL) {
      await this.refreshAllSchemas();
    }

    const allTools = {};
    for (const [sport, tools] of this.toolSchemas.entries()) {
      allTools[sport] = tools;
    }
    return allTools;
  }

  /**
   * Refresh schemas from all MCP services
   */
  async refreshAllSchemas() {
    const refreshPromises = [];
    
    for (const [sportName, service] of Object.entries(this.mcpServices)) {
      if (service) {
        refreshPromises.push(this.fetchSchemaFromMCP(sportName, service));
      }
    }

    const results = await Promise.allSettled(refreshPromises);
    
    // Log results
    results.forEach((result, index) => {
      const sportName = Object.keys(this.mcpServices)[index];
      if (result.status === 'fulfilled') {
        console.log(`ToolRegistry: Successfully loaded ${result.value.length} tools for ${sportName}`);
      } else {
        console.error(`ToolRegistry: Failed to load tools for ${sportName}:`, result.reason);
      }
    });

    this.lastRefresh = Date.now();
  }

  /**
   * Fetch tool schema from a specific MCP service
   */
  async fetchSchemaFromMCP(sportName, service) {
    try {
      // Try cache first (KV storage for longer persistence)
      const cacheKey = `tool_schema_${sportName}`;
      const cached = await this.env.SPORTS_CACHE.get(cacheKey);
      
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const age = Date.now() - parsedCache.timestamp;
        
        // Use cached if less than 5 minutes old
        if (age < this.REFRESH_INTERVAL) {
          this.toolSchemas.set(sportName, parsedCache.tools);
          return parsedCache.tools;
        }
      }

      // Fetch fresh schema
      const request = new Request('https://mcp-internal/openai-tools.json', {
        method: 'GET'
      });

      const response = await service.fetch(request);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const tools = await response.json();
      
      // Validate schema format
      if (!Array.isArray(tools)) {
        throw new Error('Invalid schema format: expected array of tools');
      }

      // Enhance tools with sport metadata
      const enhancedTools = tools.map(tool => ({
        ...tool,
        _meta: {
          sport: sportName,
          source: `${sportName}-stats-mcp`,
          fetched_at: new Date().toISOString()
        }
      }));

      // Cache in memory and KV
      this.toolSchemas.set(sportName, enhancedTools);
      
      await this.env.SPORTS_CACHE.put(cacheKey, JSON.stringify({
        tools: enhancedTools,
        timestamp: Date.now()
      }), { expirationTtl: this.REFRESH_INTERVAL / 1000 });

      return enhancedTools;

    } catch (error) {
      console.error(`ToolRegistry: Error fetching schema from ${sportName} MCP:`, error);
      
      // Try to use stale cached data if available
      const staleCache = await this.env.SPORTS_CACHE.get(`tool_schema_${sportName}`);
      if (staleCache) {
        const parsedStale = JSON.parse(staleCache);
        this.toolSchemas.set(sportName, parsedStale.tools);
        console.log(`ToolRegistry: Using stale cache for ${sportName}`);
        return parsedStale.tools;
      }

      // Return empty array if no cache available
      this.toolSchemas.set(sportName, []);
      return [];
    }
  }

  /**
   * Get health status of tool registry
   */
  async getHealthStatus() {
    const status = {
      last_refresh: new Date(this.lastRefresh).toISOString(),
      refresh_interval_ms: this.REFRESH_INTERVAL,
      sports: {}
    };

    for (const [sport, tools] of this.toolSchemas.entries()) {
      status.sports[sport] = {
        tool_count: tools.length,
        available: tools.length > 0,
        tools: tools.map(t => t.function?.name).filter(Boolean)
      };
    }

    return status;
  }

  /**
   * Force refresh of a specific sport's tools
   */
  async refreshSport(sport) {
    const normalizedSport = this.normalizeSportName(sport);
    const service = this.mcpServices[normalizedSport];
    
    if (!service) {
      throw new Error(`No MCP service available for sport: ${sport}`);
    }

    return await this.fetchSchemaFromMCP(normalizedSport, service);
  }

  /**
   * Normalize sport names for consistency
   */
  normalizeSportName(sport) {
    const normalizations = {
      'mlb': 'baseball',
      'nhl': 'hockey', 
      'nfl': 'football',
      'nba': 'basketball',
      'baseball': 'baseball',
      'hockey': 'hockey',
      'football': 'football', 
      'basketball': 'basketball',
      'sport-null': 'sport-null'
    };

    return normalizations[sport?.toLowerCase()] || 'sport-null';
  }

  /**
   * Search tools by name or description
   */
  async searchTools(query, sport = null) {
    const searchIn = sport ? 
      { [sport]: await this.getToolsForSport(sport) } : 
      await this.getAllTools();

    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [sportName, tools] of Object.entries(searchIn)) {
      for (const tool of tools) {
        const toolName = tool.function?.name || '';
        const toolDesc = tool.function?.description || '';
        
        if (toolName.toLowerCase().includes(lowerQuery) || 
            toolDesc.toLowerCase().includes(lowerQuery)) {
          results.push({
            ...tool,
            _match: {
              sport: sportName,
              name_match: toolName.toLowerCase().includes(lowerQuery),
              desc_match: toolDesc.toLowerCase().includes(lowerQuery)
            }
          });
        }
      }
    }

    return results;
  }
}

module.exports = { ToolRegistry };