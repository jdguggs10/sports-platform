-- Seed data for development and testing
-- Version: 1.0.0
-- Created: 2025-01-06

-- Test user for development
INSERT OR IGNORE INTO users (id, email, created) VALUES 
('test-user-1', 'test@example.com', '2025-01-06T00:00:00Z');

-- Test subscription (active pro plan)
INSERT OR IGNORE INTO subscriptions (user_id, status, plan, current_period_end) VALUES 
('test-user-1', 'active', 'pro', '2025-02-06T00:00:00Z');

-- Test ESPN credentials (sample league)
INSERT OR IGNORE INTO fantasy_credentials (user_id, provider, league_id, swid, espn_s2) VALUES 
('test-user-1', 'espn', 'test-league-123', 'dGVzdC1zd2lk', 'dGVzdC1lc3BuLXMy');

-- Note: The swid and espn_s2 values above are base64 encoded 'test-swid' and 'test-espn-s2'
-- In production, these would be properly encrypted using crypto.subtle