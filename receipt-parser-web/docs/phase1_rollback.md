# Phase 1: Rollback Procedure

## Triggers
- High error rate in n8n (>5%).
- Database locking issues.
- User complaints of lost receipts.

## Steps
1.  **Stop Workflow**
    - Deactivate v18 workflow in n8n.
    - Revert to v17 (previous version).
2.  **Revert Database**
    ```bash
    psql -d production_db -f db/migrations/001_rollback.sql
    ```
    *Note: This drops new columns. Data in `queue_position` will be lost.*
3.  **Verify Reversion**
    - Check `expenses` table columns.
4.  **Restart Service**
    - Activate v17 workflow.

## Communication
- Notify users identifying the issue and rollback status.
