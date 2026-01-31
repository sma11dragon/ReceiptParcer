# Phase 1: Deployment Runbook

## Pre-Deployment
1.  **Backup**: Run full database backup.
2.  **Notification**: Inform users of 15m maintenance window.

## Deployment Steps
1.  **Database Migration**
    ```bash
    psql -d production_db -f db/migrations/001_phase1_foundation.sql
    ```
2.  **Verify Database**
    ```bash
    psql -d production_db -f db/migrations/001_verification.sql
    ```
3.  **Deploy Workflow**
    - Import `workflows/v18_phase1_updates.json` into n8n.
    - Activate workflow.

## Post-Deployment
1.  **Smoke Test**: Upload unique receipt.
2.  **Verify**: Check "Fix Message" appears with Queue Position.
3.  **Monitor**: Watch logs for 30 mins.
