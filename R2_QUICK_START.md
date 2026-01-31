# R2 Migration - Quick Start Guide

## TL;DR - What You Need to Do

### 1. Setup Cloudflare R2 (15 minutes)
```
□ Create Cloudflare account
□ Create bucket: receiptai-images  
□ Enable "Public Development URL" in bucket settings
□ Get Account ID and create API tokens
□ Note your public URL: https://receiptai-images.[account-id].r2.dev
```

### 2. Update n8n Workflow (30 minutes)
```
□ Add AWS credentials in n8n (use R2 endpoint)
□ Delete "Make File Shareable" node
□ Replace "Upload to Google Drive" with AWS S3 node
□ Connect: Build Filename → Upload to R2 → Combine OCR
□ Update "Combine OCR and Drive Data" code node (see code below)
□ Save and test
```

### 3. Update Application (15 minutes)
```
□ Add R2_PUBLIC_URL to .env.local
□ Update getReceiptImageUrl() helper function
□ Deploy application
```

---

## CURRENT vs NEW Workflow Diagram

### CURRENT (Google Drive):
```
Build Filename from Parsed Data
         ↓
   Upload to Google Drive
         ↓
   Make File Shareable
         ↓
   Combine OCR and Drive Data
         ↓
   Database INSERT
```

### NEW (Cloudflare R2):
```
Build Filename from Parsed Data
         ↓
   Upload to R2 (AWS S3 node)
         ↓
   Combine OCR and R2 Data
         ↓
   Database INSERT
```

**Changes:**
- ❌ REMOVE: "Make File Shareable" (not needed)
- 🔄 REPLACE: "Upload to Google Drive" → "Upload to R2"
- 📝 MODIFY: "Combine OCR and Drive Data" code

---

## Updated Code for "Combine OCR and Drive Data" Node

**Copy and paste this code into the existing node:**

```javascript
const botToken = $input.first().json.bot_token;
const parsingData = $('Parsing Success?').first().json;
const processImageData = $('Process Image').first().json;
const buildFilenameData = $('Build Filename from Parsed Data').first().json;

// ⚠️ UPDATE THIS: Your R2 account ID from Cloudflare dashboard
const R2_ACCOUNT_ID = 'YOUR-ACCOUNT-ID-HERE';
const R2_BUCKET_NAME = 'receiptai-images';
const R2_PUBLIC_URL = `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev`;

// Get user ID and filename
const userId = processImageData.user_id;
const filename = buildFilenameData.dynamic_filename;

// Build R2 file key and URL
const fileKey = `receipts/${userId}/${filename}`;
const r2Url = `${R2_PUBLIC_URL}/${fileKey}`;

// Merge ALL data: parsing results + R2 URL + chat ID + user ID
return [{
  json: {
    ...parsingData,
    chat_id: processImageData.chat_id,
    user_id: userId,
    telegram_user_id: processImageData.telegram_user_id,
    storage_provider: 'r2',
    drive_file_id: fileKey,
    receipt_image_url: r2Url,
    receipt_direct_url: r2Url,
    file_name: filename,
    bot_token: botToken
  }
}];
```

---

## AWS S3 Node Configuration

**Node Type:** AWS S3 (not "S3", use "AWS S3")
**Position:** Where "Upload to Google Drive" was (-6400, -624)

**Parameters:**
```
Operation: Upload
Bucket: receiptai-images
Key: =receipts/{{ $json.user_id }}/{{ $json.dynamic_filename }}
Binary Data: Yes
Binary Property: ={{ Object.keys($input.first().binary)[0] }}
ACL: public-read
```

**Credentials (AWS):**
```
Access Key ID: [Your R2 Access Key ID]
Secret Access Key: [Your R2 Secret Access Key]
Region: auto
Endpoint: https://[YOUR-ACCOUNT-ID].r2.cloudflarestorage.com
```

---

## Database - NO CHANGES REQUIRED

Your existing schema works perfectly:
- `drive_file_id` → Now stores R2 file key: `receipts/{user_id}/{filename}`
- `receipt_image_url` → Now stores R2 URL
- `receipt_direct_url` → Same as image URL

**Optional (for tracking):**
```sql
ALTER TABLE expenses ADD COLUMN storage_provider VARCHAR(20) DEFAULT 'google_drive';
```

---

## Application Code Update

Add to `.env.local`:
```bash
R2_PUBLIC_URL=https://receiptai-images.[YOUR-ACCOUNT-ID].r2.dev
```

Update `lib/storage.ts`:
```typescript
const R2_BASE_URL = process.env.R2_PUBLIC_URL;

export function getReceiptImageUrl(expense) {
  if (expense.storage_provider === 'r2' && expense.drive_file_id) {
    return `${R2_BASE_URL}/${expense.drive_file_id}`;
  }
  return expense.receipt_image_url;
}
```

---

## Testing Checklist

Before going live:
```
□ Send test receipt via Telegram
□ Verify image appears in Cloudflare R2 dashboard
□ Copy URL from Telegram success message
□ Open URL in incognito browser (should show image without login)
□ Check database has correct R2 URL
□ View receipt in web application
□ Confirm other users can't access the URL (different user_id)
```

---

## Rollback Plan (If Something Goes Wrong)

**Emergency Rollback (5 minutes):**
1. Import your backed-up workflow (Google Drive version)
2. Disable the R2 workflow
3. New receipts will go back to Google Drive
4. Existing R2 receipts remain accessible (URLs stored in DB)

---

## Support Files Created

1. **R2_SETUP_INSTRUCTIONS.md** - Complete setup guide
2. **R2_MIGRATION_NODES.json** - Detailed node specifications
3. **This file** - Quick start guide

---

## Common Questions

**Q: Will existing receipts still work?**  
A: Yes! Google Drive URLs in database remain valid.

**Q: Can I migrate old receipts to R2?**  
A: Yes, see STORAGE_MIGRATION_PLAN.md for migration script.

**Q: What if I exceed 10 GB free tier?**  
A: Cost is $0.015/GB (~$0.15/month for next 10 GB).

**Q: Do users need to re-register?**  
A: No, seamless transition.

---

**Ready to start?** Begin with Step 1: Create Cloudflare account at https://dash.cloudflare.com/sign-up
