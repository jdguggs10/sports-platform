-- Minimal Baseball Data for Testing
-- Just a few teams and players to test the LLM integration

-- Insert minimal MLB teams
INSERT INTO teams (id, name, abbreviation, city, division, league, established, venue, venue_capacity) VALUES
(147, 'New York Yankees', 'NYY', 'New York', 'AL East', 'AL', 1901, 'Yankee Stadium', 54251),
(111, 'Boston Red Sox', 'BOS', 'Boston', 'AL East', 'AL', 1901, 'Fenway Park', 37755),
(108, 'Los Angeles Angels', 'LAA', 'Anaheim', 'AL West', 'AL', 1961, 'Angel Stadium', 45517);

-- Insert team aliases
INSERT INTO team_aliases (team_id, alias, alias_type) VALUES
(147, 'yankees', 'nickname'),
(147, 'new york yankees', 'full_name'),
(147, 'ny yankees', 'common'),
(147, 'bronx bombers', 'nickname'),
(111, 'red sox', 'nickname'),
(111, 'boston red sox', 'full_name'),
(111, 'sox', 'nickname'),
(108, 'angels', 'nickname'),
(108, 'los angeles angels', 'full_name'),
(108, 'la angels', 'common');

-- Insert minimal players
INSERT INTO players (id, name, first_name, last_name, team_id, position, jersey_number, birth_date, height_inches, weight_lbs, bats, throws, mlb_debut, active) VALUES
(592450, 'Aaron Judge', 'Aaron', 'Judge', 147, 'OF', 99, '1992-04-26', 79, 282, 'R', 'R', '2016-08-13', TRUE),
(660271, 'Rafael Devers', 'Rafael', 'Devers', 111, '3B', 11, '1996-10-24', 72, 240, 'L', 'R', '2017-07-25', TRUE),
(545361, 'Mike Trout', 'Mike', 'Trout', 108, 'OF', 27, '1991-08-07', 74, 235, 'R', 'R', '2011-07-08', TRUE);

-- Insert player aliases
INSERT INTO player_aliases (player_id, alias, alias_type) VALUES
(592450, 'judge', 'short_name'),
(592450, 'aaron judge', 'full_name'),
(592450, 'aj', 'nickname'),
(660271, 'devers', 'short_name'),
(660271, 'rafael devers', 'full_name'),
(660271, 'rafa', 'nickname'),
(545361, 'trout', 'short_name'),
(545361, 'mike trout', 'full_name'),
(545361, 'millville meteor', 'nickname');

-- Insert minimal stats
INSERT INTO player_stats (player_id, season, team_id, games_played, at_bats, runs, hits, doubles, triples, home_runs, rbis, stolen_bases, walks, strikeouts, batting_average, on_base_percentage, slugging_percentage, ops) VALUES
(592450, 2024, 147, 158, 567, 122, 158, 36, 2, 58, 144, 10, 133, 207, 0.322, 0.458, 0.701, 1.159),
(660271, 2024, 111, 138, 531, 87, 162, 36, 2, 28, 83, 3, 64, 124, 0.272, 0.354, 0.516, 0.870),
(545361, 2024, 108, 29, 104, 14, 24, 2, 0, 10, 14, 0, 20, 27, 0.220, 0.325, 0.541, 0.866);