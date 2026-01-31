#!/usr/bin/env python3
"""
ReceiptAI n8n Workflow Migration Script - Usage Guide
This script updates the n8n Dashboard workflow to use Cloudflare R2 instead of Google Drive
"""

# USAGE INSTRUCTIONS:
# 
# 1. Make sure you have Python 3 installed
#    python3 --version
#
# 2. Navigate to the project directory:
#    cd "/Users/siewloongchan/Documents/AI Projects/Receipts Parsing"
#
# 3. Run the script:
#    python3 migrate_to_r2.py
#
# 4. The script will:
#    ✅ Create a backup of your original workflow
#    ✅ Generate a new workflow file with R2 nodes
#    ✅ Update (or create) .env.local with R2 configuration
#    ✅ Create lib/storage.ts helper file
#
# 5. Review the output and follow the next steps shown

# WHAT THE SCRIPT DOES:
#
# 1. BACKUP:
#    - Creates timestamped backup of v18 Dashboard - Telegram Chat ID Fix.json
#    - Creates backup of existing .env.local (if exists)
#    - Creates backup of existing lib/storage.ts (if exists)
#
# 2. N8N WORKFLOW CHANGES:
#    - Replaces "Upload to Google Drive" node with "Upload to R2" (AWS S3 node)
#    - Deletes "Make File Shareable" node (not needed with R2)
#    - Updates "Combine OCR and Drive Data" code to generate R2 URLs
#    - Updates node connections to link: Build Filename → Upload to R2 → Combine OCR
#
# 3. ENVIRONMENT VARIABLES:
#    - R2_ACCOUNT_ID
#    - R2_BUCKET_NAME
#    - R2_ENDPOINT
#    - R2_PUBLIC_URL
#    (Note: You'll need to manually add R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)
#
# 4. STORAGE HELPER:
#    - Creates lib/storage.ts with getReceiptImageUrl() function
#    - Handles both R2 and Google Drive URLs
#    - Provides backward compatibility

# POST-SCRIPT ACTIONS REQUIRED:
#
# 1. Add R2 credentials in n8n:
#    - Go to n8n Settings > Credentials
#    - Add new credential: AWS
#    - Name: "R2 S3 Credentials"
#    - Access Key ID: [Your R2 Access Key]
#    - Secret Access Key: [Your R2 Secret]
#    - Region: auto
#    - Endpoint: https://e21ca487c714259a0c1d0ff82c8eff6f.r2.cloudflarestorage.com
#
# 2. Update .env.local with secrets:
#    - Open receipt-parser-web/.env.local
#    - Add: R2_ACCESS_KEY_ID=your_actual_access_key
#    - Add: R2_SECRET_ACCESS_KEY=your_actual_secret_key
#
# 3. Import updated workflow:
#    - In n8n: Workflows > Import > From File
#    - Select: n8n/v18 Dashboard - Telegram Chat ID Fix.r2-migrated.json
#
# 4. Test:
#    - Send test receipt via Telegram
#    - Verify it appears in R2 dashboard
#    - Check that URL works without authentication

# SAFETY NOTES:
#
# ✅ Original workflow is backed up before any changes
# ✅ New workflow is saved with .r2-migrated.json suffix (original untouched)
# ✅ Database schema remains unchanged (backward compatible)
# ✅ Old Google Drive receipts continue to work
# ✅ Can rollback by re-importing original workflow

print(__doc__)
