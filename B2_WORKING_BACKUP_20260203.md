# Working Configuration Backup - February 3, 2026 (B2 Working)

**Date:** February 3, 2026  
**Time:** Working confirmed at ~06:30 UTC  
**Status:** ✅ FULLY WORKING - Backblaze B2 Integration  
**Git Commit:** `50616d51` (before any future changes)

## System State

### Storage Solution: Backblaze B2 ✅
- **Status:** Working perfectly
- **Uploads:** Successful (verified with multiple receipts)
- **Public URLs:** Accessible
- **Free Tier:** 10GB available

### Working Receipt Upload Flow
1. ✅ Telegram bot receives image
2. ✅ n8n workflow processes image (OCR, compression)
3. ✅ HTTP Request to Vercel API
4. ✅ Vercel uploads to Backblaze B2
5. ✅ Public URL generated
6. ✅ Telegram bot responds with accessible URL

### Vercel Environment Variables (receipt-parcer project)

```env
# Backblaze B2 (NEW - Working)
B2_KEY_ID=005a1119bde3d4e0000000001
B2_APPLICATION_KEY=K005yuYkg7Tn9EYV2eAKAe0cEF3j7p0
B2_BUCKET_NAME=receiptai-images
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_PUBLIC_URL=https://s3.us-east-005.backblazeb2.com/receiptai-images
B2_REGION=us-east-005

# Cloudflare R2 (LEGACY - Keep for old receipts)
R2_PUBLIC_URL=https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev/receiptai-images
R2_BUCKET_NAME=receiptai-images
R2_ENDPOINT=https://e21ca487c714259a0c1d0ff82c8e8ff6f.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=01a434e4cb02672e8a7d3dd39735bc79
R2_SECRET_ACCESS_KEY=[HIDDEN - Rolled Feb 2]

# Other (unchanged)
DATABASE_URL=[HIDDEN]
JWT_SECRET=[HIDDEN]
NEXTAUTH_SECRET=[HIDDEN]
NODE_ENV=production
```

### Backblaze B2 Configuration

**Bucket Details:**
- Name: `receiptai-images`
- Region: `us-east-005`
- Type: Public
- Created: February 3, 2026
- Encryption: Enabled
- Status: Active and working

**API Key:**
- Name: Storage001
- Permissions: Read and Write
- Key ID: 005a1119bde3d4e0000000001
- Application Key: K005yuYkg7Tn9EYV2eAKAe0cEF3j7p0
- Status: Active

### n8n Workflow Configuration

#### "HTTP Request to Vercel" Node
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

#### "Combine OCR and R2 Data" Node (Working B2 Code)
```javascript
const botToken = $input.first().json.bot_token;
const parsingData = $('Parsing Success?').first().json;
const processImageData = $('Process Image').first().json;
const buildFilenameData = $('Build Filename from Parsed Data').first().json;

// Backblaze B2 Configuration - WORKING
const B2_PUBLIC_URL = 'https://s3.us-east-005.backblazeb2.com/receiptai-images';

// Get user ID and filename
const userId = processImageData.user_id;
const filename = buildFilenameData.dynamic_filename;

// Build B2 file key and public URL
const fileKey = `receipts/${userId}/${filename}`;
const b2Url = `${B2_PUBLIC_URL}/${fileKey}`;

// Merge ALL data
return [{
  json: {
    ...parsingData,
    chat_id: processImageData.chat_id,
    user_id: userId,
    telegram_user_id: processImageData.telegram_user_id,
    storage_provider: 'backblaze-b2',
    drive_file_id: fileKey,
    receipt_image_url: b2Url,
    receipt_direct_url: b2Url,
    file_name: filename,
    bot_token: botToken
  }
}];
```

### route.ts Implementation (Working B2 Version)

**File:** `receipt-parser-web/app/api/upload-receipt/route.ts`
**Implementation:** AWS SDK S3-compatible client with Backblaze B2
**Status:** Successfully uploads images to B2

**Key Features:**
- Uses AWS SDK @aws-sdk/client-s3
- B2 endpoint: `https://s3.us-east-005.backblazeb2.com`
- Compression with Sharp (65% quality JPEG)
- Public ACL for direct URL access
- Detailed logging for debugging

### Public URL Format (Working)

**New Receipts (B2):**
```
https://s3.us-east-005.backblazeb2.com/receiptai-images/receipts/{userId}/{filename}.jpg
```

**Example:**
```
https://s3.us-east-005.backblazeb2.com/receiptai-images/receipts/1/Beutea_MYR32.65_01FEB2026.jpg
```

**Old Receipts (R2 - Read Only):**
```
https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev/receiptai-images/receipts/{userId}/{filename}.jpg
```

## Testing Results

### Successful Upload Log
```
2026-02-03 06:28:52.281 [info] B2 Upload: Starting upload process
2026-02-03 06:28:52.286 [info] B2 Upload: User authenticated
2026-02-03 06:28:52.287 [info] B2 Upload: Query params { userId: '1', filename: 'Beutea_MYR32.65_01FEB2026.jpg' }
2026-02-03 06:28:52.296 [info] B2 Upload: Received body 272374 bytes
2026-02-03 06:28:52.563 [info] B2 Upload: Compressed image { original: 272374, compressed: 178354, savings: '35%' }
2026-02-03 06:28:52.564 [info] B2 Upload: Uploading to B2 { bucket: 'receiptai-images', endpoint: 'https://s3.us-east-005.backblazeb2.com' }
2026-02-03 06:28:52.657 [info] B2 Upload: Successfully uploaded to B2
2026-02-03 06:28:52.657 [info] B2 Upload: Public URL https://s3.us-east-005.backblazeb2.com/receiptai-images/receipts/1/Beutea_MYR32.65_01FEB2026.jpg
```

### Verification Checklist
- [x] Image uploaded to B2 bucket
- [x] Public URL accessible in browser
- [x] Telegram bot displays correct URL
- [x] Image viewable from public URL
- [x] Compression working (35% savings)
- [x] File appears in Backblaze B2 console
- [x] Multiple receipts tested successfully

## Migration Summary

**From:** Cloudflare R2 (broken since Feb 1 due to SSL handshake failure)
**To:** Backblaze B2 (working since Feb 3)

**Migration Strategy:**
- ✅ New uploads go to B2
- ✅ Old receipts (pre-Feb 3) remain in R2 (read-only)
- ✅ No data migration needed
- ✅ Both storage systems coexist
- ✅ Public URLs work for both old and new receipts

## Rollback Plan (If B2 Fails)

### To Revert to This Working State:

**1. Vercel Environment Variables:**
- Verify all B2_* variables are set as documented above
- Redeploy if any changes made

**2. route.ts:**
```bash
git checkout 50616d51 -- receipt-parser-web/app/api/upload-receipt/route.ts
git commit -m "Restore working B2 implementation"
git push
```

**3. n8n Workflow:**
- Use the "Combine OCR and R2 Data" node code documented above
- Or import from backup: `n8n/v18_Dashboard_B2_WORKING_20260203.json`

**4. Backblaze B2:**
- Verify bucket is public
- Verify API key has Read and Write permissions
- Test with a new receipt upload

## Cost Analysis

**Backblaze B2:**
- Free Tier: 10GB storage
- Cost after 10GB: $0.005/GB/month
- Example: 30GB = $0.15/month (vs $0.70 for AWS S3)
- **Most cost-effective option**

## Important Notes

⚠️ **DO NOT delete B2 credentials or bucket** - This is the working storage solution  
⚠️ **Keep R2 credentials** - For accessing old receipts from Jan 31  
✅ **B2 is the primary storage** for all new receipts  
✅ **Both systems work together** - no migration needed  

## Related Documentation

- `BACKBLAZE_B2_SETUP.md` - Complete B2 setup guide
- `N8N_B2_UPDATE_GUIDE.md` - n8n workflow update steps
- `R2_WORKING_BACKUP_20260202.md` - R2 backup (for historical reference)
- `R2_TROUBLESHOOTING.md` - R2 debugging (no longer needed)

## Git Repository State

**Current Commit:** `50616d51`  
**Branch:** main  
**Status:** Working B2 implementation  
**Files Modified:**
- `receipt-parser-web/app/api/upload-receipt/route.ts` (B2 implementation)
- `BACKBLAZE_B2_SETUP.md` (setup guide)
- `N8N_B2_UPDATE_GUIDE.md` (n8n guide)
- `AGENTS.md` (updated with working state)

## Next Steps for Future Development

1. ✅ Monitor B2 storage usage (10GB free limit)
2. ✅ Consider implementing storage quota alerts
3. ✅ Optional: Migrate old R2 receipts to B2 (if desired)
4. ✅ Continue normal receipt processing

## Contact Information

**Backblaze Support:** support@backblaze.com  
**B2 Documentation:** https://www.backblaze.com/docs/cloud-storage  
**Account:** Created Feb 3, 2026  
**Bucket:** receiptai-images (us-east-005 region)

---

**Created:** February 3, 2026 at 06:30 UTC  
**Working Status:** ✅ CONFIRMED  
**Backup Purpose:** Snapshot of working B2 integration  
**Restoration:** Use this document to restore to working state
