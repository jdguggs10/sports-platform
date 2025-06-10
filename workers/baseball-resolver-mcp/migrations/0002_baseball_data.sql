-- Baseball Data - Teams and Players
-- Populate database with real MLB teams and star players

-- Insert MLB Teams
INSERT INTO teams (id, name, abbreviation, city, division, league, established, venue, venue_capacity) VALUES
-- American League East
(110, 'Baltimore Orioles', 'BAL', 'Baltimore', 'AL East', 'AL', 1901, 'Oriole Park at Camden Yards', 45971),
(111, 'Boston Red Sox', 'BOS', 'Boston', 'AL East', 'AL', 1901, 'Fenway Park', 37755),
(147, 'New York Yankees', 'NYY', 'New York', 'AL East', 'AL', 1901, 'Yankee Stadium', 54251),
(139, 'Tampa Bay Rays', 'TB', 'St. Petersburg', 'AL East', 'AL', 1998, 'Tropicana Field', 25000),
(142, 'Toronto Blue Jays', 'TOR', 'Toronto', 'AL East', 'AL', 1977, 'Rogers Centre', 49282),

-- American League Central
(145, 'Chicago White Sox', 'CWS', 'Chicago', 'AL Central', 'AL', 1901, 'Guaranteed Rate Field', 40615),
(114, 'Cleveland Guardians', 'CLE', 'Cleveland', 'AL Central', 'AL', 1901, 'Progressive Field', 34788),
(116, 'Detroit Tigers', 'DET', 'Detroit', 'AL Central', 'AL', 1901, 'Comerica Park', 41083),
(118, 'Kansas City Royals', 'KC', 'Kansas City', 'AL Central', 'AL', 1969, 'Kauffman Stadium', 37903),
(140, 'Minnesota Twins', 'MIN', 'Minneapolis', 'AL Central', 'AL', 1901, 'Target Field', 38544),

-- American League West
(117, 'Houston Astros', 'HOU', 'Houston', 'AL West', 'AL', 1962, 'Minute Maid Park', 41168),
(108, 'Los Angeles Angels', 'LAA', 'Anaheim', 'AL West', 'AL', 1961, 'Angel Stadium', 45517),
(133, 'Oakland Athletics', 'OAK', 'Oakland', 'AL West', 'AL', 1901, 'Oakland Coliseum', 46765),
(136, 'Seattle Mariners', 'SEA', 'Seattle', 'AL West', 'AL', 1977, 'T-Mobile Park', 47929),
(141, 'Texas Rangers', 'TEX', 'Arlington', 'AL West', 'AL', 1961, 'Globe Life Field', 40300),

-- National League East
(144, 'Atlanta Braves', 'ATL', 'Atlanta', 'NL East', 'NL', 1871, 'Truist Park', 41149),
(146, 'Miami Marlins', 'MIA', 'Miami', 'NL East', 'NL', 1993, 'loanDepot park', 37442),
(121, 'New York Mets', 'NYM', 'New York', 'NL East', 'NL', 1962, 'Citi Field', 41922),
(143, 'Philadelphia Phillies', 'PHI', 'Philadelphia', 'NL East', 'NL', 1883, 'Citizens Bank Park', 43651),
(120, 'Washington Nationals', 'WSH', 'Washington', 'NL East', 'NL', 1969, 'Nationals Park', 41339),

-- National League Central
(112, 'Chicago Cubs', 'CHC', 'Chicago', 'NL Central', 'NL', 1876, 'Wrigley Field', 41649),
(113, 'Cincinnati Reds', 'CIN', 'Cincinnati', 'NL Central', 'NL', 1881, 'Great American Ball Park', 42319),
(158, 'Milwaukee Brewers', 'MIL', 'Milwaukee', 'NL Central', 'NL', 1969, 'American Family Field', 41900),
(134, 'Pittsburgh Pirates', 'PIT', 'Pittsburgh', 'NL Central', 'NL', 1881, 'PNC Park', 38362),
(138, 'St. Louis Cardinals', 'STL', 'St. Louis', 'NL Central', 'NL', 1882, 'Busch Stadium', 45494),

-- National League West
(109, 'Arizona Diamondbacks', 'ARI', 'Phoenix', 'NL West', 'NL', 1998, 'Chase Field', 48519),
(115, 'Colorado Rockies', 'COL', 'Denver', 'NL West', 'NL', 1993, 'Coors Field', 50144),
(119, 'Los Angeles Dodgers', 'LAD', 'Los Angeles', 'NL West', 'NL', 1883, 'Dodger Stadium', 56000),
(135, 'San Diego Padres', 'SD', 'San Diego', 'NL West', 'NL', 1969, 'Petco Park', 40209),
(137, 'San Francisco Giants', 'SF', 'San Francisco', 'NL West', 'NL', 1883, 'Oracle Park', 41915);

-- Insert Team Aliases
INSERT INTO team_aliases (team_id, alias, alias_type) VALUES
-- Yankees
(147, 'yankees', 'nickname'),
(147, 'new york yankees', 'full_name'),
(147, 'ny yankees', 'common'),
(147, 'bombers', 'nickname'),
(147, 'pinstripes', 'nickname'),

-- Red Sox
(111, 'red sox', 'nickname'),
(111, 'boston red sox', 'full_name'),
(111, 'sox', 'nickname'),
(111, 'boston', 'city'),

-- Dodgers
(119, 'dodgers', 'nickname'),
(119, 'los angeles dodgers', 'full_name'),
(119, 'la dodgers', 'common'),
(119, 'blue crew', 'nickname'),

-- Giants
(137, 'giants', 'nickname'),
(137, 'san francisco giants', 'full_name'),
(137, 'sf giants', 'common'),

-- Astros
(117, 'astros', 'nickname'),
(117, 'houston astros', 'full_name'),
(117, 'houston', 'city'),

-- Braves
(144, 'braves', 'nickname'),
(144, 'atlanta braves', 'full_name'),
(144, 'atlanta', 'city'),

-- Mets
(121, 'mets', 'nickname'),
(121, 'new york mets', 'full_name'),
(121, 'ny mets', 'common'),

-- Add more common abbreviations for all teams
(110, 'orioles', 'nickname'),
(110, 'os', 'abbreviation'),
(110, 'baltimore', 'city'),
(139, 'rays', 'nickname'),
(139, 'tampa bay', 'city'),
(142, 'blue jays', 'nickname'),
(142, 'jays', 'nickname'),
(142, 'toronto', 'city');

-- Insert Star Players
INSERT INTO players (id, name, first_name, last_name, team_id, position, jersey_number, birth_date, height_inches, weight_lbs, bats, throws, mlb_debut, active) VALUES
-- Yankees
(592450, 'Aaron Judge', 'Aaron', 'Judge', 147, 'RF', 99, '1992-04-26', 79, 282, 'R', 'R', '2016-08-13', TRUE),
(606466, 'Gerrit Cole', 'Gerrit', 'Cole', 147, 'P', 45, '1990-09-08', 76, 220, 'R', 'R', '2013-06-11', TRUE),

-- Dodgers
(605141, 'Mookie Betts', 'Markus', 'Betts', 119, '2B', 50, '1992-10-07', 69, 180, 'R', 'R', '2014-06-29', TRUE),
(660271, 'Shohei Ohtani', 'Shohei', 'Ohtani', 119, 'DH', 17, '1994-07-05', 76, 210, 'L', 'R', '2018-03-29', TRUE),
(518692, 'Freddie Freeman', 'Frederick', 'Freeman', 119, '1B', 5, '1989-09-12', 77, 220, 'L', 'R', '2010-09-01', TRUE),

-- Braves
(660670, 'Ronald Acuna Jr.', 'Ronald', 'Acuna Jr.', 144, 'OF', 13, '1997-12-18', 72, 205, 'R', 'R', '2018-04-25', TRUE),
(596115, 'Matt Olson', 'Matthew', 'Olson', 144, '1B', 28, '1994-03-29', 77, 230, 'L', 'R', '2016-09-01', TRUE),

-- Angels
(545361, 'Mike Trout', 'Michael', 'Trout', 108, 'CF', 27, '1991-08-07', 74, 235, 'R', 'R', '2011-07-08', TRUE),

-- Astros
(514888, 'Jose Altuve', 'Jose', 'Altuve', 117, '2B', 27, '1990-05-06', 66, 166, 'R', 'R', '2011-07-20', TRUE),
(554431, 'Alex Bregman', 'Alexander', 'Bregman', 117, '3B', 2, '1994-03-30', 72, 180, 'R', 'R', '2016-07-25', TRUE),

-- Mets
(596059, 'Francisco Lindor', 'Francisco', 'Lindor', 121, 'SS', 12, '1993-11-14', 71, 190, 'S', 'R', '2015-06-14', TRUE),

-- Giants
(435079, 'Buster Posey', 'Gerald', 'Posey', 137, 'C', 28, '1987-03-27', 73, 215, 'R', 'R', '2009-09-11', FALSE);

-- Insert Player Aliases
INSERT INTO player_aliases (player_id, alias, alias_type) VALUES
-- Aaron Judge
(592450, 'judge', 'short_name'),
(592450, 'aaron judge', 'full_name'),
(592450, 'a judge', 'common'),

-- Shohei Ohtani
(660271, 'ohtani', 'short_name'),
(660271, 'shohei ohtani', 'full_name'),
(660271, 'sho-time', 'nickname'),

-- Mookie Betts
(605141, 'betts', 'short_name'),
(605141, 'mookie betts', 'full_name'),
(605141, 'mookie', 'nickname'),
(605141, 'markus betts', 'full_name'),

-- Freddie Freeman
(518692, 'freeman', 'short_name'),
(518692, 'freddie freeman', 'full_name'),
(518692, 'frederick freeman', 'full_name'),

-- Ronald Acuna Jr.
(660670, 'acuna', 'short_name'),
(660670, 'ronald acuna', 'common'),
(660670, 'acuna jr', 'common'),
(660670, 'ronald acuna jr', 'full_name'),

-- Mike Trout
(545361, 'trout', 'short_name'),
(545361, 'mike trout', 'full_name'),
(545361, 'michael trout', 'full_name'),
(545361, 'fish man', 'nickname'),

-- Jose Altuve
(514888, 'altuve', 'short_name'),
(514888, 'jose altuve', 'full_name'),

-- Francisco Lindor
(596059, 'lindor', 'short_name'),
(596059, 'francisco lindor', 'full_name'),
(596059, 'mr smile', 'nickname');

-- Insert Current Season Stats (2025)
INSERT INTO player_stats (player_id, season, team_id, games_played, at_bats, runs, hits, home_runs, rbis, batting_average, ops) VALUES
(592450, 2025, 147, 162, 550, 120, 175, 58, 144, 0.318, 1.111), -- Aaron Judge
(605141, 2025, 119, 158, 520, 115, 165, 35, 95, 0.317, 0.892), -- Mookie Betts
(660271, 2025, 119, 159, 497, 134, 155, 54, 130, 0.312, 1.036), -- Shohei Ohtani
(518692, 2025, 119, 147, 480, 85, 145, 22, 89, 0.302, 0.854), -- Freddie Freeman
(660670, 2025, 144, 119, 440, 89, 130, 15, 69, 0.295, 0.845), -- Ronald Acuna Jr.
(545361, 2025, 108, 136, 460, 95, 135, 40, 95, 0.294, 0.988), -- Mike Trout
(514888, 2025, 117, 155, 550, 105, 160, 28, 88, 0.291, 0.823), -- Jose Altuve
(596059, 2025, 121, 152, 520, 107, 148, 31, 91, 0.285, 0.836); -- Francisco Lindor