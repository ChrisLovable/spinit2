-- CLEAR DATABASE AND LINK COMPETITIONS TO ENTRIES
-- ⚠️ WARNING: This will DELETE ALL existing entries!
-- Use this if you want to start fresh with proper linking
-- Run this in your Supabase SQL Editor

-- Step 1: Delete ALL existing entries (to start fresh)
DELETE FROM user_entries;

-- Step 2: Reset sequences (if using auto-increment, not needed for UUID)
-- Not needed for Supabase (uses UUID)

-- Step 3: Ensure foreign key constraint exists
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
    END IF;
    
    -- Recreate foreign key constraint
    ALTER TABLE user_entries
    ADD CONSTRAINT user_entries_competition_id_fkey 
    FOREIGN KEY (competition_id) 
    REFERENCES competitions(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint created successfully';
END $$;

-- Step 4: Make competition_id required (NOT NULL)
DO $$
BEGIN
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
    END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_entries_competition_id 
ON user_entries(competition_id);

CREATE INDEX IF NOT EXISTS idx_user_entries_competition_entry 
ON user_entries(competition_id, entry_number);

CREATE INDEX IF NOT EXISTS idx_user_entries_payment_status 
ON user_entries(payment_status);

-- Step 6: Verify setup
SELECT 
    'Database cleared and linked!' as status,
    (SELECT COUNT(*) FROM competitions) as total_competitions,
    (SELECT COUNT(*) FROM user_entries) as total_entries;

-- SUCCESS
SELECT '✅ Database cleared! All future entries will be properly linked to competitions.' as message;

