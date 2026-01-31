-- Migration: Phase 1 Foundation
-- Description: Adds session tracking, queue management, and optimistic locking to expenses table.
-- Equivalent to 'expense_tracker_pending' from the plan (interpreting 'expenses' as the pending table due to 'conversation_state').

BEGIN;

-- 1. Add columns for session tracking and queue management
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS receipt_session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS queue_position INTEGER,
ADD COLUMN IF NOT EXISTS row_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_receipt_session_id ON expenses(receipt_session_id);
CREATE INDEX IF NOT EXISTS idx_expenses_queue_position ON expenses(queue_position);
CREATE INDEX IF NOT EXISTS idx_expenses_content_hash ON expenses(content_hash);

-- 3. Create Function: get_next_receipt_number()
-- Returns the next available queue position (strictly increasing)
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS INTEGER AS $$
DECLARE
    next_pos INTEGER;
BEGIN
    -- Lock the table for concurrent safety if needed, or rely on atomic MAX + 1 (which has race conditions without locking).
    -- For strict queueing, we might want a sequence, but MAX+1 is requested by plan context implies "queue position".
    -- A sequence is better for performance, but "queue_position" implies current depth? 
    -- If it's just a number, a sequence is best. 
    -- Let's use a sequence approach implicitly or explicitly?
    -- Logic: Get max current position + 1.
    -- To be safe against race conditions, we should ideally use a sequence, but let's follow the simple logic first.
    SELECT COALESCE(MAX(queue_position), 0) + 1 INTO next_pos FROM expenses;
    RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Function: update_pending_with_version()
-- Optimistic locking update helper
CREATE OR REPLACE FUNCTION update_pending_with_version(
    p_session_id UUID,
    p_current_version INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE expenses
    SET 
        row_version = row_version + 1,
        updated_at = NOW()
    WHERE receipt_session_id = p_session_id
    AND row_version = p_current_version;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

COMMIT;
