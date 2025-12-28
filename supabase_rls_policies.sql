-- Row Level Security (RLS) Policies for Supabase
-- Run this in your Supabase SQL Editor to allow inserts/selects

-- Enable RLS on user_entries table
ALTER TABLE user_entries ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert entries (for payments)
CREATE POLICY "Allow public inserts to user_entries"
ON user_entries
FOR INSERT
TO public
WITH CHECK (true);

-- Policy to allow anyone to select entries (to see paid names)
CREATE POLICY "Allow public selects from user_entries"
ON user_entries
FOR SELECT
TO public
USING (true);

-- Enable RLS on competitions table
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to select competitions
CREATE POLICY "Allow public selects from competitions"
ON competitions
FOR SELECT
TO public
USING (true);

-- Policy to allow anyone to insert competitions (for admin)
CREATE POLICY "Allow public inserts to competitions"
ON competitions
FOR INSERT
TO public
WITH CHECK (true);

