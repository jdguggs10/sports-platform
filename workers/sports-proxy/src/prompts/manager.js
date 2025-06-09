/**
 * Prompt Management System for Sports Proxy
 * Handles dynamic prompt loading and sport-specific context injection
 */

class PromptManager {
  constructor(env) {
    this.env = env;
    this.promptCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get sport-specific prompt with caching
   */
  async getSportPrompt(sport) {
    const cacheKey = `prompt_${sport}`;
    const cached = this.promptCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.content;
    }

    try {
      // Load from R2 or default prompts
      const promptContent = await this.loadPromptFromStorage(sport);
      
      this.promptCache.set(cacheKey, {
        content: promptContent,
        timestamp: Date.now()
      });
      
      return promptContent;
    } catch (error) {
      console.error(`Failed to load prompt for ${sport}:`, error);
      return this.getDefaultPrompt(sport);
    }
  }

  /**
   * Load prompt from R2 storage
   */
  async loadPromptFromStorage(sport) {
    if (!this.env.SPORTS_PROMPTS_BUCKET) {
      return this.getDefaultPrompt(sport);
    }

    try {
      const object = await this.env.SPORTS_PROMPTS_BUCKET.get(`${sport}.txt`);
      if (object) {
        return await object.text();
      }
    } catch (error) {
      console.error(`R2 prompt load failed for ${sport}:`, error);
    }
    
    return this.getDefaultPrompt(sport);
  }

  /**
   * Get default prompts for sports
   */
  getDefaultPrompt(sport) {
    const prompts = {
      baseball: `You are a baseball expert assistant. Provide accurate, up-to-date information about MLB teams, players, statistics, and games. When users ask about teams, players, or statistics, use the available tools to get the most current data. Be concise but informative in your responses.

Key focus areas:
- Team information and rosters
- Player statistics and performance
- Game results and schedules
- League standings
- Fantasy baseball insights`,

      hockey: `You are a hockey expert assistant. Provide accurate, up-to-date information about NHL teams, players, statistics, and games. When users ask about teams, players, or statistics, use the available tools to get the most current data. Be concise but informative in your responses.

Key focus areas:
- Team information and rosters
- Player statistics and performance
- Game results and schedules
- League standings
- Fantasy hockey insights`,

      football: `You are a football expert assistant. Provide accurate, up-to-date information about NFL teams, players, statistics, and games. When users ask about teams, players, or statistics, use the available tools to get the most current data. Be concise but informative in your responses.

Key focus areas:
- Team information and rosters
- Player statistics and performance
- Game results and schedules
- League standings
- Fantasy football insights`,

      general: `You are a sports expert assistant with access to multiple sports databases. Provide accurate, up-to-date information about teams, players, statistics, and games across various sports. When users ask questions, determine the appropriate sport context and use the available tools to get current data.

Available sports:
- Baseball (MLB)
- Hockey (NHL)
- Football (NFL)

Be helpful, concise, and always use the most current data available through the tools.`
    };

    return prompts[sport] || prompts.general;
  }

  /**
   * Inject context into prompts
   */
  injectContext(prompt, context) {
    const { userId, sessionId, sport, userPreferences = {} } = context;
    
    let enhancedPrompt = prompt;
    
    // Add user context
    if (userId) {
      enhancedPrompt += `\n\nUser ID: ${userId}`;
    }
    
    // Add sport context
    if (sport) {
      enhancedPrompt += `\nCurrent sport focus: ${sport}`;
    }
    
    // Add user preferences
    if (userPreferences.preferredTeams) {
      enhancedPrompt += `\nUser's preferred teams: ${userPreferences.preferredTeams.join(', ')}`;
    }
    
    if (userPreferences.fantasyLeagues) {
      enhancedPrompt += `\nUser has fantasy leagues in: ${userPreferences.fantasyLeagues.join(', ')}`;
    }
    
    return enhancedPrompt;
  }

  /**
   * Generate system message for OpenAI
   */
  async generateSystemMessage(sport, context = {}) {
    const basePrompt = await this.getSportPrompt(sport);
    const enhancedPrompt = this.injectContext(basePrompt, context);
    
    return {
      role: 'system',
      content: enhancedPrompt
    };
  }

  /**
   * Update prompt in storage
   */
  async updatePrompt(sport, content) {
    if (!this.env.SPORTS_PROMPTS_BUCKET) {
      throw new Error('Prompts bucket not configured');
    }

    try {
      await this.env.SPORTS_PROMPTS_BUCKET.put(`${sport}.txt`, content, {
        httpMetadata: {
          contentType: 'text/plain',
        },
        customMetadata: {
          updatedAt: new Date().toISOString(),
          sport: sport
        }
      });
      
      // Clear cache
      this.promptCache.delete(`prompt_${sport}`);
      
      return true;
    } catch (error) {
      console.error(`Failed to update prompt for ${sport}:`, error);
      throw error;
    }
  }

  /**
   * List available prompts
   */
  async listPrompts() {
    if (!this.env.SPORTS_PROMPTS_BUCKET) {
      return Object.keys(this.getDefaultPrompt()).filter(k => k !== 'general');
    }

    try {
      const objects = await this.env.SPORTS_PROMPTS_BUCKET.list();
      return objects.objects.map(obj => obj.key.replace('.txt', ''));
    } catch (error) {
      console.error('Failed to list prompts:', error);
      return ['baseball', 'hockey', 'football'];
    }
  }

  /**
   * Clear prompt cache
   */
  clearCache() {
    this.promptCache.clear();
  }
}

module.exports = { PromptManager };