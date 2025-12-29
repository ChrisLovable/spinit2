-- FINAL DATABASE SETUP - LINK COMPETITIONS AND ENTRIES
-- This is the complete setup script that ensures proper linking
-- Run this in your Supabase SQL Editor

-- ============================================
-- PART 1: ENSURE TABLES EXIST WITH PROPER STRUCTURE
-- ============================================

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

-- User entries table with proper foreign key
CREATE TABLE IF NOT EXISTS user_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL, -- REQUIRED - no NULL allowed
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

-- ============================================
-- PART 2: CLEAN UP ORPHANED ENTRIES
-- ============================================

-- Delete entries that reference non-existent competitions
DELETE FROM user_entries 
WHERE competition_id IS NOT NULL 
AND competition_id NOT IN (SELECT id FROM competitions);

-- Delete entries without competition_id (they can't be linked)
DELETE FROM user_entries 
WHERE competition_id IS NULL;

-- ============================================
-- PART 3: SET UP FOREIGN KEY CONSTRAINT
-- ============================================

DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_entries_competition_id_fkey'
        AND table_name = 'user_entries'
    ) THEN
        ALTER TABLE user_entries 
        DROP CONSTRAINT user_entries_competition_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
    
    -- Recreate foreign key constraint with CASCADE
    ALTER TABLE user_entries
    ADD CONSTRAINT user_entries_competition_id_fkey 
    FOREIGN KEY (competition_id) 
    REFERENCES competitions(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint created successfully';
END $$;

-- ============================================
-- PART 4: ENSURE competition_id IS REQUIRED
-- ============================================

DO $$
BEGIN
    -- Make competition_id NOT NULL (required)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_entries' 
        AND column_name = 'competition_id'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE user_entries 
        ALTER COLUMN competition_id SET NOT NULL;
        
        RAISE NOTICE 'competition_id is now required (NOT NULL)';
    ELSE
        RAISE NOTICE 'competition_id is already NOT NULL';
    END IF;
END $$;

-- ============================================
-- PART 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_competitions_status 
ON competitions(status);

CREATE INDEX IF NOT EXISTS idx_user_entries_competition_id 
ON user_entries(competition_id);

CREATE INDEX IF NOT EXISTS idx_user_entries_entry_number 
ON user_entries(entry_number);

CREATE INDEX IF NOT EXISTS idx_user_entries_payment_status 
ON user_entries(payment_status);

CREATE INDEX IF NOT EXISTS idx_user_entries_competition_entry 
ON user_entries(competition_id, entry_number);

-- ============================================
-- PART 6: SET UP ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on user_entries
ALTER TABLE user_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public inserts to user_entries" ON user_entries;
DROP POLICY IF EXISTS "Allow public selects from user_entries" ON user_entries;

-- Create INSERT policy (allows anyone to insert entries)
CREATE POLICY "Allow public inserts to user_entries"
ON user_entries
FOR INSERT
TO public
WITH CHECK (true);

-- Create SELECT policy (allows anyone to read entries)
CREATE POLICY "Allow public selects from user_entries"
ON user_entries
FOR SELECT
TO public
USING (true);

-- Enable RLS on competitions
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public selects from competitions" ON competitions;
DROP POLICY IF EXISTS "Allow public inserts to competitions" ON competitions;

-- Create SELECT policy for competitions
CREATE POLICY "Allow public selects from competitions"
ON competitions
FOR SELECT
TO public
USING (true);

-- Create INSERT policy for competitions
CREATE POLICY "Allow public inserts to competitions"
ON competitions
FOR INSERT
TO public
WITH CHECK (true);

-- ============================================
-- PART 7: VERIFICATION
-- ============================================

-- Show current state
SELECT 
    'Database Setup Complete!' as status,
    (SELECT COUNT(*) FROM competitions) as total_competitions,
    (SELECT COUNT(*) FROM user_entries) as total_entries,
    (SELECT COUNT(*) FROM user_entries WHERE competition_id IS NULL) as orphaned_entries;

-- Show competitions with entry counts
SELECT 
    c.id,
    c.title,
    c.status,
    COUNT(ue.id) as total_entries,
    COUNT(DISTINCT ue.entry_number) as unique_numbers_sold
FROM competitions c
LEFT JOIN user_entries ue ON c.id = ue.competition_id AND ue.payment_status = 'completed'
GROUP BY c.id, c.title, c.status
ORDER BY c.created_at DESC;

-- Verify foreign key constraint
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_entries'
AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Database setup complete! Competitions and entries are now properly linked.' as message;
SELECT '✅ All future entries MUST have a valid competition_id.' as note;
SELECT '✅ Orphaned entries have been removed.' as cleanup;

