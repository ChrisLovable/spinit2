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

-- User entries table (stores payment/entry data)
CREATE TABLE IF NOT EXISTS user_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE, -- NULL allowed for temp competitions
    entry_number INTEGER NOT NULL CHECK (entry_number >= 1 AND entry_number <= 20),
    player_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20),
    payment_transaction_id VARCHAR(255),
    payment_amount DECIMAL(10, 2),
    payment_currency VARCHAR(10),
    payment_status VARCHAR(50) DEFAULT 'completed',
    payment_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure competition_id allows NULL (in case table already exists)
-- This is safe to run multiple times
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_entries' 
        AND column_name = 'competition_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE user_entries ALTER COLUMN competition_id DROP NOT NULL;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_user_entries_competition ON user_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_user_entries_number ON user_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_user_entries_payment_status ON user_entries(payment_status);
