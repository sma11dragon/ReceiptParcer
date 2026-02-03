# n8n Workflow Update Guide for Backblaze B2

**Date:** February 2, 2026
**Purpose:** Update n8n workflow to use Backblaze B2 instead of Cloudflare R2

## Overview

We need to update the n8n workflow to generate correct B2 URLs for new receipts while maintaining backward compatibility with old R2 receipts.

## Changes Required

### 1. Update "Combine OCR and R2 Data" Node

**Node Name:** Combine OCR and R2 Data  
**Type:** Code Node

#### Current Code (R2):
```javascript
const botToken = $input.first().json.bot_token;
const parsingData = $('Parsing Success?').first().json;
const processImageData = $('Process Image').first().json;
const buildFilenameData = $('Build Filename from Parsed Data').first().json;

// R2 Configuration - VERIFIED WORKING
const R2_PUBLIC_URL = 'https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev';

// Get user ID and filename
const userId = processImageData.user_id;
const filename = buildFilenameData.dynamic_filename;

// Build R2 file key and public URL
const fileKey = `receiptai-images/receipts/${userId}/${filename}`;
const r2Url = `${R2_PUBLIC_URL}/${fileKey}`;

// Merge ALL data
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

#### New Code (B2):
```javascript
const botToken = $input.first().json.bot_token;
const parsingData = $('Parsing Success?').first().json;
const processImageData = $('Process Image').first().json;
const buildFilenameData = $('Build Filename from Parsed Data').first().json;

// Backblaze B2 Configuration
const B2_PUBLIC_URL = 'https://f001.backblazeb2.com/file/receiptai-images';

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
    storage_provider: 'backblaze-b2',  // Changed from 'r2'
    drive_file_id: fileKey,
    receipt_image_url: b2Url,
    receipt_direct_url: b2Url,
    file_name: filename,
    bot_token: botToken
  }
}];
```

#### Key Changes:
1. **R2_PUBLIC_URL** → **B2_PUBLIC_URL**
   - Old: `https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev`
   - New: `https://f001.backblazeb2.com/file/receiptai-images`

2. **fileKey structure** changed:
   - Old: `receiptai-images/receipts/${userId}/${filename}`
   - New: `receipts/${userId}/${filename}`
   - Note: Bucket name is now in the B2_PUBLIC_URL base, not in the fileKey

3. **storage_provider** updated:
   - Old: `'r2'`
   - New: `'backblaze-b2'`

### 2. HTTP Request Node (No Changes Needed)

The HTTP Request node that calls Vercel remains the same:
- URL: `https://receipt-parcer.vercel.app/api/upload-receipt?userId={{ $json.user_id }}&filename={{ $json.dynamic_filename }}`
- Method: POST
- Body: n8n Binary File with field name "data"

This node just sends the image to Vercel - the Vercel API now handles B2 upload.

### 3. Telegram Response Node (Optional Update)

If you want to show different messages for B2 vs R2:

#### Current (unchanged - works for both):
```javascript
// In the Telegram response message
✅ Receipt processed!
🔗 View: {{ $json.receipt_image_url }}
```

#### Alternative (shows storage provider):
```javascript
✅ Receipt processed!
🔗 View: {{ $json.receipt_image_url }}
💾 Storage: {{ $json.storage_provider }}
```

## Step-by-Step Update Instructions

### Step 1: Find the Node
1. Open your n8n workflow
2. Find the node named **"Combine OCR and R2 Data"**
3. Click on it to open the code editor

### Step 2: Update the Code
1. **Delete all the current code**
2. **Paste the new B2 code** from above
3. **Replace YOUR_B2_PUBLIC_URL** with your actual B2 public URL:
   - Format: `https://f001.backblazeb2.com/file/YOUR_BUCKET_NAME`
   - Example: `https://f001.backblazeb2.com/file/receiptai-images`

### Step 3: Save and Test
1. Click **"Save"** (Ctrl+S)
2. The node name can stay as "Combine OCR and R2 Data" or you can rename it to "Combine OCR and B2 Data"
3. **Activate the workflow** (toggle switch in top right)
4. **Test with a receipt image** in Telegram

### Step 4: Verify
1. Check that the receipt is uploaded successfully
2. Verify the public URL is accessible
3. Check that the image appears in your Backblaze B2 bucket

## Backward Compatibility

**Old receipts (before Feb 2, 2026):**
- Still accessible via R2 URLs
- Stored in Cloudflare R2
- URL format: `https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev/receiptai-images/receipts/1/filename.jpg`

**New receipts (after Feb 2, 2026):**
- Accessible via B2 URLs
- Stored in Backblaze B2
- URL format: `https://f001.backblazeb2.com/file/receiptai-images/receipts/1/filename.jpg`

**No migration needed** - old receipts continue to work with their old URLs.

## Troubleshooting

### Issue: "B2_PUBLIC_URL is not defined"
**Fix:** Make sure you replaced `YOUR_B2_PUBLIC_URL` with your actual B2 public URL in the code.

### Issue: URL returns 404
**Check:**
1. Is the B2_PUBLIC_URL correct?
2. Is the bucket public? (Must be set to "Public" in Backblaze)
3. Did the Vercel upload succeed? (Check Vercel logs)

### Issue: Images not appearing in B2 bucket
**Check:**
1. Are B2 environment variables set in Vercel?
2. Check Vercel function logs for upload errors
3. Verify B2 credentials (Key ID and Application Key)

## Verification Checklist

After updating n8n:
- [ ] Node code updated with B2_PUBLIC_URL
- [ ] Workflow saved and activated
- [ ] Test receipt uploaded successfully
- [ ] Image URL accessible in browser
- [ ] Image appears in Backblaze B2 bucket
- [ ] Telegram bot responds with correct URL

## Rollback Instructions

If B2 doesn't work:

1. **Open the "Combine OCR and R2 Data" node**
2. **Replace B2_PUBLIC_URL with R2_PUBLIC_URL:**
   ```javascript
   const R2_PUBLIC_URL = 'https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev';
   ```
3. **Update fileKey to include bucket name:**
   ```javascript
   const fileKey = `receiptai-images/receipts/${userId}/${filename}`;
   ```
4. **Change storage_provider back:**
   ```javascript
   storage_provider: 'r2'
   ```
5. **Save and activate workflow**

**Or restore from backup:**
- Import: `n8n/v18_Dashboard_WORKING_20260202.json`

## Next Steps

1. ✅ You have the B2 implementation code
2. ⏳ Update n8n "Combine OCR and R2 Data" node
3. ⏳ Test receipt upload
4. ⏳ Verify B2 integration works

**Ready to update n8n?** Follow the steps above and test with a receipt!
