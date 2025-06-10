-- Football Placeholder Data - Teams and Sample Players
-- Basic structure for future NFL data population

-- Insert NFL Teams (AFC Conference)
INSERT INTO teams (id, name, abbreviation, city, division, conference, established, venue, venue_capacity) VALUES
-- AFC East
(1, 'Buffalo Bills', 'BUF', 'Buffalo', 'AFC East', 'AFC', 1960, 'Highmark Stadium', 71608),
(2, 'Miami Dolphins', 'MIA', 'Miami', 'AFC East', 'AFC', 1966, 'Hard Rock Stadium', 65326),
(3, 'New England Patriots', 'NE', 'Foxborough', 'AFC East', 'AFC', 1960, 'Gillette Stadium', 65878),
(4, 'New York Jets', 'NYJ', 'East Rutherford', 'AFC East', 'AFC', 1960, 'MetLife Stadium', 82500),

-- AFC North
(5, 'Baltimore Ravens', 'BAL', 'Baltimore', 'AFC North', 'AFC', 1996, 'M&T Bank Stadium', 71008),
(6, 'Cincinnati Bengals', 'CIN', 'Cincinnati', 'AFC North', 'AFC', 1968, 'Paycor Stadium', 65515),
(7, 'Cleveland Browns', 'CLE', 'Cleveland', 'AFC North', 'AFC', 1946, 'Cleveland Browns Stadium', 67431),
(8, 'Pittsburgh Steelers', 'PIT', 'Pittsburgh', 'AFC North', 'AFC', 1933, 'Heinz Field', 68400),

-- AFC South
(9, 'Houston Texans', 'HOU', 'Houston', 'AFC South', 'AFC', 2002, 'NRG Stadium', 72220),
(10, 'Indianapolis Colts', 'IND', 'Indianapolis', 'AFC South', 'AFC', 1953, 'Lucas Oil Stadium', 67000),
(11, 'Jacksonville Jaguars', 'JAX', 'Jacksonville', 'AFC South', 'AFC', 1995, 'TIAA Bank Field', 67814),
(12, 'Tennessee Titans', 'TEN', 'Nashville', 'AFC South', 'AFC', 1960, 'Nissan Stadium', 69143),

-- AFC West
(13, 'Denver Broncos', 'DEN', 'Denver', 'AFC West', 'AFC', 1960, 'Empower Field at Mile High', 76125),
(14, 'Kansas City Chiefs', 'KC', 'Kansas City', 'AFC West', 'AFC', 1960, 'Arrowhead Stadium', 76416),
(15, 'Las Vegas Raiders', 'LV', 'Las Vegas', 'AFC West', 'AFC', 1960, 'Allegiant Stadium', 65000),
(16, 'Los Angeles Chargers', 'LAC', 'Los Angeles', 'AFC West', 'AFC', 1960, 'SoFi Stadium', 70240);

-- Insert NFL Teams (NFC Conference)
INSERT INTO teams (id, name, abbreviation, city, division, conference, established, venue, venue_capacity) VALUES
-- NFC East
(17, 'Dallas Cowboys', 'DAL', 'Arlington', 'NFC East', 'NFC', 1960, 'AT&T Stadium', 80000),
(18, 'New York Giants', 'NYG', 'East Rutherford', 'NFC East', 'NFC', 1925, 'MetLife Stadium', 82500),
(19, 'Philadelphia Eagles', 'PHI', 'Philadelphia', 'NFC East', 'NFC', 1933, 'Lincoln Financial Field', 69176),
(20, 'Washington Commanders', 'WAS', 'Landover', 'NFC East', 'NFC', 1932, 'FedExField', 82000),

-- NFC North
(21, 'Chicago Bears', 'CHI', 'Chicago', 'NFC North', 'NFC', 1920, 'Soldier Field', 61500),
(22, 'Detroit Lions', 'DET', 'Detroit', 'NFC North', 'NFC', 1930, 'Ford Field', 65000),
(23, 'Green Bay Packers', 'GB', 'Green Bay', 'NFC North', 'NFC', 1921, 'Lambeau Field', 81441),
(24, 'Minnesota Vikings', 'MIN', 'Minneapolis', 'NFC North', 'NFC', 1961, 'U.S. Bank Stadium', 66860),

-- NFC South
(25, 'Atlanta Falcons', 'ATL', 'Atlanta', 'NFC South', 'NFC', 1966, 'Mercedes-Benz Stadium', 71000),
(26, 'Carolina Panthers', 'CAR', 'Charlotte', 'NFC South', 'NFC', 1995, 'Bank of America Stadium', 75419),
(27, 'New Orleans Saints', 'NO', 'New Orleans', 'NFC South', 'NFC', 1967, 'Caesars Superdome', 73208),
(28, 'Tampa Bay Buccaneers', 'TB', 'Tampa', 'NFC South', 'NFC', 1976, 'Raymond James Stadium', 65890),

-- NFC West
(29, 'Arizona Cardinals', 'ARI', 'Glendale', 'NFC West', 'NFC', 1898, 'State Farm Stadium', 63400),
(30, 'Los Angeles Rams', 'LAR', 'Los Angeles', 'NFC West', 'NFC', 1936, 'SoFi Stadium', 70240),
(31, 'San Francisco 49ers', 'SF', 'Santa Clara', 'NFC West', 'NFC', 1946, 'Levi\'s Stadium', 68500),
(32, 'Seattle Seahawks', 'SEA', 'Seattle', 'NFC West', 'NFC', 1976, 'Lumen Field', 69000);

-- Insert Team Aliases (sample)
INSERT INTO team_aliases (team_id, alias, alias_type) VALUES
-- Chiefs
(14, 'chiefs', 'nickname'),
(14, 'kansas city chiefs', 'full_name'),
(14, 'kc', 'abbreviation'),
(14, 'kansas city', 'city'),

-- Cowboys
(17, 'cowboys', 'nickname'),
(17, 'dallas cowboys', 'full_name'),
(17, 'america\'s team', 'nickname'),
(17, 'dallas', 'city'),

-- Patriots
(3, 'patriots', 'nickname'),
(3, 'new england patriots', 'full_name'),
(3, 'pats', 'nickname'),
(3, 'new england', 'common'),

-- Packers
(23, 'packers', 'nickname'),
(23, 'green bay packers', 'full_name'),
(23, 'pack', 'nickname'),
(23, 'green bay', 'city'),

-- Steelers
(8, 'steelers', 'nickname'),
(8, 'pittsburgh steelers', 'full_name'),
(8, 'steel curtain', 'nickname'),
(8, 'pittsburgh', 'city'),

-- 49ers
(31, '49ers', 'nickname'),
(31, 'san francisco 49ers', 'full_name'),
(31, 'niners', 'nickname'),
(31, 'san francisco', 'city'),

-- Bills
(1, 'bills', 'nickname'),
(1, 'buffalo bills', 'full_name'),
(1, 'buffalo', 'city'),

-- Eagles
(19, 'eagles', 'nickname'),
(19, 'philadelphia eagles', 'full_name'),
(19, 'philly', 'nickname'),
(19, 'philadelphia', 'city');

-- Insert Placeholder Players (famous NFL players)
INSERT INTO players (id, name, first_name, last_name, team_id, position, jersey_number, birth_date, height_inches, weight_lbs, college, nfl_debut, active) VALUES
-- Placeholder data - would be populated with actual NFL roster
(1, 'Patrick Mahomes', 'Patrick', 'Mahomes', 14, 'QB', 15, '1995-09-17', 75, 230, 'Texas Tech', '2017-09-07', TRUE),
(2, 'Josh Allen', 'Josh', 'Allen', 1, 'QB', 17, '1996-05-21', 77, 237, 'Wyoming', '2018-09-09', TRUE),
(3, 'Travis Kelce', 'Travis', 'Kelce', 14, 'TE', 87, '1989-10-05', 77, 250, 'Cincinnati', '2013-09-15', TRUE),
(4, 'Tyreek Hill', 'Tyreek', 'Hill', 2, 'WR', 10, '1994-03-01', 70, 185, 'West Alabama', '2016-09-11', TRUE),
(5, 'Aaron Rodgers', 'Aaron', 'Rodgers', 4, 'QB', 8, '1983-12-02', 74, 225, 'California', '2005-09-04', TRUE),
(6, 'Davante Adams', 'Davante', 'Adams', 15, 'WR', 17, '1992-12-24', 73, 215, 'Fresno State', '2014-09-28', TRUE),
(7, 'Cooper Kupp', 'Cooper', 'Kupp', 30, 'WR', 10, '1993-06-15', 74, 208, 'Eastern Washington', '2017-09-10', TRUE),
(8, 'Lamar Jackson', 'Lamar', 'Jackson', 5, 'QB', 8, '1997-01-07', 74, 212, 'Louisville', '2018-09-09', TRUE),
(9, 'Derrick Henry', 'Derrick', 'Henry', 12, 'RB', 22, '1994-01-04', 75, 247, 'Alabama', '2016-09-11', TRUE),
(10, 'Christian McCaffrey', 'Christian', 'McCaffrey', 31, 'RB', 23, '1996-06-07', 71, 205, 'Stanford', '2017-09-10', TRUE);

-- Insert Player Aliases (sample)
INSERT INTO player_aliases (player_id, alias, alias_type) VALUES
-- Patrick Mahomes
(1, 'mahomes', 'short_name'),
(1, 'patrick mahomes', 'full_name'),
(1, 'showtime', 'nickname'),

-- Josh Allen
(2, 'allen', 'short_name'),
(2, 'josh allen', 'full_name'),
(2, 'josh', 'nickname'),

-- Travis Kelce
(3, 'kelce', 'short_name'),
(3, 'travis kelce', 'full_name'),
(3, 'trav', 'nickname'),

-- Tyreek Hill
(4, 'hill', 'short_name'),
(4, 'tyreek hill', 'full_name'),
(4, 'cheetah', 'nickname'),

-- Aaron Rodgers
(5, 'rodgers', 'short_name'),
(5, 'aaron rodgers', 'full_name'),
(5, 'a-rod', 'nickname'),

-- Davante Adams
(6, 'adams', 'short_name'),
(6, 'davante adams', 'full_name'),
(6, 'tae', 'nickname'),

-- Cooper Kupp
(7, 'kupp', 'short_name'),
(7, 'cooper kupp', 'full_name'),
(7, 'coop', 'nickname'),

-- Lamar Jackson
(8, 'jackson', 'short_name'),
(8, 'lamar jackson', 'full_name'),
(8, 'lamar', 'nickname'),

-- Derrick Henry
(9, 'henry', 'short_name'),
(9, 'derrick henry', 'full_name'),
(9, 'king henry', 'nickname'),

-- Christian McCaffrey
(10, 'mccaffrey', 'short_name'),
(10, 'christian mccaffrey', 'full_name'),
(10, 'cmc', 'nickname');

-- Insert Placeholder Current Season Stats (2024)
INSERT INTO player_stats (player_id, season, team_id, games_played, passing_yards, passing_tds, interceptions, rushing_yards, rushing_tds, receiving_yards, receiving_tds, receptions, fantasy_points) VALUES
(1, 2024, 14, 16, 4200, 32, 8, 420, 4, 0, 0, 0, 385.2), -- Mahomes
(2, 2024, 1, 15, 3900, 28, 12, 480, 8, 0, 0, 0, 342.8), -- Allen
(3, 2024, 14, 16, 0, 0, 0, 0, 0, 1150, 12, 95, 287.0), -- Kelce
(4, 2024, 2, 14, 0, 0, 0, 45, 1, 1320, 8, 88, 264.5), -- Hill
(5, 2024, 4, 12, 2800, 22, 9, 35, 1, 0, 0, 0, 245.5), -- Rodgers
(6, 2024, 15, 15, 0, 0, 0, 25, 0, 1280, 10, 92, 258.0), -- Adams
(7, 2024, 30, 13, 0, 0, 0, 15, 0, 1050, 8, 85, 225.0), -- Kupp
(8, 2024, 5, 14, 2850, 18, 10, 850, 5, 0, 0, 0, 298.0), -- Jackson
(9, 2024, 12, 16, 0, 0, 0, 1200, 12, 180, 1, 15, 264.0), -- Henry
(10, 2024, 31, 13, 0, 0, 0, 980, 8, 520, 3, 45, 236.0); -- McCaffrey