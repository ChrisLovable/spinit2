-- LINK COMPETITIONS AND USER_ENTRIES TABLES
-- This script ensures proper linking between competitions and entries
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state
SELECT 
    'Current state:' as info,
    (SELECT COUNT(*) FROM competitions) as total_competitions,
    (SELECT COUNT(*) FROM user_entries) as total_entries,
    (SELECT COUNT(*) FROM user_entries WHERE competition_id IS NULL) as entries_without_competition,
    (SELECT COUNT(*) FROM user_entries WHERE competition_id IS NOT NULL) as entries_with_competition;

-- Step 2: Remove orphaned entries (entries with invalid or non-existent competition_id)
-- This deletes entries that reference competitions that don't exist
DELETE FROM user_entries 
WHERE competition_id IS NOT NULL 
AND competition_id NOT IN (SELECT id FROM competitions);

-- Step 3: Clear all entries that don't have a valid competition_id
-- This ensures all future entries will be properly linked
DELETE FROM user_entries 
WHERE competition_id IS NULL;

-- Step 4: Ensure foreign key constraint exists and is properly set up
-- Drop existing constraint if it exists (to recreate it properly)
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_entries_competition_id_fkey'
        AND table_name = 'user_entries'
    ) THEN
        -- Drop existing constraint
        ALTER TABLE user_entries 
        DROP CONSTRAINT user_entries_competition_id_fkey;
    END IF;
    
    -- Recreate foreign key constraint with proper ON DELETE CASCADE
    ALTER TABLE user_entries
    ADD CONSTRAINT user_entries_competition_id_fkey 
    FOREIGN KEY (competition_id) 
    REFERENCES competitions(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint created/updated successfully';
END $$;

-- Step 5: Make competition_id required (NOT NULL) for new entries
-- This ensures all future entries must have a competition_id
DO $$
BEGIN
    -- Check if column is nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_entries' 
        AND column_name = 'competition_id'
        AND is_nullable = 'YES'
    ) THEN
        -- First, ensure no NULL values exist
        -- (We already deleted them in Step 3, but double-check)
        DELETE FROM user_entries WHERE competition_id IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE user_entries 
        ALTER COLUMN competition_id SET NOT NULL;
        
        RAISE NOTICE 'competition_id is now required (NOT NULL)';
    ELSE
        RAISE NOTICE 'competition_id is already NOT NULL';
    END IF;
END $$;

-- Step 6: Create index on competition_id for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_entries_competition_id 
ON user_entries(competition_id);

-- Step 7: Create a composite index for common queries (competition + entry number)
CREATE INDEX IF NOT EXISTS idx_user_entries_competition_entry 
ON user_entries(competition_id, entry_number);

-- Step 8: Verify the setup
SELECT 
    'Verification:' as info,
    (SELECT COUNT(*) FROM competitions) as total_competitions,
    (SELECT COUNT(*) FROM user_entries) as total_entries,
    (SELECT COUNT(*) FROM user_entries WHERE competition_id IS NULL) as entries_without_competition,
    (SELECT COUNT(*) FROM user_entries WHERE competition_id IS NOT NULL) as entries_with_competition;

-- Step 9: Show competitions with their entry counts
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

-- Step 10: Verify foreign key constraint
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

-- SUCCESS MESSAGE
SELECT '✅ Database linking complete! All entries are now properly linked to competitions.' as status;

