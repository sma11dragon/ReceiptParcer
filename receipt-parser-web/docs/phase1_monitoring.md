# Phase 1: Monitoring Guide

## Key Metrics to Watch

### Database
- **Slow Queries**: Monitor `get_next_receipt_number()` in `pg_stat_statements`.
- **Lock Waits**: Check for blocks on `expenses` table due to `update_pending_with_version`.

### Workflow
- **Execution Time**: Average time from "Insert" to "Fix Message".
- **Error Rate**: Failed executions in n8n.

## Alerts
- **High Latency**: If Insert > 500ms.
- **Queue Backup**: If `queue_position` grows > 100 without processing (Phase 2 will handle this better).
