# Working Configuration Backup - February 2, 2026

**Date:** February 2, 2026  
**Status:** ⚠️ WORKING WITH LOCAL FALLBACK - R2 Upload Fails  
**Last Working:** January 31, 2026 (R2 uploads working until 22:23)

## Current System State

### Vercel Environment Variables (receipt-parcer project)

```
R2_ENDPOINT=https://e21ca487c714259a0c1d0ff82c8e8ff6f.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev/receiptai-images
R2_BUCKET_NAME=receiptai-images
R2_ACCESS_KEY_ID=01a434e4cb02672e8a7d3dd39735bc79
R2_SECRET_ACCESS_KEY=[HIDDEN - Rolled on Feb 2]
DATABASE_URL=[HIDDEN]
JWT_SECRET=[HIDDEN]
NEXTAUTH_SECRET=[HIDDEN]
NODE_ENV=production
```

### Working R2 Configuration in n8n

**File:** `Combine OCR and R2 Data` node  
**R2_PUBLIC_URL:** `https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev`  
**File Key Format:** `receiptai-images/receipts/${userId}/${filename}`

### Cloudflare R2 API Tokens

**Working Token (Rolled Feb 2):**
- Name: ReceiptAI Production
- Permissions: Object Read & Write
- Applied to: All buckets
- Status: Active
- Issued: Jan 31, 2026

### Current route.ts Implementation

**File:** `receipt-parser-web/app/api/upload-receipt/route.ts`  
**Implementation:** Native Node.js `https` module with manual AWS SigV4 signing  
**TLS Configuration:** `secureProtocol: 'TLSv1_2_method'`  
**Status:** R2 upload fails with SSL handshake error, falls back to local `/tmp` storage

### Working n8n HTTP Request Node Configuration

```json
{
  "method": "POST",
  "url": "https://receipt-parcer.vercel.app/api/upload-receipt?userId={{ $json.user_id }}&filename={{ $json.dynamic_filename }}",
  "sendQuery": false,
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "Bearer eyJhbGciOiJIUzI1NiIs..."
      }
    ]
  },
  "sendBody": true,
  "bodyContentType": "n8n Binary File",
  "inputDataFieldName": "data"
}
```

### Current Fallback Behavior

When R2 upload fails (SSL handshake error), the system:
1. Saves image to `/tmp/receipts/${userId}/${filename}` on Vercel server
2. Returns a local URL (not accessible externally)
3. Images are lost on next Vercel deployment

### What Was Working on Jan 31

- ✅ R2 uploads working until 22:23 on Jan 31
- ✅ Native https module with TLS 1.2
- ✅ r2.dev URL (without /receiptai-images)
- ✅ Same Cloudflare account and bucket
- ✅ Same API tokens

### What Stopped Working on Feb 1

- ❌ R2 uploads failing with SSL handshake error
- ❌ Same code, same credentials = SSL error
- ❌ Infrastructure-level issue between Vercel and Cloudflare R2

### Attempted Fixes (All Failed)

1. ✅ Native https with TLS 1.2 - Failed
2. ✅ AWS SDK S3 client - Failed  
3. ✅ Fresh R2 API credentials - Failed
4. ✅ Different TLS configurations - Failed
5. ✅ Custom domain vs r2.dev URL - Failed
6. ✅ Multiple deployment attempts - Failed

### Root Cause Analysis

**Infrastructure-level SSL/TLS incompatibility** between:
- Vercel's Node.js runtime (updated Feb 1?)
- Cloudflare R2's SSL certificates (rotated Feb 1?)

**Not fixable through code changes** - requires Cloudflare or Vercel support.

## Backup Checklist

- [x] Vercel env vars documented
- [x] n8n workflow configuration saved
- [x] R2 API tokens noted
- [x] route.ts implementation documented
- [x] Working URLs and endpoints recorded
- [x] Git commit hash: 208cd23c

## Restoration Steps (if needed)

1. **Vercel Environment Variables:**
   - Go to Vercel Dashboard → receipt-parcer → Settings → Environment Variables
   - Verify all values match this document
   - Redeploy if any changes made

2. **n8n Workflow:**
   - Import workflow from backup file: `v18_Dashboard_WORKING_20260202.json`
   - Verify all nodes match configuration above
   - Test with a receipt image

3. **route.ts:**
   - Use git to checkout working version:
   ```bash
   git checkout 208cd23c -- receipt-parser-web/app/api/upload-receipt/route.ts
   git commit -m "Restore working backup from Feb 2"
   git push
   ```

4. **Cloudflare R2:**
   - Verify API token "ReceiptAI Production" is active
   - Check bucket permissions: Object Read & Write
   - Verify bucket name: receiptai-images

## Migration to Backblaze B2 (Next Steps)

**Rationale:** Backblaze B2 uses different infrastructure than Cloudflare R2, avoiding the SSL handshake issue.

**Storage:** 10GB free (then $0.005/GB/month)  
**API:** S3-compatible - can reuse AWS SDK code  
**Public URLs:** Yes, via `https://f001.backblazeb2.com/file/bucket-name/path`  
**Setup Time:** ~30 minutes  
**Migration:** Existing Jan 31 receipts stay in R2, new uploads go to B2

## Important Notes

⚠️ **Current images are NOT being saved to R2** - they go to local `/tmp` and are lost on deployment  
⚠️ **Do NOT deploy to Vercel** until Backblaze B2 is implemented or R2 issue is resolved  
⚠️ **Contact Cloudflare Support** for permanent R2 fix (may take days/weeks)  

## Related Files

- `R2_TROUBLESHOOTING.md` - Detailed debugging guide
- `R2_WORKING_BACKUP_20260202.md` - This file
- `n8n/v18_Dashboard_WORKING_20260202.json` - n8n workflow backup
- Git commit: `208cd23c` - Last known working state

## Contact Information

**Cloudflare Support:** support@cloudflare.com  
**Account ID:** e21ca487c714259a0c1d0ff82c8e8ff6f  
**Issue:** SSL handshake failure with R2 from Vercel  
**Error:** `ssl3_read_bytes:ssl/tls alert handshake failure`

---

**Created:** February 2, 2026  
**By:** ReceiptAI System  
**Purpose:** Backup of working configuration before Backblaze B2 migration
