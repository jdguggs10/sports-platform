-- Migration 0004: Enhanced User Analytics and Data Aggregation Schema (Fixed)
-- Expands D1 to support comprehensive user behavior tracking and analytics

-- User preferences and personalization
CREATE TABLE user_preferences (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, preference_key)
);

-- User scripts and macros  
CREATE TABLE user_scripts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    sport TEXT, -- baseball, hockey, etc.
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tool usage analytics
CREATE TABLE tool_usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES user_sessions(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    sport TEXT NOT NULL, -- baseball, hockey, etc.
    endpoint TEXT, -- team, player, game, etc.
    success BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    cache_hit BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User conversation analytics
CREATE TABLE conversation_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES user_sessions(id) ON DELETE CASCADE,
    input_text TEXT, -- User query (truncated for privacy)
    input_word_count INTEGER,
    sport_detected TEXT,
    tools_used TEXT, -- JSON array of tool names
    response_word_count INTEGER,
    conversation_turn INTEGER, -- Turn number in conversation
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fantasy provider usage analytics
CREATE TABLE fantasy_usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- espn, yahoo
    sport TEXT NOT NULL, -- baseball, hockey
    league_id TEXT,
    endpoint TEXT NOT NULL, -- team_roster, scoreboard, etc.
    success BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User engagement metrics (aggregated daily)
CREATE TABLE user_daily_metrics (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    unique_tools_used INTEGER DEFAULT 0,
    total_response_time_ms INTEGER DEFAULT 0,
    sports_used TEXT, -- JSON array of sports used
    fantasy_providers_used TEXT, -- JSON array of providers used
    conversation_turns INTEGER DEFAULT 0,
    cache_hit_rate REAL, -- Percentage 0.0-1.0
    error_rate REAL, -- Percentage 0.0-1.0
    PRIMARY KEY (user_id, date)
);

-- System-wide aggregation metrics (for business intelligence)
CREATE TABLE platform_daily_metrics (
    date DATE PRIMARY KEY,
    total_active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    mlb_requests INTEGER DEFAULT 0,
    hockey_requests INTEGER DEFAULT 0,
    fantasy_requests INTEGER DEFAULT 0,
    espn_users INTEGER DEFAULT 0,
    yahoo_users INTEGER DEFAULT 0,
    pro_subscribers INTEGER DEFAULT 0,
    elite_subscribers INTEGER DEFAULT 0,
    avg_response_time_ms REAL,
    error_rate REAL
);

-- User tier analytics (for subscription insights)
CREATE TABLE user_tier_analytics (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of month
    subscription_tier TEXT, -- free, pro, elite
    requests_made INTEGER DEFAULT 0,
    fantasy_leagues_connected INTEGER DEFAULT 0,
    premium_features_used TEXT, -- JSON array of features
    estimated_api_cost REAL, -- Cost estimation for usage
    PRIMARY KEY (user_id, month)
);

-- Add analytics columns to existing user_sessions table
ALTER TABLE user_sessions ADD COLUMN sport_context TEXT;
ALTER TABLE user_sessions ADD COLUMN session_duration_ms INTEGER;
ALTER TABLE user_sessions ADD COLUMN request_count INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX idx_user_preferences_updated ON user_preferences(updated_at);
CREATE INDEX idx_user_scripts_sport ON user_scripts(sport);
CREATE INDEX idx_user_scripts_usage ON user_scripts(usage_count DESC);
CREATE INDEX idx_sessions_user_activity ON user_sessions(user_id, last_seen);
CREATE INDEX idx_tool_usage_user_time ON tool_usage_logs(user_id, timestamp);
CREATE INDEX idx_tool_usage_sport_tool ON tool_usage_logs(sport, tool_name);
CREATE INDEX idx_conversation_user_time ON conversation_logs(user_id, timestamp);
CREATE INDEX idx_fantasy_usage_provider ON fantasy_usage_logs(provider, sport);
CREATE INDEX idx_daily_metrics_date ON user_daily_metrics(date);
CREATE INDEX idx_platform_metrics_date ON platform_daily_metrics(date);
CREATE INDEX idx_tier_analytics_month ON user_tier_analytics(month);