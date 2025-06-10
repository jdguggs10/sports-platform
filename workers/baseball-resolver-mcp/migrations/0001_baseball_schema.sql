-- Baseball Resolver Database Schema
-- Creates player and team tables with comprehensive naming resolution

-- MLB Teams table with all naming variations
CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    city TEXT NOT NULL,
    division TEXT NOT NULL,
    league TEXT NOT NULL CHECK (league IN ('AL', 'NL')),
    established INTEGER,
    venue TEXT,
    venue_capacity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team name aliases for resolution
CREATE TABLE team_aliases (
    team_id INTEGER NOT NULL REFERENCES teams(id),
    alias TEXT NOT NULL,
    alias_type TEXT NOT NULL CHECK (alias_type IN ('nickname', 'city', 'abbreviation', 'full_name', 'common')),
    PRIMARY KEY (team_id, alias)
);

-- MLB Players table
CREATE TABLE players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    team_id INTEGER REFERENCES teams(id),
    position TEXT,
    jersey_number INTEGER,
    birth_date DATE,
    birth_city TEXT,
    birth_country TEXT,
    height_inches INTEGER,
    weight_lbs INTEGER,
    bats TEXT CHECK (bats IN ('L', 'R', 'S')),
    throws TEXT CHECK (throws IN ('L', 'R')),
    mlb_debut DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player name aliases for resolution
CREATE TABLE player_aliases (
    player_id INTEGER NOT NULL REFERENCES players(id),
    alias TEXT NOT NULL,
    alias_type TEXT NOT NULL CHECK (alias_type IN ('nickname', 'full_name', 'short_name', 'common')),
    PRIMARY KEY (player_id, alias)
);

-- Player statistics (current season summary)
CREATE TABLE player_stats (
    player_id INTEGER NOT NULL REFERENCES players(id),
    season INTEGER NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    games_played INTEGER DEFAULT 0,
    at_bats INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbis INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    batting_average REAL DEFAULT 0.0,
    on_base_percentage REAL DEFAULT 0.0,
    slugging_percentage REAL DEFAULT 0.0,
    ops REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, season)
);

-- Create indexes for performance
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);
CREATE INDEX idx_teams_city ON teams(city);
CREATE INDEX idx_team_aliases_alias ON team_aliases(alias);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_player_aliases_alias ON player_aliases(alias);
CREATE INDEX idx_player_stats_season ON player_stats(season);

-- Triggers for updated timestamps
CREATE TRIGGER update_teams_timestamp 
    AFTER UPDATE ON teams
    BEGIN
        UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_players_timestamp 
    AFTER UPDATE ON players
    BEGIN
        UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_player_stats_timestamp 
    AFTER UPDATE ON player_stats
    BEGIN
        UPDATE player_stats SET updated_at = CURRENT_TIMESTAMP 
        WHERE player_id = NEW.player_id AND season = NEW.season;
    END;