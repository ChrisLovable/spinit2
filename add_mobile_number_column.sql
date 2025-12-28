-- Add mobile_number column to user_entries table
-- This migration adds the mobile_number column if it doesn't exist

-- For Supabase/PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_entries' 
        AND column_name = 'mobile_number'
    ) THEN
        ALTER TABLE user_entries ADD COLUMN mobile_number VARCHAR(20);
    END IF;
END $$;

-- For MySQL (if using MySQL instead)
-- ALTER TABLE user_entries ADD COLUMN mobile_number VARCHAR(20);

