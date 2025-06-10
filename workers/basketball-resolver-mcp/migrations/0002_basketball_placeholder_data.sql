-- Basketball Placeholder Data - Teams and Sample Players
-- Basic structure for future NBA data population

-- Insert NBA Teams (Eastern Conference)
INSERT INTO teams (id, name, abbreviation, city, division, conference, established, venue, venue_capacity) VALUES
-- Atlantic Division
(1, 'Boston Celtics', 'BOS', 'Boston', 'Atlantic', 'Eastern', 1946, 'TD Garden', 19156),
(2, 'Brooklyn Nets', 'BKN', 'Brooklyn', 'Atlantic', 'Eastern', 1967, 'Barclays Center', 17732),
(3, 'New York Knicks', 'NYK', 'New York', 'Atlantic', 'Eastern', 1946, 'Madison Square Garden', 20789),
(4, 'Philadelphia 76ers', 'PHI', 'Philadelphia', 'Atlantic', 'Eastern', 1949, 'Wells Fargo Center', 20478),
(5, 'Toronto Raptors', 'TOR', 'Toronto', 'Atlantic', 'Eastern', 1995, 'Scotiabank Arena', 19800),

-- Central Division
(6, 'Chicago Bulls', 'CHI', 'Chicago', 'Central', 'Eastern', 1966, 'United Center', 20917),
(7, 'Cleveland Cavaliers', 'CLE', 'Cleveland', 'Central', 'Eastern', 1970, 'Rocket Mortgage FieldHouse', 19432),
(8, 'Detroit Pistons', 'DET', 'Detroit', 'Central', 'Eastern', 1941, 'Little Caesars Arena', 20491),
(9, 'Indiana Pacers', 'IND', 'Indianapolis', 'Central', 'Eastern', 1967, 'Gainbridge Fieldhouse', 17923),
(10, 'Milwaukee Bucks', 'MIL', 'Milwaukee', 'Central', 'Eastern', 1968, 'Fiserv Forum', 17500),

-- Southeast Division
(11, 'Atlanta Hawks', 'ATL', 'Atlanta', 'Southeast', 'Eastern', 1946, 'State Farm Arena', 18118),
(12, 'Charlotte Hornets', 'CHA', 'Charlotte', 'Southeast', 'Eastern', 1988, 'Spectrum Center', 19077),
(13, 'Miami Heat', 'MIA', 'Miami', 'Southeast', 'Eastern', 1988, 'FTX Arena', 19600),
(14, 'Orlando Magic', 'ORL', 'Orlando', 'Southeast', 'Eastern', 1989, 'Amway Center', 18846),
(15, 'Washington Wizards', 'WAS', 'Washington', 'Southeast', 'Eastern', 1961, 'Capital One Arena', 20356);

-- Insert NBA Teams (Western Conference)
INSERT INTO teams (id, name, abbreviation, city, division, conference, established, venue, venue_capacity) VALUES
-- Northwest Division
(16, 'Denver Nuggets', 'DEN', 'Denver', 'Northwest', 'Western', 1967, 'Ball Arena', 19520),
(17, 'Minnesota Timberwolves', 'MIN', 'Minneapolis', 'Northwest', 'Western', 1989, 'Target Center', 19356),
(18, 'Oklahoma City Thunder', 'OKC', 'Oklahoma City', 'Northwest', 'Western', 1967, 'Paycom Center', 18203),
(19, 'Portland Trail Blazers', 'POR', 'Portland', 'Northwest', 'Western', 1970, 'Moda Center', 19393),
(20, 'Utah Jazz', 'UTA', 'Salt Lake City', 'Northwest', 'Western', 1974, 'Delta Center', 18306),

-- Pacific Division
(21, 'Golden State Warriors', 'GSW', 'San Francisco', 'Pacific', 'Western', 1946, 'Chase Center', 18064),
(22, 'Los Angeles Clippers', 'LAC', 'Los Angeles', 'Pacific', 'Western', 1970, 'Crypto.com Arena', 19068),
(23, 'Los Angeles Lakers', 'LAL', 'Los Angeles', 'Pacific', 'Western', 1947, 'Crypto.com Arena', 18997),
(24, 'Phoenix Suns', 'PHX', 'Phoenix', 'Pacific', 'Western', 1968, 'Footprint Center', 18055),
(25, 'Sacramento Kings', 'SAC', 'Sacramento', 'Pacific', 'Western', 1945, 'Golden 1 Center', 17583),

-- Southwest Division
(26, 'Dallas Mavericks', 'DAL', 'Dallas', 'Southwest', 'Western', 1980, 'American Airlines Center', 19200),
(27, 'Houston Rockets', 'HOU', 'Houston', 'Southwest', 'Western', 1967, 'Toyota Center', 18055),
(28, 'Memphis Grizzlies', 'MEM', 'Memphis', 'Southwest', 'Western', 1995, 'FedExForum', 18119),
(29, 'New Orleans Pelicans', 'NOP', 'New Orleans', 'Southwest', 'Western', 1988, 'Smoothie King Center', 16867),
(30, 'San Antonio Spurs', 'SAS', 'San Antonio', 'Southwest', 'Western', 1967, 'Frost Bank Center', 18418);

-- Insert Team Aliases (sample)
INSERT INTO team_aliases (team_id, alias, alias_type) VALUES
-- Lakers
(23, 'lakers', 'nickname'),
(23, 'los angeles lakers', 'full_name'),
(23, 'la lakers', 'common'),
(23, 'purple and gold', 'nickname'),

-- Warriors
(21, 'warriors', 'nickname'),
(21, 'golden state warriors', 'full_name'),
(21, 'dubs', 'nickname'),
(21, 'golden state', 'common'),

-- Celtics
(1, 'celtics', 'nickname'),
(1, 'boston celtics', 'full_name'),
(1, 'cs', 'nickname'),
(1, 'boston', 'city'),

-- Bulls
(6, 'bulls', 'nickname'),
(6, 'chicago bulls', 'full_name'),
(6, 'chicago', 'city'),

-- Heat
(13, 'heat', 'nickname'),
(13, 'miami heat', 'full_name'),
(13, 'miami', 'city'),

-- Nuggets
(16, 'nuggets', 'nickname'),
(16, 'denver nuggets', 'full_name'),
(16, 'denver', 'city'),
(16, 'nugs', 'nickname'),

-- Knicks
(3, 'knicks', 'nickname'),
(3, 'new york knicks', 'full_name'),
(3, 'ny knicks', 'common'),
(3, 'new york', 'city'),

-- Bucks
(10, 'bucks', 'nickname'),
(10, 'milwaukee bucks', 'full_name'),
(10, 'milwaukee', 'city');

-- Insert Placeholder Players (famous NBA players)
INSERT INTO players (id, name, first_name, last_name, team_id, position, jersey_number, birth_date, height_inches, weight_lbs, college, nba_debut, active) VALUES
-- Placeholder data - would be populated with actual NBA roster
(1, 'LeBron James', 'LeBron', 'James', 23, 'SF', 6, '1984-12-30', 81, 250, 'None', '2003-10-29', TRUE),
(2, 'Stephen Curry', 'Stephen', 'Curry', 21, 'PG', 30, '1988-03-14', 75, 185, 'Davidson', '2009-10-28', TRUE),
(3, 'Kevin Durant', 'Kevin', 'Durant', 24, 'SF', 35, '1988-09-29', 83, 240, 'Texas', '2007-10-31', TRUE),
(4, 'Giannis Antetokounmpo', 'Giannis', 'Antetokounmpo', 10, 'PF', 34, '1994-12-06', 83, 243, 'None', '2013-10-30', TRUE),
(5, 'Luka Doncic', 'Luka', 'Doncic', 26, 'PG', 77, '1999-02-28', 79, 230, 'None', '2018-10-17', TRUE),
(6, 'Jayson Tatum', 'Jayson', 'Tatum', 1, 'SF', 0, '1998-03-03', 80, 210, 'Duke', '2017-10-18', TRUE),
(7, 'Nikola Jokic', 'Nikola', 'Jokic', 16, 'C', 15, '1995-02-19', 83, 284, 'None', '2015-10-07', TRUE),
(8, 'Joel Embiid', 'Joel', 'Embiid', 4, 'C', 21, '1994-03-16', 84, 280, 'Kansas', '2016-10-26', TRUE),
(9, 'Anthony Davis', 'Anthony', 'Davis', 23, 'PF', 3, '1993-03-11', 82, 253, 'Kentucky', '2012-10-31', TRUE),
(10, 'Damian Lillard', 'Damian', 'Lillard', 10, 'PG', 0, '1990-07-15', 75, 195, 'Weber State', '2012-10-31', TRUE);

-- Insert Player Aliases (sample)
INSERT INTO player_aliases (player_id, alias, alias_type) VALUES
-- LeBron James
(1, 'lebron', 'short_name'),
(1, 'lebron james', 'full_name'),
(1, 'king james', 'nickname'),
(1, 'the king', 'nickname'),

-- Stephen Curry
(2, 'curry', 'short_name'),
(2, 'stephen curry', 'full_name'),
(2, 'steph', 'nickname'),
(2, 'chef curry', 'nickname'),

-- Kevin Durant
(3, 'durant', 'short_name'),
(3, 'kevin durant', 'full_name'),
(3, 'kd', 'nickname'),
(3, 'slim reaper', 'nickname'),

-- Giannis Antetokounmpo
(4, 'giannis', 'short_name'),
(4, 'giannis antetokounmpo', 'full_name'),
(4, 'greek freak', 'nickname'),

-- Luka Doncic
(5, 'luka', 'short_name'),
(5, 'luka doncic', 'full_name'),
(5, 'luka magic', 'nickname'),

-- Jayson Tatum
(6, 'tatum', 'short_name'),
(6, 'jayson tatum', 'full_name'),
(6, 'jt', 'nickname'),

-- Nikola Jokic
(7, 'jokic', 'short_name'),
(7, 'nikola jokic', 'full_name'),
(7, 'joker', 'nickname'),

-- Joel Embiid
(8, 'embiid', 'short_name'),
(8, 'joel embiid', 'full_name'),
(8, 'the process', 'nickname'),

-- Anthony Davis
(9, 'davis', 'short_name'),
(9, 'anthony davis', 'full_name'),
(9, 'ad', 'nickname'),
(9, 'the brow', 'nickname'),

-- Damian Lillard
(10, 'lillard', 'short_name'),
(10, 'damian lillard', 'full_name'),
(10, 'dame', 'nickname'),
(10, 'dame time', 'nickname');

-- Insert Placeholder Current Season Stats (2024-25)
INSERT INTO player_stats (player_id, season, team_id, games_played, minutes_per_game, points_per_game, rebounds_per_game, assists_per_game, steals_per_game, blocks_per_game, field_goal_percentage, three_point_percentage, free_throw_percentage, turnovers_per_game) VALUES
(1, '2024-25', 23, 45, 35.2, 25.8, 7.8, 8.2, 1.3, 0.6, 0.525, 0.415, 0.750, 3.8), -- LeBron
(2, '2024-25', 21, 42, 32.8, 28.4, 4.1, 6.5, 1.6, 0.4, 0.468, 0.428, 0.911, 3.2), -- Curry
(3, '2024-25', 24, 38, 36.5, 29.1, 6.8, 5.4, 0.9, 1.2, 0.523, 0.398, 0.889, 3.1), -- Durant
(4, '2024-25', 10, 44, 34.9, 30.5, 11.2, 6.1, 1.1, 1.4, 0.612, 0.305, 0.658, 3.6), -- Giannis
(5, '2024-25', 26, 41, 35.8, 32.2, 8.9, 8.8, 1.4, 0.5, 0.487, 0.382, 0.782, 4.1), -- Luka
(6, '2024-25', 1, 43, 36.1, 28.1, 8.5, 4.9, 1.0, 0.6, 0.475, 0.371, 0.825, 2.9), -- Tatum
(7, '2024-25', 16, 46, 34.2, 26.8, 12.1, 9.2, 1.2, 0.9, 0.588, 0.345, 0.821, 3.4), -- Jokic
(8, '2024-25', 4, 32, 33.5, 28.9, 10.8, 3.9, 1.1, 1.8, 0.525, 0.289, 0.845, 3.7), -- Embiid
(9, '2024-25', 23, 40, 34.1, 24.3, 12.4, 3.1, 1.3, 2.1, 0.558, 0.278, 0.789, 2.2), -- Davis
(10, '2024-25', 10, 44, 35.6, 26.4, 4.5, 7.8, 1.0, 0.3, 0.463, 0.368, 0.921, 3.0); -- Lillard