-- Rollback: Phase 1 Foundation
-- Reverts changes from 001_phase1_foundation.sql

BEGIN;

-- Drop functions
DROP FUNCTION IF EXISTS update_pending_with_version(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_next_receipt_number();

-- Drop indexes (Cascaded by dropping columns, but good to be explicit if needed, though DROP COLUMN handles it)
-- DROP INDEX IF EXISTS idx_expenses_content_hash;
-- DROP INDEX IF EXISTS idx_expenses_queue_position;
-- DROP INDEX IF EXISTS idx_expenses_receipt_session_id;

-- Drop columns
ALTER TABLE expenses
DROP COLUMN IF EXISTS content_hash,
DROP COLUMN IF EXISTS row_version,
DROP COLUMN IF EXISTS queue_position,
DROP COLUMN IF EXISTS receipt_session_id;

COMMIT;
