-- Hockey Resolver Database Schema
-- Creates player and team tables with comprehensive naming resolution

-- NHL Teams table with all naming variations
CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    city TEXT NOT NULL,
    division TEXT NOT NULL,
    conference TEXT NOT NULL CHECK (conference IN ('Eastern', 'Western')),
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

-- NHL Players table (placeholder structure)
CREATE TABLE players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    team_id INTEGER REFERENCES teams(id),
    position TEXT CHECK (position IN ('C', 'LW', 'RW', 'D', 'G')),
    jersey_number INTEGER,
    birth_date DATE,
    birth_city TEXT,
    birth_country TEXT,
    height_inches INTEGER,
    weight_lbs INTEGER,
    shoots TEXT CHECK (shoots IN ('L', 'R')),
    nhl_debut DATE,
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

-- Player statistics (current season summary) - placeholder
CREATE TABLE player_stats (
    player_id INTEGER NOT NULL REFERENCES players(id),
    season TEXT NOT NULL, -- e.g., '2024-25'
    team_id INTEGER REFERENCES teams(id),
    games_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    plus_minus INTEGER DEFAULT 0,
    penalty_minutes INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    shooting_percentage REAL DEFAULT 0.0,
    time_on_ice_per_game REAL DEFAULT 0.0,
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