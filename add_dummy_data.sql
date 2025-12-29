-- ADD DUMMY DATA FOR TESTING COMPETITION-ENTRY LINKING
-- This script adds sample competitions and entries with random images
-- Run this AFTER running FINAL_DATABASE_SETUP.sql
-- Run this in your Supabase SQL Editor

-- ============================================
-- PART 1: INSERT DUMMY COMPETITIONS
-- ============================================

-- Competition 1: Active competition with some entries
INSERT INTO competitions (
    id,
    title,
    photo,
    description,
    prize_value,
    ticket_price,
    spin_date,
    spin_time,
    spin_datetime,
    status,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Summer Cash Prize Draw',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop',
    'Win big this summer! Enter now for a chance to win cash prizes. Perfect for your summer vacation fund.',
    5000.00,
    100.00,
    CURRENT_DATE + INTERVAL '7 days',
    '18:00:00',
    (CURRENT_DATE + INTERVAL '7 days')::timestamp + TIME '18:00:00',
    'active',
    NOW() - INTERVAL '5 days'
);

-- Competition 2: Active competition with more entries
INSERT INTO competitions (
    id,
    title,
    photo,
    description,
    prize_value,
    ticket_price,
    spin_date,
    spin_time,
    spin_datetime,
    status,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Luxury Watch Giveaway',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
    'Win a premium luxury watch worth thousands! Limited edition timepiece for the winner.',
    8500.00,
    150.00,
    CURRENT_DATE + INTERVAL '10 days',
    '20:00:00',
    (CURRENT_DATE + INTERVAL '10 days')::timestamp + TIME '20:00:00',
    'active',
    NOW() - INTERVAL '3 days'
);

-- Competition 3: Completed competition with winner
INSERT INTO competitions (
    id,
    title,
    photo,
    description,
    prize_value,
    ticket_price,
    spin_date,
    spin_time,
    spin_datetime,
    status,
    winning_number,
    winner_name,
    created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Holiday Shopping Spree',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop',
    'Complete your holiday shopping with this amazing cash prize! Perfect timing for the festive season.',
    3000.00,
    75.00,
    CURRENT_DATE - INTERVAL '5 days',
    '19:00:00',
    (CURRENT_DATE - INTERVAL '5 days')::timestamp + TIME '19:00:00',
    'completed',
    7,
    'JOHN SMITH',
    NOW() - INTERVAL '15 days'
);

-- Competition 4: Active competition with few entries
INSERT INTO competitions (
    id,
    title,
    photo,
    description,
    prize_value,
    ticket_price,
    spin_date,
    spin_time,
    spin_datetime,
    status,
    created_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Tech Gadgets Bundle',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop',
    'Win the latest tech gadgets including smartphone, tablet, and smartwatch! Tech enthusiast dream prize.',
    4500.00,
    120.00,
    CURRENT_DATE + INTERVAL '14 days',
    '17:30:00',
    (CURRENT_DATE + INTERVAL '14 days')::timestamp + TIME '17:30:00',
    'active',
    NOW() - INTERVAL '2 days'
);

-- Competition 5: Almost full competition
INSERT INTO competitions (
    id,
    title,
    photo,
    description,
    prize_value,
    ticket_price,
    spin_date,
    spin_time,
    spin_datetime,
    status,
    created_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'Dream Vacation Package',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
    'Win an all-expenses-paid vacation to paradise! Includes flights, hotel, and spending money.',
    10000.00,
    200.00,
    CURRENT_DATE + INTERVAL '3 days',
    '18:30:00',
    (CURRENT_DATE + INTERVAL '3 days')::timestamp + TIME '18:30:00',
    'active',
    NOW() - INTERVAL '7 days'
);

-- ============================================
-- PART 2: INSERT DUMMY ENTRIES FOR COMPETITION 1
-- ============================================

INSERT INTO user_entries (
    competition_id,
    entry_number,
    player_name,
    mobile_number,
    payment_transaction_id,
    payment_amount,
    payment_currency,
    payment_status,
    payment_completed_at,
    created_at
) VALUES
('11111111-1111-1111-1111-111111111111', 1, 'ALICE JOHNSON', '0821234567', 'PAY-001-001', 100.00, 'ZAR', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('11111111-1111-1111-1111-111111111111', 3, 'BOB WILLIAMS', '0832345678', 'PAY-001-003', 100.00, 'ZAR', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('11111111-1111-1111-1111-111111111111', 5, 'CAROL DAVIS', '0843456789', 'PAY-001-005', 100.00, 'ZAR', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('11111111-1111-1111-1111-111111111111', 7, 'DAVID BROWN', '0854567890', 'PAY-001-007', 100.00, 'ZAR', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('11111111-1111-1111-1111-111111111111', 9, 'EMMA WILSON', '0865678901', 'PAY-001-009', 100.00, 'ZAR', 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');

-- ============================================
-- PART 3: INSERT DUMMY ENTRIES FOR COMPETITION 2
-- ============================================

INSERT INTO user_entries (
    competition_id,
    entry_number,
    player_name,
    mobile_number,
    payment_transaction_id,
    payment_amount,
    payment_currency,
    payment_status,
    payment_completed_at,
    created_at
) VALUES
('22222222-2222-2222-2222-222222222222', 2, 'FRANK MILLER', '0876789012', 'PAY-002-002', 150.00, 'ZAR', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('22222222-2222-2222-2222-222222222222', 4, 'GRACE TAYLOR', '0887890123', 'PAY-002-004', 150.00, 'ZAR', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222', 6, 'HENRY ANDERSON', '0898901234', 'PAY-002-006', 150.00, 'ZAR', 'completed', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours'),
('22222222-2222-2222-2222-222222222222', 8, 'IRIS THOMAS', '0909012345', 'PAY-002-008', 150.00, 'ZAR', 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
('22222222-2222-2222-2222-222222222222', 10, 'JACK MARTINEZ', '0910123456', 'PAY-002-010', 150.00, 'ZAR', 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
('22222222-2222-2222-2222-222222222222', 12, 'KATE JACKSON', '0921234567', 'PAY-002-012', 150.00, 'ZAR', 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
('22222222-2222-2222-2222-222222222222', 14, 'LEO WHITE', '0932345678', 'PAY-002-014', 150.00, 'ZAR', 'completed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');

-- ============================================
-- PART 4: INSERT DUMMY ENTRIES FOR COMPETITION 3 (COMPLETED)
-- ============================================

INSERT INTO user_entries (
    competition_id,
    entry_number,
    player_name,
    mobile_number,
    payment_transaction_id,
    payment_amount,
    payment_currency,
    payment_status,
    payment_completed_at,
    created_at
) VALUES
('33333333-3333-3333-3333-333333333333', 1, 'MARY HARRIS', '0943456789', 'PAY-003-001', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('33333333-3333-3333-3333-333333333333', 2, 'NICK CLARK', '0954567890', 'PAY-003-002', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('33333333-3333-3333-3333-333333333333', 3, 'OLIVIA LEWIS', '0965678901', 'PAY-003-003', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('33333333-3333-3333-3333-333333333333', 4, 'PAUL ROBINSON', '0976789012', 'PAY-003-004', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
('33333333-3333-3333-3333-333333333333', 5, 'QUINN WALKER', '0987890123', 'PAY-003-005', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('33333333-3333-3333-3333-333333333333', 6, 'RACHEL HALL', '0998901234', 'PAY-003-006', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
('33333333-3333-3333-3333-333333333333', 7, 'JOHN SMITH', '1009012345', 'PAY-003-007', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('33333333-3333-3333-3333-333333333333', 8, 'SARAH ALLEN', '1010123456', 'PAY-003-008', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('33333333-3333-3333-3333-333333333333', 9, 'TOM YOUNG', '1021234567', 'PAY-003-009', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('33333333-3333-3333-3333-333333333333', 10, 'UNA KING', '1032345678', 'PAY-003-010', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('33333333-3333-3333-3333-333333333333', 11, 'VICTOR WRIGHT', '1043456789', 'PAY-003-011', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('33333333-3333-3333-3333-333333333333', 12, 'WENDY LOPEZ', '1054567890', 'PAY-003-012', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('33333333-3333-3333-3333-333333333333', 13, 'XAVIER HILL', '1065678901', 'PAY-003-013', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('33333333-3333-3333-3333-333333333333', 14, 'YVONNE SCOTT', '1076789012', 'PAY-003-014', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('33333333-3333-3333-3333-333333333333', 15, 'ZACH GREEN', '1087890123', 'PAY-003-015', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '20 hours'),
('33333333-3333-3333-3333-333333333333', 16, 'AMY ADAMS', '1098901234', 'PAY-003-016', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours'),
('33333333-3333-3333-3333-333333333333', 17, 'BEN BAKER', '1109012345', 'PAY-003-017', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '16 hours', NOW() - INTERVAL '16 hours'),
('33333333-3333-3333-3333-333333333333', 18, 'CHLOE NELSON', '1110123456', 'PAY-003-018', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '14 hours'),
('33333333-3333-3333-3333-333333333333', 19, 'DAN CARTER', '1121234567', 'PAY-003-019', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
('33333333-3333-3333-3333-333333333333', 20, 'ELLA MITCHELL', '1132345678', 'PAY-003-020', 75.00, 'ZAR', 'completed', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours');

-- ============================================
-- PART 5: INSERT DUMMY ENTRIES FOR COMPETITION 4
-- ============================================

INSERT INTO user_entries (
    competition_id,
    entry_number,
    player_name,
    mobile_number,
    payment_transaction_id,
    payment_amount,
    payment_currency,
    payment_status,
    payment_completed_at,
    created_at
) VALUES
('44444444-4444-4444-4444-444444444444', 1, 'FIONA TURNER', '1143456789', 'PAY-004-001', 120.00, 'ZAR', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('44444444-4444-4444-4444-444444444444', 3, 'GARY PHILLIPS', '1154567890', 'PAY-004-003', 120.00, 'ZAR', 'completed', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours');

-- ============================================
-- PART 6: INSERT DUMMY ENTRIES FOR COMPETITION 5 (ALMOST FULL)
-- ============================================

INSERT INTO user_entries (
    competition_id,
    entry_number,
    player_name,
    mobile_number,
    payment_transaction_id,
    payment_amount,
    payment_currency,
    payment_status,
    payment_completed_at,
    created_at
) VALUES
('55555555-5555-5555-5555-555555555555', 1, 'HELEN CAMPBELL', '1165678901', 'PAY-005-001', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('55555555-5555-5555-5555-555555555555', 2, 'IAN PARKER', '1176789012', 'PAY-005-002', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('55555555-5555-5555-5555-555555555555', 3, 'JANE EVANS', '1187890123', 'PAY-005-003', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('55555555-5555-5555-5555-555555555555', 4, 'KEVIN EDWARDS', '1198901234', 'PAY-005-004', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('55555555-5555-5555-5555-555555555555', 5, 'LISA COLLINS', '1209012345', 'PAY-005-005', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('55555555-5555-5555-5555-555555555555', 6, 'MARK STEWART', '1210123456', 'PAY-005-006', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('55555555-5555-5555-5555-555555555555', 7, 'NINA MORRIS', '1221234567', 'PAY-005-007', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '20 hours'),
('55555555-5555-5555-5555-555555555555', 8, 'OSCAR ROGERS', '1232345678', 'PAY-005-008', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours'),
('55555555-5555-5555-5555-555555555555', 9, 'PENNY REED', '1243456789', 'PAY-005-009', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '16 hours', NOW() - INTERVAL '16 hours'),
('55555555-5555-5555-5555-555555555555', 10, 'QUINN COOK', '1254567890', 'PAY-005-010', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '14 hours'),
('55555555-5555-5555-5555-555555555555', 11, 'RITA MORGAN', '1265678901', 'PAY-005-011', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
('55555555-5555-5555-5555-555555555555', 12, 'SAM BELL', '1276789012', 'PAY-005-012', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),
('55555555-5555-5555-5555-555555555555', 13, 'TINA MURPHY', '1287890123', 'PAY-005-013', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),
('55555555-5555-5555-5555-555555555555', 14, 'ULYSSES BAILEY', '1298901234', 'PAY-005-014', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
('55555555-5555-5555-5555-555555555555', 15, 'VIVIAN RIVERA', '1309012345', 'PAY-005-015', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
('55555555-5555-5555-5555-555555555555', 16, 'WALTER COOPER', '1310123456', 'PAY-005-016', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('55555555-5555-5555-5555-555555555555', 17, 'XARA RICHARDSON', '1321234567', 'PAY-005-017', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
('55555555-5555-5555-5555-555555555555', 18, 'YASMIN COX', '1332345678', 'PAY-005-018', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
('55555555-5555-5555-5555-555555555555', 19, 'ZOE HOWARD', '1343456789', 'PAY-005-019', 200.00, 'ZAR', 'completed', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes');

-- ============================================
-- PART 7: VERIFICATION QUERIES
-- ============================================

-- Show all competitions with their entry counts
SELECT 
    c.id,
    c.title,
    c.status,
    COUNT(ue.id) as total_entries,
    COUNT(DISTINCT ue.entry_number) as unique_numbers_sold,
    c.prize_value,
    c.ticket_price
FROM competitions c
LEFT JOIN user_entries ue ON c.id = ue.competition_id AND ue.payment_status = 'completed'
GROUP BY c.id, c.title, c.status, c.prize_value, c.ticket_price
ORDER BY c.created_at DESC;

-- Show entries for each competition
SELECT 
    c.title as competition_title,
    ue.entry_number,
    ue.player_name,
    ue.mobile_number,
    ue.payment_amount,
    ue.payment_completed_at
FROM competitions c
JOIN user_entries ue ON c.id = ue.competition_id
WHERE ue.payment_status = 'completed'
ORDER BY c.title, ue.entry_number;

-- Verify foreign key relationships
SELECT 
    'Foreign Key Check' as check_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN ue.competition_id IN (SELECT id FROM competitions) THEN 1 END) as valid_links,
    COUNT(CASE WHEN ue.competition_id NOT IN (SELECT id FROM competitions) THEN 1 END) as invalid_links
FROM user_entries ue;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Dummy data inserted successfully!' as status;
SELECT '✅ 5 competitions created with random images' as competitions;
SELECT '✅ Multiple entries linked to each competition' as entries;
SELECT '✅ All entries properly linked via foreign key' as linking;

