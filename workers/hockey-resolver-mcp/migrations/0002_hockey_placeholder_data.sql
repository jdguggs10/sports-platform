-- Hockey Placeholder Data - Teams and Sample Players
-- Basic structure for future NHL data population

-- Insert NHL Teams (Eastern Conference)
INSERT INTO teams (id, name, abbreviation, city, division, conference, established, venue, venue_capacity) VALUES
-- Atlantic Division
(6, 'Boston Bruins', 'BOS', 'Boston', 'Atlantic', 'Eastern', 1924, 'TD Garden', 17850),
(7, 'Buffalo Sabres', 'BUF', 'Buffalo', 'Atlantic', 'Eastern', 1970, 'KeyBank Center', 19070),
(17, 'Detroit Red Wings', 'DET', 'Detroit', 'Atlantic', 'Eastern', 1926, 'Little Caesars Arena', 19515),
(13, 'Florida Panthers', 'FLA', 'Sunrise', 'Atlantic', 'Eastern', 1993, 'FLA Live Arena', 19250),
(8, 'Montreal Canadiens', 'MTL', 'Montreal', 'Atlantic', 'Eastern', 1909, 'Bell Centre', 21302),
(9, 'Ottawa Senators', 'OTT', 'Ottawa', 'Atlantic', 'Eastern', 1992, 'Canadian Tire Centre', 18652),
(14, 'Tampa Bay Lightning', 'TBL', 'Tampa', 'Atlantic', 'Eastern', 1992, 'Amalie Arena', 19092),
(10, 'Toronto Maple Leafs', 'TOR', 'Toronto', 'Atlantic', 'Eastern', 1917, 'Scotiabank Arena', 18800),

-- Metropolitan Division  
(12, 'Carolina Hurricanes', 'CAR', 'Raleigh', 'Metropolitan', 'Eastern', 1972, 'PNC Arena', 18680),
(29, 'Columbus Blue Jackets', 'CBJ', 'Columbus', 'Metropolitan', 'Eastern', 2000, 'Nationwide Arena', 18500),
(1, 'New Jersey Devils', 'NJD', 'Newark', 'Metropolitan', 'Eastern', 1974, 'Prudential Center', 16514),
(2, 'New York Islanders', 'NYI', 'Elmont', 'Metropolitan', 'Eastern', 1972, 'UBS Arena', 17255),
(3, 'New York Rangers', 'NYR', 'New York', 'Metropolitan', 'Eastern', 1926, 'Madison Square Garden', 18006),
(4, 'Philadelphia Flyers', 'PHI', 'Philadelphia', 'Metropolitan', 'Eastern', 1967, 'Wells Fargo Center', 19537),
(5, 'Pittsburgh Penguins', 'PIT', 'Pittsburgh', 'Metropolitan', 'Eastern', 1967, 'PPG Paints Arena', 18387),
(15, 'Washington Capitals', 'WSH', 'Washington', 'Metropolitan', 'Eastern', 1974, 'Capital One Arena', 18573);

-- Insert NHL Teams (Western Conference)
INSERT INTO teams (id, name, abbreviation, city, division, conference, established, venue, venue_capacity) VALUES
-- Central Division
(16, 'Chicago Blackhawks', 'CHI', 'Chicago', 'Central', 'Western', 1926, 'United Center', 19717),
(21, 'Colorado Avalanche', 'COL', 'Denver', 'Central', 'Western', 1972, 'Ball Arena', 18007),
(25, 'Dallas Stars', 'DAL', 'Dallas', 'Central', 'Western', 1967, 'American Airlines Center', 18532),
(30, 'Minnesota Wild', 'MIN', 'St. Paul', 'Central', 'Western', 2000, 'Xcel Energy Center', 17954),
(18, 'Nashville Predators', 'NSH', 'Nashville', 'Central', 'Western', 1998, 'Bridgestone Arena', 17113),
(19, 'St. Louis Blues', 'STL', 'St. Louis', 'Central', 'Western', 1967, 'Enterprise Center', 18096),
(52, 'Winnipeg Jets', 'WPG', 'Winnipeg', 'Central', 'Western', 1999, 'Canada Life Centre', 15321),

-- Pacific Division
(24, 'Anaheim Ducks', 'ANA', 'Anaheim', 'Pacific', 'Western', 1993, 'Honda Center', 17174),
(20, 'Calgary Flames', 'CGY', 'Calgary', 'Pacific', 'Western', 1972, 'Scotiabank Saddledome', 19289),
(22, 'Edmonton Oilers', 'EDM', 'Edmonton', 'Pacific', 'Western', 1972, 'Rogers Place', 18347),
(26, 'Los Angeles Kings', 'LAK', 'Los Angeles', 'Pacific', 'Western', 1967, 'Crypto.com Arena', 18230),
(28, 'San Jose Sharks', 'SJS', 'San Jose', 'Pacific', 'Western', 1991, 'SAP Center', 17562),
(55, 'Seattle Kraken', 'SEA', 'Seattle', 'Pacific', 'Western', 2021, 'Climate Pledge Arena', 17151),
(23, 'Vancouver Canucks', 'VAN', 'Vancouver', 'Pacific', 'Western', 1970, 'Rogers Arena', 18910),
(54, 'Vegas Golden Knights', 'VGK', 'Las Vegas', 'Pacific', 'Western', 2017, 'T-Mobile Arena', 17500);

-- Insert Team Aliases (sample)
INSERT INTO team_aliases (team_id, alias, alias_type) VALUES
-- Bruins
(6, 'bruins', 'nickname'),
(6, 'boston bruins', 'full_name'),
(6, 'boston', 'city'),
(6, 'b\'s', 'nickname'),

-- Rangers
(3, 'rangers', 'nickname'),
(3, 'new york rangers', 'full_name'),
(3, 'ny rangers', 'common'),
(3, 'broadway blueshirts', 'nickname'),

-- Oilers
(22, 'oilers', 'nickname'),
(22, 'edmonton oilers', 'full_name'),
(22, 'edmonton', 'city'),
(22, 'oil', 'nickname'),

-- Penguins
(5, 'penguins', 'nickname'),
(5, 'pittsburgh penguins', 'full_name'),
(5, 'pens', 'nickname'),
(5, 'pittsburgh', 'city'),

-- Capitals
(15, 'capitals', 'nickname'),
(15, 'washington capitals', 'full_name'),
(15, 'caps', 'nickname'),
(15, 'washington', 'city'),

-- Lightning
(14, 'lightning', 'nickname'),
(14, 'tampa bay lightning', 'full_name'),
(14, 'bolts', 'nickname'),
(14, 'tampa bay', 'city'),

-- Maple Leafs
(10, 'maple leafs', 'nickname'),
(10, 'toronto maple leafs', 'full_name'),
(10, 'leafs', 'nickname'),
(10, 'toronto', 'city'),

-- Golden Knights
(54, 'golden knights', 'nickname'),
(54, 'vegas golden knights', 'full_name'),
(54, 'knights', 'nickname'),
(54, 'vegas', 'city'),
(54, 'las vegas', 'city');

-- Insert Placeholder Players (famous NHL players)
INSERT INTO players (id, name, first_name, last_name, team_id, position, jersey_number, birth_date, height_inches, weight_lbs, shoots, nhl_debut, active) VALUES
-- Placeholder data - would be populated with actual NHL roster
(8478402, 'Connor McDavid', 'Connor', 'McDavid', 22, 'C', 97, '1997-01-13', 73, 193, 'L', '2015-10-08', TRUE),
(8471675, 'Sidney Crosby', 'Sidney', 'Crosby', 5, 'C', 87, '1987-08-07', 71, 200, 'L', '2005-10-05', TRUE),
(8471214, 'Alexander Ovechkin', 'Alexander', 'Ovechkin', 15, 'LW', 8, '1985-09-17', 75, 235, 'R', '2005-10-05', TRUE),
(8477934, 'Leon Draisaitl', 'Leon', 'Draisaitl', 22, 'C', 29, '1995-10-27', 74, 208, 'L', '2014-10-09', TRUE),
(8477956, 'David Pastrnak', 'David', 'Pastrnak', 6, 'RW', 88, '1996-05-25', 72, 194, 'R', '2014-11-24', TRUE),
(8477492, 'Nathan MacKinnon', 'Nathan', 'MacKinnon', 21, 'C', 29, '1995-09-01', 72, 200, 'R', '2013-10-02', TRUE),
(8476454, 'Auston Matthews', 'Auston', 'Matthews', 10, 'C', 34, '1997-09-17', 75, 220, 'L', '2016-10-12', TRUE),
(8478550, 'Mikko Rantanen', 'Mikko', 'Rantanen', 21, 'RW', 96, '1996-10-29', 76, 215, 'L', '2015-11-21', TRUE);

-- Insert Player Aliases (sample)
INSERT INTO player_aliases (player_id, alias, alias_type) VALUES
-- Connor McDavid
(8478402, 'mcdavid', 'short_name'),
(8478402, 'connor mcdavid', 'full_name'),
(8478402, 'mcjesus', 'nickname'),

-- Sidney Crosby
(8471675, 'crosby', 'short_name'),
(8471675, 'sidney crosby', 'full_name'),
(8471675, 'sid the kid', 'nickname'),

-- Alexander Ovechkin
(8471214, 'ovechkin', 'short_name'),
(8471214, 'alex ovechkin', 'common'),
(8471214, 'ovi', 'nickname'),
(8471214, 'the great eight', 'nickname'),

-- Leon Draisaitl
(8477934, 'draisaitl', 'short_name'),
(8477934, 'leon draisaitl', 'full_name'),
(8477934, 'drai', 'nickname'),

-- David Pastrnak
(8477956, 'pastrnak', 'short_name'),
(8477956, 'david pastrnak', 'full_name'),
(8477956, 'pasta', 'nickname'),

-- Nathan MacKinnon
(8477492, 'mackinnon', 'short_name'),
(8477492, 'nathan mackinnon', 'full_name'),
(8477492, 'mack', 'nickname'),

-- Auston Matthews
(8476454, 'matthews', 'short_name'),
(8476454, 'auston matthews', 'full_name'),
(8476454, 'papi', 'nickname');

-- Insert Placeholder Current Season Stats (2024-25)
INSERT INTO player_stats (player_id, season, team_id, games_played, goals, assists, points, plus_minus, penalty_minutes, shots, shooting_percentage, time_on_ice_per_game) VALUES
(8478402, '2024-25', 22, 45, 15, 35, 50, 8, 12, 120, 12.5, 22.5), -- McDavid
(8471675, '2024-25', 5, 42, 18, 28, 46, 12, 8, 110, 16.4, 21.2), -- Crosby
(8471214, '2024-25', 15, 44, 25, 15, 40, 5, 22, 150, 16.7, 19.8), -- Ovechkin
(8477934, '2024-25', 22, 43, 20, 22, 42, 10, 16, 95, 21.1, 21.8), -- Draisaitl
(8477956, '2024-25', 6, 40, 22, 18, 40, 15, 6, 125, 17.6, 18.5), -- Pastrnak
(8477492, '2024-25', 21, 41, 12, 30, 42, 18, 14, 115, 10.4, 20.9), -- MacKinnon
(8476454, '2024-25', 10, 38, 28, 12, 40, 8, 4, 140, 20.0, 19.7), -- Matthews
(8478550, '2024-25', 21, 44, 16, 26, 42, 14, 10, 105, 15.2, 19.3); -- Rantanen