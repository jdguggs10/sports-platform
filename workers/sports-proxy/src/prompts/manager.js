/**
 * Enhanced Prompt Management System for Sports Proxy
 * Handles dynamic prompt loading, sport-specific context injection, and user memory management
 * Integrated with OpenAI Responses API for optimal conversation flow
 */

// Import modular prompt system
import { getPrompt, getDefaultPrompt as getModularPrompt } from './index.js';

class PromptManager {
  constructor(env) {
    this.env = env;
    this.promptCache = new Map();
    this.userMemoryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.userMemoryTimeout = 30 * 60 * 1000; // 30 minutes for user memory
    this.maxUserMemorySize = 5000; // Max characters for user memory
  }

  /**
   * Get layered prompt system for Responses API
   * Combines general + sport-specific + user memory prompts
   */
  async getLayeredInstructions(sport, context = {}) {
    const { userId, includeUserMemory = true, conversationType = 'general' } = context;
    
    try {
      // Layer 1: General base prompt
      const generalPrompt = await this.getGeneralPrompt();
      
      // Layer 2: Sport-specific prompt
      const sportPrompt = await this.getSportPrompt(sport);
      
      // Layer 3: User memory (if available and requested)
      let userMemoryPrompt = '';
      if (includeUserMemory && userId) {
        userMemoryPrompt = await this.getUserMemoryPrompt(userId);
      }
      
      // Combine layers with proper formatting for Responses API
      const instructions = this.combinePromptLayers(
        generalPrompt,
        sportPrompt,
        userMemoryPrompt,
        conversationType,
        context
      );
      
      return instructions;
    } catch (error) {
      console.error('Failed to build layered instructions:', error);
      return this.getFallbackInstructions(sport);
    }
  }

  /**
   * Get general base prompt for all interactions
   */
  async getGeneralPrompt() {
    const cacheKey = 'prompt_general';
    const cached = this.promptCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.content;
    }

    try {
      const promptContent = await this.loadPromptFromStorage('general');
      
      this.promptCache.set(cacheKey, {
        content: promptContent,
        timestamp: Date.now()
      });
      
      return promptContent;
    } catch (error) {
      console.error('Failed to load general prompt:', error);
      return this.getDefaultPrompt('general');
    }
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
   * Get or create user-specific memory prompt
   */
  async getUserMemoryPrompt(userId) {
    const cacheKey = `user_memory_${userId}`;
    const cached = this.userMemoryCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.userMemoryTimeout) {
      return cached.content;
    }

    try {
      const memoryContent = await this.loadUserMemoryFromStorage(userId);
      
      this.userMemoryCache.set(cacheKey, {
        content: memoryContent,
        timestamp: Date.now()
      });
      
      return memoryContent;
    } catch (error) {
      console.error(`Failed to load user memory for ${userId}:`, error);
      return '';
    }
  }

  /**
   * Load user memory from storage (KV or D1)
   */
  async loadUserMemoryFromStorage(userId) {
    if (!this.env.USER_MEMORY_KV && !this.env.SPORTS_DB) {
      return '';
    }

    try {
      // Try KV first (faster)
      if (this.env.USER_MEMORY_KV) {
        const memory = await this.env.USER_MEMORY_KV.get(`user_memory_${userId}`);
        if (memory) {
          const parsed = JSON.parse(memory);
          return this.formatUserMemory(parsed);
        }
      }

      // Fallback to D1 database
      if (this.env.SPORTS_DB) {
        const result = await this.env.SPORTS_DB.prepare(
          'SELECT memory_data, last_updated FROM user_memories WHERE user_id = ? ORDER BY last_updated DESC LIMIT 1'
        ).bind(userId).first();
        
        if (result) {
          const memoryData = JSON.parse(result.memory_data);
          return this.formatUserMemory(memoryData);
        }
      }
    } catch (error) {
      console.error(`Failed to load user memory from storage for ${userId}:`, error);
    }

    return '';
  }

  /**
   * Format user memory data into prompt text
   */
  formatUserMemory(memoryData) {
    if (!memoryData || Object.keys(memoryData).length === 0) {
      return '';
    }

    let memoryPrompt = '\n\n--- USER CONTEXT & PREFERENCES ---\n';

    // User preferences
    if (memoryData.preferences) {
      if (memoryData.preferences.favoriteTeams?.length > 0) {
        memoryPrompt += `Favorite teams: ${memoryData.preferences.favoriteTeams.join(', ')}\n`;
      }
      if (memoryData.preferences.favoritePlayers?.length > 0) {
        memoryPrompt += `Favorite players: ${memoryData.preferences.favoritePlayers.join(', ')}\n`;
      }
      if (memoryData.preferences.fantasyLeagues?.length > 0) {
        memoryPrompt += `Fantasy leagues: ${memoryData.preferences.fantasyLeagues.join(', ')}\n`;
      }
      if (memoryData.preferences.sportsInterests?.length > 0) {
        memoryPrompt += `Sports interests: ${memoryData.preferences.sportsInterests.join(', ')}\n`;
      }
    }

    // Recent interaction patterns
    if (memoryData.patterns) {
      if (memoryData.patterns.commonQueries?.length > 0) {
        memoryPrompt += `Common question types: ${memoryData.patterns.commonQueries.slice(0, 3).join(', ')}\n`;
      }
      if (memoryData.patterns.preferredResponseStyle) {
        memoryPrompt += `Preferred response style: ${memoryData.patterns.preferredResponseStyle}\n`;
      }
    }

    // Important facts about user
    if (memoryData.facts?.length > 0) {
      memoryPrompt += `Important context: ${memoryData.facts.slice(0, 5).join('; ')}\n`;
    }

    memoryPrompt += '--- END USER CONTEXT ---\n';

    // Truncate if too long
    if (memoryPrompt.length > this.maxUserMemorySize) {
      memoryPrompt = memoryPrompt.substring(0, this.maxUserMemorySize) + '...\n--- END USER CONTEXT ---\n';
    }

    return memoryPrompt;
  }

  /**
   * Update user memory based on conversation
   */
  async updateUserMemory(userId, conversationData) {
    try {
      const currentMemory = await this.loadUserMemoryFromStorage(userId);
      const currentData = currentMemory ? this.parseUserMemory(currentMemory) : {};
      
      // Extract insights from conversation
      const newInsights = this.extractMemoryInsights(conversationData);
      
      // Merge with existing memory
      const updatedMemory = this.mergeMemoryData(currentData, newInsights);
      
      // Save to storage
      await this.saveUserMemoryToStorage(userId, updatedMemory);
      
      // Clear cache to force refresh
      this.userMemoryCache.delete(`user_memory_${userId}`);
      
      return true;
    } catch (error) {
      console.error(`Failed to update user memory for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Extract memory insights from conversation data
   */
  extractMemoryInsights(conversationData) {
    const insights = {
      preferences: {},
      patterns: {},
      facts: []
    };

    if (!conversationData || !conversationData.messages) {
      return insights;
    }

    // Analyze user messages for preferences and patterns
    const userMessages = conversationData.messages.filter(msg => msg.role === 'user');
    const assistantMessages = conversationData.messages.filter(msg => msg.role === 'assistant');

    // Extract team mentions
    const teamMentions = this.extractTeamMentions(userMessages);
    if (teamMentions.length > 0) {
      insights.preferences.favoriteTeams = teamMentions;
    }

    // Extract player mentions
    const playerMentions = this.extractPlayerMentions(userMessages);
    if (playerMentions.length > 0) {
      insights.preferences.favoritePlayers = playerMentions;
    }

    // Extract query patterns
    const queryTypes = this.extractQueryTypes(userMessages);
    if (queryTypes.length > 0) {
      insights.patterns.commonQueries = queryTypes;
    }

    // Extract sport interests
    const sportsInterests = this.extractSportsInterests(userMessages);
    if (sportsInterests.length > 0) {
      insights.preferences.sportsInterests = sportsInterests;
    }

    return insights;
  }

  /**
   * Extract team mentions from messages
   */
  extractTeamMentions(messages) {
    const teams = new Set();
    const teamPatterns = [
      // MLB teams
      /(yankees|red sox|dodgers|giants|cubs|mets|braves|phillies|cardinals|astros|rangers|athletics|angels|mariners|padres|rockies|diamondbacks|brewers|twins|white sox|tigers|guardians|royals|orioles|rays|blue jays|nationals|marlins|reds|pirates|pirates)/gi,
      // NFL teams  
      /(patriots|bills|dolphins|jets|steelers|ravens|browns|bengals|titans|colts|texans|jaguars|chiefs|broncos|raiders|chargers|cowboys|giants|eagles|commanders|packers|bears|lions|vikings|falcons|panthers|saints|buccaneers|49ers|seahawks|rams|cardinals)/gi,
      // NHL teams
      /(bruins|sabres|rangers|islanders|devils|flyers|penguins|capitals|hurricanes|blue jackets|panthers|lightning|maple leafs|senators|canadiens|red wings|blackhawks|predators|blues|wild|jets|avalanche|stars|ducks|sharks|flames|oilers|canucks|knights|kraken|coyotes)/gi
    ];

    messages.forEach(msg => {
      teamPatterns.forEach(pattern => {
        const matches = msg.content.match(pattern);
        if (matches) {
          matches.forEach(match => teams.add(match.toLowerCase()));
        }
      });
    });

    return Array.from(teams).slice(0, 10); // Limit to 10 teams
  }

  /**
   * Extract player mentions from messages
   */
  extractPlayerMentions(messages) {
    const players = new Set();
    
    // Look for patterns like "Player Name" or mentions of well-known players
    messages.forEach(msg => {
      // Simple pattern for capitalized names (first last)
      const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
      const matches = msg.content.match(namePattern);
      if (matches) {
        matches.forEach(match => {
          // Filter out common non-player phrases
          if (!this.isCommonPhrase(match)) {
            players.add(match);
          }
        });
      }
    });

    return Array.from(players).slice(0, 20); // Limit to 20 players
  }

  /**
   * Extract query types from messages
   */
  extractQueryTypes(messages) {
    const queryTypes = new Set();
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      if (content.includes('fantasy') || content.includes('draft') || content.includes('waiver')) {
        queryTypes.add('fantasy_advice');
      }
      if (content.includes('stats') || content.includes('statistics') || content.includes('performance')) {
        queryTypes.add('statistics');
      }
      if (content.includes('score') || content.includes('game') || content.includes('match')) {
        queryTypes.add('live_scores');
      }
      if (content.includes('trade') || content.includes('transfer')) {
        queryTypes.add('trades');
      }
      if (content.includes('injury') || content.includes('health')) {
        queryTypes.add('injury_reports');
      }
      if (content.includes('schedule') || content.includes('when') || content.includes('next game')) {
        queryTypes.add('schedules');
      }
    });

    return Array.from(queryTypes);
  }

  /**
   * Extract sports interests from messages
   */
  extractSportsInterests(messages) {
    const sports = new Set();
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      if (content.includes('baseball') || content.includes('mlb')) {
        sports.add('baseball');
      }
      if (content.includes('football') || content.includes('nfl')) {
        sports.add('football');
      }
      if (content.includes('hockey') || content.includes('nhl')) {
        sports.add('hockey');
      }
      if (content.includes('basketball') || content.includes('nba')) {
        sports.add('basketball');
      }
    });

    return Array.from(sports);
  }

  /**
   * Check if a phrase is a common non-player phrase
   */
  isCommonPhrase(phrase) {
    const commonPhrases = [
      'New York', 'Los Angeles', 'San Francisco', 'Major League', 'National League',
      'American League', 'World Series', 'Super Bowl', 'Stanley Cup', 'NBA Finals',
      'All Star', 'Hall Fame', 'Most Valuable', 'Home Run', 'Touch Down'
    ];
    
    return commonPhrases.some(common => 
      phrase.toLowerCase().includes(common.toLowerCase())
    );
  }

  /**
   * Parse user memory from formatted text back to object
   */
  parseUserMemory(memoryText) {
    // This is a simplified parser - in production you'd want more robust parsing
    const memoryData = {
      preferences: {},
      patterns: {},
      facts: []
    };

    if (!memoryText.includes('USER CONTEXT')) {
      return memoryData;
    }

    try {
      const lines = memoryText.split('\n');
      
      lines.forEach(line => {
        if (line.includes('Favorite teams:')) {
          memoryData.preferences.favoriteTeams = line.split(':')[1].trim().split(', ');
        } else if (line.includes('Favorite players:')) {
          memoryData.preferences.favoritePlayers = line.split(':')[1].trim().split(', ');
        } else if (line.includes('Fantasy leagues:')) {
          memoryData.preferences.fantasyLeagues = line.split(':')[1].trim().split(', ');
        } else if (line.includes('Sports interests:')) {
          memoryData.preferences.sportsInterests = line.split(':')[1].trim().split(', ');
        } else if (line.includes('Common question types:')) {
          memoryData.patterns.commonQueries = line.split(':')[1].trim().split(', ');
        }
      });
    } catch (error) {
      console.error('Error parsing user memory:', error);
    }

    return memoryData;
  }

  /**
   * Merge existing memory data with new insights
   */
  mergeMemoryData(existingData, newInsights) {
    const merged = JSON.parse(JSON.stringify(existingData)); // Deep clone

    // Merge preferences
    if (newInsights.preferences) {
      Object.keys(newInsights.preferences).forEach(key => {
        if (Array.isArray(newInsights.preferences[key])) {
          if (!merged.preferences[key]) {
            merged.preferences[key] = [];
          }
          // Add new items, avoiding duplicates
          newInsights.preferences[key].forEach(item => {
            if (!merged.preferences[key].includes(item)) {
              merged.preferences[key].push(item);
            }
          });
          // Keep only the most recent 10 items
          merged.preferences[key] = merged.preferences[key].slice(-10);
        } else {
          merged.preferences[key] = newInsights.preferences[key];
        }
      });
    }

    // Merge patterns
    if (newInsights.patterns) {
      Object.keys(newInsights.patterns).forEach(key => {
        if (Array.isArray(newInsights.patterns[key])) {
          if (!merged.patterns[key]) {
            merged.patterns[key] = [];
          }
          newInsights.patterns[key].forEach(item => {
            if (!merged.patterns[key].includes(item)) {
              merged.patterns[key].push(item);
            }
          });
          merged.patterns[key] = merged.patterns[key].slice(-5);
        } else {
          merged.patterns[key] = newInsights.patterns[key];
        }
      });
    }

    // Add timestamp
    merged.lastUpdated = new Date().toISOString();

    return merged;
  }

  /**
   * Save user memory to storage
   */
  async saveUserMemoryToStorage(userId, memoryData) {
    const memoryJson = JSON.stringify(memoryData);

    try {
      // Save to KV (fast access)
      if (this.env.USER_MEMORY_KV) {
        await this.env.USER_MEMORY_KV.put(
          `user_memory_${userId}`,
          memoryJson,
          { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
        );
      }

      // Save to D1 (persistent backup)
      if (this.env.SPORTS_DB) {
        await this.env.SPORTS_DB.prepare(
          'INSERT OR REPLACE INTO user_memories (user_id, memory_data, last_updated) VALUES (?, ?, ?)'
        ).bind(userId, memoryJson, new Date().toISOString()).run();
      }

      return true;
    } catch (error) {
      console.error(`Failed to save user memory for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Combine prompt layers for Responses API instructions
   */
  combinePromptLayers(generalPrompt, sportPrompt, userMemoryPrompt, conversationType, context) {
    let instructions = generalPrompt;

    // Add sport-specific context
    if (sportPrompt && sportPrompt !== generalPrompt) {
      instructions += '\n\n--- SPORT-SPECIFIC CONTEXT ---\n' + sportPrompt;
    }

    // Add user memory context
    if (userMemoryPrompt) {
      instructions += userMemoryPrompt;
    }

    // Add conversation type context
    if (conversationType !== 'general') {
      instructions += `\n\n--- CONVERSATION TYPE ---\nThis is a ${conversationType} conversation. Adapt your responses accordingly.\n`;
    }

    // Add any additional context
    if (context.additionalContext) {
      instructions += '\n\n--- ADDITIONAL CONTEXT ---\n' + context.additionalContext;
    }

    return instructions;
  }

  /**
   * Get fallback instructions when layered approach fails
   */
  getFallbackInstructions(sport) {
    return this.getDefaultPrompt(sport) || this.getDefaultPrompt('general');
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
   * Get default prompts for sports (enhanced for Responses API)
   */
  /**
   * Get default prompt using modular system
   * Now delegates to the modular prompt structure
   */
  getDefaultPrompt(sport) {
    return getModularPrompt(sport);
  }

  /**
   * Enhanced context injection for Responses API
   * Now includes user memory and conversation state
   */
  injectContext(prompt, context) {
    const { 
      userId, 
      sessionId, 
      sport, 
      conversationId,
      userPreferences = {},
      conversationType = 'general',
      previousContext = {}
    } = context;
    
    let enhancedPrompt = prompt;
    
    // Add conversation context
    if (conversationId) {
      enhancedPrompt += `\n\n--- CONVERSATION CONTEXT ---\nConversation ID: ${conversationId}\nType: ${conversationType}`;
    }
    
    // Add user identification (if available)
    if (userId) {
      enhancedPrompt += `\nUser ID: ${userId}`;
    }
    
    // Add session context
    if (sessionId) {
      enhancedPrompt += `\nSession: ${sessionId}`;
    }
    
    // Add current sport focus
    if (sport) {
      enhancedPrompt += `\nCurrent sport focus: ${sport.toUpperCase()}`;
    }
    
    // Add user preferences (legacy format for backward compatibility)
    if (userPreferences.preferredTeams?.length > 0) {
      enhancedPrompt += `\nUser's preferred teams: ${userPreferences.preferredTeams.join(', ')}`;
    }
    
    if (userPreferences.fantasyLeagues?.length > 0) {
      enhancedPrompt += `\nUser's fantasy leagues: ${userPreferences.fantasyLeagues.join(', ')}`;
    }

    // Add previous conversation context
    if (previousContext.summary) {
      enhancedPrompt += `\n\nPrevious conversation summary: ${previousContext.summary}`;
    }
    
    enhancedPrompt += '\n--- END CONTEXT ---\n';
    
    return enhancedPrompt;
  }

  /**
   * Generate instructions for Responses API (replaces generateSystemMessage)
   * This method creates the layered instructions for the Responses API
   */
  async generateInstructions(sport, context = {}) {
    try {
      // Use the new layered approach
      const instructions = await this.getLayeredInstructions(sport, context);
      
      // Apply context injection for additional personalization
      const enhancedInstructions = this.injectContext(instructions, context);
      
      return enhancedInstructions;
    } catch (error) {
      console.error('Failed to generate instructions:', error);
      return this.getFallbackInstructions(sport);
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use generateInstructions instead
   */
  async generateSystemMessage(sport, context = {}) {
    console.warn('generateSystemMessage is deprecated. Use generateInstructions for Responses API.');
    const instructions = await this.generateInstructions(sport, context);
    
    return {
      role: 'system',
      content: instructions
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
   * List available prompts using modular system
   */
  async listPrompts() {
    if (!this.env.SPORTS_PROMPTS_BUCKET) {
      // Use modular system to get available sports
      const { getSupportedSports } = await import('./index.js');
      return getSupportedSports().filter(k => k !== 'general');
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
   * Clear all caches (prompts and user memory)
   */
  clearCache() {
    this.promptCache.clear();
    this.userMemoryCache.clear();
  }

  /**
   * Clear user memory cache for specific user
   */
  clearUserMemoryCache(userId) {
    if (userId) {
      this.userMemoryCache.delete(`user_memory_${userId}`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      promptCacheSize: this.promptCache.size,
      userMemoryCacheSize: this.userMemoryCache.size,
      cacheTimeout: this.cacheTimeout,
      userMemoryTimeout: this.userMemoryTimeout
    };
  }

  /**
   * Manually add user memory fact
   */
  async addUserMemoryFact(userId, fact) {
    try {
      const currentMemory = await this.loadUserMemoryFromStorage(userId);
      const currentData = currentMemory ? this.parseUserMemory(currentMemory) : {};
      
      if (!currentData.facts) {
        currentData.facts = [];
      }
      
      currentData.facts.push(fact);
      
      // Keep only recent facts
      currentData.facts = currentData.facts.slice(-10);
      
      await this.saveUserMemoryToStorage(userId, currentData);
      this.clearUserMemoryCache(userId);
      
      return true;
    } catch (error) {
      console.error('Failed to add user memory fact:', error);
      return false;
    }
  }

  /**
   * Create conversation summary for memory
   */
  createConversationSummary(messages, maxLength = 500) {
    if (!messages || messages.length === 0) {
      return '';
    }

    // Extract key points from conversation
    const userMessages = messages.filter(msg => msg.role === 'user');
    const topics = [];
    
    userMessages.forEach(msg => {
      if (msg.content && msg.content.length > 10) {
        // Extract first sentence or up to 100 characters
        const summary = msg.content.split('.')[0].substring(0, 100);
        if (summary.length > 10) {
          topics.push(summary);
        }
      }
    });

    let summary = topics.join('; ');
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...';
    }

    return summary;
  }
}

// Convert to ES modules export for compatibility with Responses API
export { PromptManager };