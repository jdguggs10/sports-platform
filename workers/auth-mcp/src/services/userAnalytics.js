/**
 * User Analytics Service
 * Comprehensive user behavior tracking and aggregation using D1
 */

class UserAnalyticsService {
  constructor(env) {
    this.db = env.AUTH_DB;
    this.env = env;
  }

  /**
   * Log user session start
   */
  async startSession(userId, sessionId, sessionData = {}) {
    const { ip, userAgent, sport } = sessionData;
    
    await this.db.prepare(`
      INSERT INTO user_sessions (id, user_id, ip_address, user_agent, sport_context)
      VALUES (?, ?, ?, ?, ?)
    `).bind(sessionId, userId, ip, userAgent, sport).run();
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId, requestCount = null) {
    const updates = ['last_activity = CURRENT_TIMESTAMP'];
    const bindings = [];
    
    if (requestCount !== null) {
      updates.push('request_count = ?');
      bindings.push(requestCount);
    }
    
    bindings.push(sessionId);
    
    await this.db.prepare(`
      UPDATE user_sessions 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();
  }

  /**
   * End user session with analytics
   */
  async endSession(sessionId) {
    await this.db.prepare(`
      UPDATE user_sessions 
      SET ended_at = CURRENT_TIMESTAMP,
          session_duration_ms = (
            (julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 24 * 60 * 60 * 1000
          )
      WHERE id = ?
    `).bind(sessionId).run();
  }

  /**
   * Log tool usage
   */
  async logToolUsage(toolUsage) {
    const { 
      userId, sessionId, toolName, sport, endpoint, 
      success, responseTimeMs, errorMessage, cacheHit 
    } = toolUsage;
    
    await this.db.prepare(`
      INSERT INTO tool_usage_logs (
        id, user_id, session_id, tool_name, sport, endpoint,
        success, response_time_ms, error_message, cache_hit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId, sessionId, toolName, sport, endpoint,
      success, responseTimeMs, errorMessage, cacheHit
    ).run();
  }

  /**
   * Log conversation interaction
   */
  async logConversation(conversationData) {
    const {
      userId, sessionId, inputText, inputWordCount, 
      sportDetected, toolsUsed, responseWordCount, conversationTurn
    } = conversationData;
    
    // Truncate input for privacy (first 100 chars)
    const truncatedInput = inputText ? inputText.substring(0, 100) : null;
    const toolsJson = JSON.stringify(toolsUsed || []);
    
    await this.db.prepare(`
      INSERT INTO conversation_logs (
        id, user_id, session_id, input_text, input_word_count,
        sport_detected, tools_used, response_word_count, conversation_turn
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId, sessionId, truncatedInput, inputWordCount,
      sportDetected, toolsJson, responseWordCount, conversationTurn
    ).run();
  }

  /**
   * Log fantasy provider usage
   */
  async logFantasyUsage(fantasyUsage) {
    const {
      userId, provider, sport, leagueId, endpoint,
      success, responseTimeMs, errorMessage
    } = fantasyUsage;
    
    await this.db.prepare(`
      INSERT INTO fantasy_usage_logs (
        id, user_id, provider, sport, league_id, endpoint,
        success, response_time_ms, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId, provider, sport, leagueId, endpoint,
      success, responseTimeMs, errorMessage
    ).run();
  }

  /**
   * Update user preferences
   */
  async updateUserPreference(userId, key, value) {
    await this.db.prepare(`
      INSERT OR REPLACE INTO user_preferences (user_id, preference_key, preference_value)
      VALUES (?, ?, ?)
    `).bind(userId, key, value).run();
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    const result = await this.db.prepare(`
      SELECT preference_key, preference_value, updated_at
      FROM user_preferences
      WHERE user_id = ?
    `).bind(userId).all();
    
    const preferences = {};
    result.results.forEach(row => {
      preferences[row.preference_key] = row.preference_value;
    });
    
    return preferences;
  }

  /**
   * Save user script/macro
   */
  async saveUserScript(userId, script) {
    const { id, name, description, content, sport } = script;
    const scriptId = id || crypto.randomUUID();
    
    await this.db.prepare(`
      INSERT OR REPLACE INTO user_scripts (id, user_id, name, description, content, sport)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(scriptId, userId, name, description, content, sport).run();
    
    return scriptId;
  }

  /**
   * Get user scripts
   */
  async getUserScripts(userId, sport = null) {
    let query = `
      SELECT id, name, description, content, sport, usage_count, created_at
      FROM user_scripts
      WHERE user_id = ?
    `;
    const bindings = [userId];
    
    if (sport) {
      query += ' AND sport = ?';
      bindings.push(sport);
    }
    
    query += ' ORDER BY usage_count DESC, created_at DESC';
    
    const result = await this.db.prepare(query).bind(...bindings).all();
    return result.results;
  }

  /**
   * Increment script usage
   */
  async incrementScriptUsage(scriptId) {
    await this.db.prepare(`
      UPDATE user_scripts 
      SET usage_count = usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(scriptId).run();
  }

  /**
   * Generate daily metrics for a user
   */
  async generateUserDailyMetrics(userId, date) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Aggregate user metrics for the day
    const metricsQuery = `
      WITH daily_stats AS (
        SELECT 
          COUNT(*) as total_requests,
          COUNT(DISTINCT tool_name) as unique_tools,
          SUM(response_time_ms) as total_response_time,
          AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) as cache_hit_rate,
          AVG(CASE WHEN success THEN 0.0 ELSE 1.0 END) as error_rate
        FROM tool_usage_logs
        WHERE user_id = ? AND DATE(timestamp) = ?
      ),
      sports_used AS (
        SELECT JSON_GROUP_ARRAY(DISTINCT sport) as sports
        FROM tool_usage_logs  
        WHERE user_id = ? AND DATE(timestamp) = ?
      ),
      conversation_stats AS (
        SELECT COUNT(*) as conversation_turns
        FROM conversation_logs
        WHERE user_id = ? AND DATE(timestamp) = ?
      )
      SELECT * FROM daily_stats, sports_used, conversation_stats
    `;
    
    const result = await this.db.prepare(metricsQuery)
      .bind(userId, dateStr, userId, dateStr, userId, dateStr).first();
    
    if (result && result.total_requests > 0) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO user_daily_metrics (
          user_id, date, total_requests, unique_tools_used, total_response_time_ms,
          sports_used, conversation_turns, cache_hit_rate, error_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId, dateStr, result.total_requests, result.unique_tools,
        result.total_response_time, result.sports, result.conversation_turns,
        result.cache_hit_rate, result.error_rate
      ).run();
    }
  }

  /**
   * Generate platform-wide daily metrics
   */
  async generatePlatformDailyMetrics(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    const metricsQuery = `
      WITH daily_platform_stats AS (
        SELECT 
          COUNT(DISTINCT t.user_id) as active_users,
          COUNT(*) as total_requests,
          SUM(CASE WHEN t.sport = 'baseball' THEN 1 ELSE 0 END) as mlb_requests,
          SUM(CASE WHEN t.sport = 'hockey' THEN 1 ELSE 0 END) as hockey_requests,
          AVG(t.response_time_ms) as avg_response_time,
          AVG(CASE WHEN t.success THEN 0.0 ELSE 1.0 END) as error_rate
        FROM tool_usage_logs t
        WHERE DATE(t.timestamp) = ?
      ),
      new_users AS (
        SELECT COUNT(*) as new_user_count
        FROM users
        WHERE DATE(created) = ?
      ),
      fantasy_stats AS (
        SELECT 
          COUNT(*) as fantasy_requests,
          COUNT(DISTINCT CASE WHEN provider = 'espn' THEN user_id END) as espn_users,
          COUNT(DISTINCT CASE WHEN provider = 'yahoo' THEN user_id END) as yahoo_users
        FROM fantasy_usage_logs
        WHERE DATE(timestamp) = ?
      ),
      subscription_stats AS (
        SELECT 
          COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_subs,
          COUNT(CASE WHEN plan = 'elite' THEN 1 END) as elite_subs
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
      )
      SELECT * FROM daily_platform_stats, new_users, fantasy_stats, subscription_stats
    `;
    
    const result = await this.db.prepare(metricsQuery)
      .bind(dateStr, dateStr, dateStr).first();
    
    if (result) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO platform_daily_metrics (
          date, total_active_users, new_users, total_requests,
          mlb_requests, hockey_requests, fantasy_requests,
          espn_users, yahoo_users, pro_subscribers, elite_subscribers,
          avg_response_time_ms, error_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        dateStr, result.active_users, result.new_user_count, result.total_requests,
        result.mlb_requests, result.hockey_requests, result.fantasy_requests,
        result.espn_users, result.yahoo_users, result.pro_subs, result.elite_subs,
        result.avg_response_time, result.error_rate
      ).run();
    }
  }

  /**
   * Get user analytics dashboard data
   */
  async getUserAnalytics(userId, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Daily metrics
    const dailyMetrics = await this.db.prepare(`
      SELECT * FROM user_daily_metrics
      WHERE user_id = ? AND date >= ? AND date <= ?
      ORDER BY date DESC
    `).bind(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]).all();
    
    // Top tools used
    const topTools = await this.db.prepare(`
      SELECT tool_name, sport, COUNT(*) as usage_count
      FROM tool_usage_logs
      WHERE user_id = ? AND timestamp >= ?
      GROUP BY tool_name, sport
      ORDER BY usage_count DESC
      LIMIT 10
    `).bind(userId, startDate.toISOString()).all();
    
    // Recent activity
    const recentActivity = await this.db.prepare(`
      SELECT tool_name, sport, endpoint, success, timestamp
      FROM tool_usage_logs
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `).bind(userId).all();
    
    return {
      dailyMetrics: dailyMetrics.results,
      topTools: topTools.results,
      recentActivity: recentActivity.results
    };
  }

  /**
   * Get platform analytics for admin dashboard
   */
  async getPlatformAnalytics(days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const platformMetrics = await this.db.prepare(`
      SELECT * FROM platform_daily_metrics
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC
    `).bind(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]).all();
    
    // Most popular tools across platform
    const popularTools = await this.db.prepare(`
      SELECT tool_name, sport, COUNT(*) as usage_count, 
             COUNT(DISTINCT user_id) as unique_users
      FROM tool_usage_logs
      WHERE timestamp >= ?
      GROUP BY tool_name, sport
      ORDER BY usage_count DESC
      LIMIT 20
    `).bind(startDate.toISOString()).all();
    
    // User growth by subscription tier
    const userGrowth = await this.db.prepare(`
      SELECT 
        DATE(u.created) as date,
        COUNT(*) as new_users,
        COUNT(CASE WHEN s.plan = 'pro' THEN 1 END) as pro_signups,
        COUNT(CASE WHEN s.plan = 'elite' THEN 1 END) as elite_signups
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.created >= ?
      GROUP BY DATE(u.created)
      ORDER BY date DESC
    `).bind(startDate.toISOString()).all();
    
    return {
      platformMetrics: platformMetrics.results,
      popularTools: popularTools.results,
      userGrowth: userGrowth.results
    };
  }
}

module.exports = { UserAnalyticsService };