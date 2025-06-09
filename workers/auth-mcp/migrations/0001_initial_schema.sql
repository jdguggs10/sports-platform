-- Sports Platform Authentication Database Schema
-- Version: 1.0.0
-- Created: 2025-01-06

-- Users table - canonical user records
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table - user billing status
CREATE TABLE subscriptions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    plan TEXT NOT NULL CHECK (plan IN ('pro', 'elite')),
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fantasy provider credentials - encrypted storage
CREATE TABLE fantasy_credentials (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('espn', 'yahoo')),
    league_id TEXT NOT NULL,
    swid TEXT, -- ESPN only - encrypted
    espn_s2 TEXT, -- ESPN only - encrypted
    access_token TEXT, -- Yahoo future-proofing - encrypted
    refresh_token TEXT, -- Yahoo future-proofing - encrypted
    expires_at INTEGER, -- Token expiration timestamp
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, provider, league_id)
);

-- User sessions table - for session tracking/analytics
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_fantasy_credentials_user_provider ON fantasy_credentials(user_id, provider);
CREATE INDEX idx_fantasy_credentials_league ON fantasy_credentials(league_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_users_email ON users(email);

-- Triggers for updated timestamps
CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_subscriptions_timestamp 
    AFTER UPDATE ON subscriptions
    BEGIN
        UPDATE subscriptions SET updated = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
    END;

CREATE TRIGGER update_fantasy_credentials_timestamp 
    AFTER UPDATE ON fantasy_credentials
    BEGIN
        UPDATE fantasy_credentials SET updated = CURRENT_TIMESTAMP 
        WHERE user_id = NEW.user_id AND provider = NEW.provider AND league_id = NEW.league_id;
    END;