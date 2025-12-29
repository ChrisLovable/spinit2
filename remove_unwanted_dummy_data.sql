-- REMOVE UNWANTED DUMMY DATA
-- This script removes "delete me" dummy data and beer competitions
-- Keeps only the proper dummy data created in add_dummy_data.sql
-- Run this in your Supabase SQL Editor

-- ============================================
-- PART 1: FIND COMPETITIONS TO DELETE
-- ============================================

-- Show competitions that will be deleted
SELECT 
    id,
    title,
    status,
    created_at
FROM competitions
WHERE 
    LOWER(title) LIKE '%delete me%' 
    OR LOWER(title) LIKE '%beer%'
ORDER BY created_at;

-- ============================================
-- PART 2: DELETE ENTRIES FIRST (due to foreign key)
-- ============================================

-- Delete entries for competitions with "delete me" or "beer" in title
DELETE FROM user_entries
WHERE competition_id IN (
    SELECT id 
    FROM competitions 
    WHERE 
        LOWER(title) LIKE '%delete me%' 
        OR LOWER(title) LIKE '%beer%'
);

-- ============================================
-- PART 3: DELETE THE COMPETITIONS
-- ============================================

-- Delete competitions with "delete me" or "beer" in title
DELETE FROM competitions
WHERE 
    LOWER(title) LIKE '%delete me%' 
    OR LOWER(title) LIKE '%beer%';

-- ============================================
-- PART 4: VERIFICATION
-- ============================================

-- Show remaining competitions (should only have the proper dummy data)
SELECT 
    id,
    title,
    status,
    (SELECT COUNT(*) FROM user_entries WHERE competition_id = competitions.id) as entry_count,
    created_at
FROM competitions
ORDER BY created_at DESC;

-- Show count of remaining competitions
SELECT 
    'Remaining competitions' as info,
    COUNT(*) as count
FROM competitions;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Unwanted dummy data removed!' as status;
SELECT '✅ "Delete me" and "beer" competitions deleted' as cleanup;
SELECT '✅ Proper dummy data kept (Summer Cash, Luxury Watch, Holiday Shopping, Tech Gadgets, Dream Vacation)' as kept;

