# Backblaze B2 Implementation Guide

**Date:** February 2, 2026  
**Status:** Implementation in Progress  
**Purpose:** Replace broken Cloudflare R2 with working Backblaze B2 storage

## Overview

**Why Backblaze B2?**
- ✅ S3-compatible API (can reuse existing code)
- ✅ 10GB free storage (generous)
- ✅ $0.005/GB/month after free tier (cheapest)
- ✅ No SSL handshake issues with Vercel
- ✅ Different infrastructure than Cloudflare
- ✅ Public URLs work immediately

**Migration Strategy:**
- Keep existing Jan 31 receipts in Cloudflare R2 (read-only)
- New uploads go to Backblaze B2
- Update n8n workflow to use B2 URLs
- No data migration needed

## Setup Instructions

### Step 1: Create Backblaze Account

1. Go to **https://www.backblaze.com/b2/cloud-storage.html**
2. Click **"Sign Up"** or **"Get Started"**
3. Create account with your email
4. Verify email address
5. No credit card required for free tier

### Step 2: Create B2 Bucket

1. **Log into Backblaze B2 Console**
2. Click **"Create Bucket"**
3. **Bucket Name:** `receiptai-images` (must be globally unique)
4. **Bucket Info:** Receipt images storage
5. **Public/Private:** **Public** (required for direct URL access)
6. **Click "Create Bucket"**

### Step 3: Get Application Key

1. In B2 Console, go to **"App Keys"** (left sidebar)
2. Click **"Create Application Key"**
3. **Name:** ReceiptAI-Vercel
4. **Access:** Read and Write
5. **Bucket:** Select `receiptai-images` bucket
6. **Prefix:** (leave empty for full bucket access)
7. **Duration:** (leave empty for no expiration)
8. **Click "Create Application Key"**

**⚠️ IMPORTANT:** Copy these values immediately - you won't see them again!

**Key ID:** `xxxxxxxxxxxxxxxx` (looks like: 005c5c5c5c5c5c5c5c5c5c5c5)
**Application Key:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (long string)

### Step 4: Find Your Endpoint URL

1. In B2 Console, go to **"Buckets"**
2. Click on your `receiptai-images` bucket
3. Look for **"S3 Endpoint"** or **"Endpoint"**
4. It looks like: `https://s3.us-west-004.backblazeb2.com`

**Note the region** (e.g., `us-west-004`) - you'll need it.

### Step 5: Get Public URL Format

For public buckets, the URL format is:
```
https://f001.backblazeb2.com/file/receiptai-images/receipts/1/filename.jpg
```

Or via S3 endpoint:
```
https://s3.us-west-004.backblazeb2.com/receiptai-images/receipts/1/filename.jpg
```

## Environment Variables

Add these to Vercel (receipt-parcer project):

```
B2_KEY_ID=xxxxxxxxxxxxxxxx  (from Step 3)
B2_APPLICATION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (from Step 3)
B2_BUCKET_NAME=receiptai-images
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com  (from Step 4)
B2_PUBLIC_URL=https://f001.backblazeb2.com/file/receiptai-images  (from Step 5)
B2_REGION=us-west-004  (from Step 4)
```

**Keep existing R2 variables** (for reading old receipts):
```
R2_PUBLIC_URL=https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev/receiptai-images
```

## Implementation Changes

### 1. Update route.ts

Replace R2 upload logic with B2 upload using AWS SDK (already installed).

**Changes needed:**
- Change endpoint from R2 to B2
- Update credentials to use B2_KEY_ID and B2_APPLICATION_KEY
- Update bucket name reference
- Keep same file path structure: `receipts/${userId}/${filename}`

### 2. Update n8n Workflow

**File:** `Combine OCR and R2 Data` node (or create new `Combine OCR and B2 Data` node)

**Changes:**
```javascript
// Change FROM:
const R2_PUBLIC_URL = 'https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev';
const fileKey = `receiptai-images/receipts/${userId}/${filename}`;

// Change TO:
const B2_PUBLIC_URL = 'https://f001.backblazeb2.com/file/receiptai-images';
const fileKey = `receipts/${userId}/${filename}`;
```

### 3. Update Receipt Display Logic

When displaying receipts, check date:
- **Before Feb 2, 2026:** Use R2 URL (old receipts)
- **After Feb 2, 2026:** Use B2 URL (new receipts)

Or simply update all to use B2 URLs (old R2 receipts are still accessible via old URLs).

## Testing Checklist

- [ ] Create Backblaze account
- [ ] Create B2 bucket named `receiptai-images`
- [ ] Generate Application Key
- [ ] Copy Key ID and Application Key
- [ ] Find B2 endpoint URL
- [ ] Add all B2 env vars to Vercel
- [ ] Update route.ts with B2 implementation
- [ ] Update n8n workflow node
- [ ] Deploy to Vercel
- [ ] Test receipt upload via Telegram
- [ ] Verify image is accessible via public URL
- [ ] Check image is saved in B2 bucket

## Rollback Plan

If B2 doesn't work:

1. **Revert route.ts:**
   ```bash
   git checkout HEAD~1 -- receipt-parser-web/app/api/upload-receipt/route.ts
   git commit -m "Revert to R2 (B2 had issues)"
   git push
   ```

2. **Revert n8n workflow:**
   - Import backup: `n8n/v18_Dashboard_WORKING_20260202.json`
   - Or manually change B2_PUBLIC_URL back to R2_PUBLIC_URL

3. **Restore working state:**
   - See `R2_WORKING_BACKUP_20260202.md`

## Cost Comparison

| Storage | Free Tier | Paid Cost (30GB) |
|---------|-----------|------------------|
| Cloudflare R2 | 0GB | ~$0.00 (not working) |
| Backblaze B2 | 10GB | ~$0.15/month |
| AWS S3 | 5GB (1st year) | ~$0.70/month |
| Google Cloud | 5GB/month | ~$0.60/month |

**B2 is the cheapest option** after the generous 10GB free tier!

## Support & Documentation

**Backblaze B2 Docs:** https://www.backblaze.com/docs/cloud-storage  
**S3 API Compatibility:** https://www.backblaze.com/docs/cloud-storage-use-the-aws-sdk-for-javascript-v3-with-backblaze-b2  
**Pricing:** https://www.backblaze.com/b2/cloud-storage-pricing.html

## Next Steps

1. **You:** Complete Steps 1-5 (create account, bucket, get keys)
2. **You:** Add environment variables to Vercel
3. **Me:** Update route.ts with B2 implementation
4. **Me:** Update n8n workflow
5. **Test:** Upload a receipt and verify it works

**Ready to start?** Complete Steps 1-5 above, then share the environment variable values with me (privately/separately) and I'll update the code!
