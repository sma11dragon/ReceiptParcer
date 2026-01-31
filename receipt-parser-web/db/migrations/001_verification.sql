-- Verification: Phase 1 Foundation
-- Checks if columns and functions exist

-- 1. Check columns in expenses table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('receipt_session_id', 'queue_position', 'row_version', 'content_hash');

-- 2. Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'expenses' 
AND indexname IN ('idx_expenses_receipt_session_id', 'idx_expenses_queue_position', 'idx_expenses_content_hash');

-- 3. Check functions
SELECT 
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_next_receipt_number', 'update_pending_with_version');
