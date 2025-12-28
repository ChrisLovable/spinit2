-- SQL to remove unused tables from Supabase database
-- Run this in your Supabase SQL Editor

-- Drop winners table (if it exists)
DROP TABLE IF EXISTS winners CASCADE;

-- Drop spin_results table (if it exists)
DROP TABLE IF EXISTS spin_results CASCADE;

-- Verify tables were removed (optional - run to check)
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('winners', 'spin_results');

