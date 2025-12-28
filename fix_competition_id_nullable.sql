-- Fix competition_id to allow NULL values
-- Run this in your Supabase SQL Editor

-- Make competition_id nullable (allow NULL)
ALTER TABLE user_entries 
ALTER COLUMN competition_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_entries' 
AND column_name = 'competition_id';

