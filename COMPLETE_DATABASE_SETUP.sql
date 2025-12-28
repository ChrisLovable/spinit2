-- COMPLETE DATABASE SETUP FOR PAYMENT SAVING
-- Run ALL of this in your Supabase SQL Editor

-- Step 1: Fix competition_id to allow NULL
ALTER TABLE user_entries 
ALTER COLUMN competition_id DROP NOT NULL;

-- Step 2: Enable RLS on user_entries
ALTER TABLE user_entries ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public inserts to user_entries" ON user_entries;
DROP POLICY IF EXISTS "Allow public selects from user_entries" ON user_entries;

-- Step 4: Create INSERT policy (allows anyone to insert payments)
CREATE POLICY "Allow public inserts to user_entries"
ON user_entries
FOR INSERT
TO public
WITH CHECK (true);

-- Step 5: Create SELECT policy (allows anyone to read entries)
CREATE POLICY "Allow public selects from user_entries"
ON user_entries
FOR SELECT
TO public
USING (true);

-- Step 6: Verify the setup
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_entries';

-- Step 7: Test insert (should work now)
-- Uncomment the line below to test:
-- INSERT INTO user_entries (entry_number, player_name, payment_status) VALUES (1, 'Test User', 'completed') RETURNING *;

