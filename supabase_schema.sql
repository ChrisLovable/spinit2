-- Simplified Supabase Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    photo TEXT,
    description TEXT NOT NULL,
    prize_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ticket_price DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    spin_date DATE NOT NULL,
    spin_time TIME NOT NULL,
    spin_datetime TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    winning_number INTEGER,
    winner_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User entries table
CREATE TABLE IF NOT EXISTS user_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    entry_number INTEGER NOT NULL CHECK (entry_number >= 1 AND entry_number <= 20),
    player_name VARCHAR(255) NOT NULL,
    payment_transaction_id VARCHAR(255),
    payment_amount DECIMAL(10, 2),
    payment_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spin results table
CREATE TABLE IF NOT EXISTS spin_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    winning_number INTEGER NOT NULL CHECK (winning_number >= 1 AND winning_number <= 20),
    spin_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Winners table
CREATE TABLE IF NOT EXISTS winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    spin_result_id UUID NOT NULL REFERENCES spin_results(id) ON DELETE CASCADE,
    user_entry_id UUID NOT NULL REFERENCES user_entries(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    winning_number INTEGER NOT NULL CHECK (winning_number >= 1 AND winning_number <= 20),
    won_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_user_entries_competition ON user_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_user_entries_number ON user_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_spin_results_competition ON spin_results(competition_id);
CREATE INDEX IF NOT EXISTS idx_winners_competition ON winners(competition_id);
