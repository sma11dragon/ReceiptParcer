# Cloudflare R2 Setup & n8n Workflow Migration Guide

## PART 1: Cloudflare R2 Setup Instructions

### Step 1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Enter your email and create a password
3. Verify your email address
4. **No credit card required** for free tier

### Step 2: Create R2 Bucket

1. In Cloudflare Dashboard, click **"R2"** in the left sidebar
2. Click **"Create bucket"**
3. Bucket name: `receiptai-images`
4. Click **"Create bucket"**

### Step 3: Enable Public Access (CRITICAL STEP)

**Option A: Use Cloudflare-managed subdomain (QUICKEST - for testing)**
```
1. Go to your bucket "receiptai-images"
2. Click "Settings" tab
3. Under "Public Development URL"
4. Click "Enable"
5. Type "allow" to confirm
6. Your bucket is now publicly accessible at:
   https://receiptai-images.[your-account-id].r2.dev
```

**Option B: Custom domain (RECOMMENDED for production)**
```
1. Add your domain to Cloudflare (e.g., cdn.receiptai.com)
2. Go to R2 bucket "receiptai-images"
3. Click "Settings" → "Custom Domains"
4. Click "Add"
5. Enter: cdn.receiptai.com
6. Click "Continue" → "Connect Domain"
7. Your bucket is now accessible at:
   https://cdn.receiptai.com
```

### Step 4: Create R2 API Tokens

1. In Cloudflare Dashboard, go to **"Manage R2 API Tokens"**
2. Click **"Create API Token"**
3. Token name: `n8n-r2-upload`
4. Permissions:
   - Object Read & Write: ALLOW
   - Bucket Read: ALLOW
5. Click **"Create API Token"**
6. **SAVE THESE VALUES** (you won't see them again):
   - Access Key ID (starts with `xxxxxxxxxxxxxxxx`)
   - Secret Access Key (long string)

### Step 5: Get R2 Endpoint URL

```
Your R2 endpoint will be:
https://[your-account-id].r2.cloudflarestorage.com

To find your Account ID:
1. Look at the R2 URL in your browser
2. Or go to any R2 bucket page
3. The format is visible in the bucket settings
```

---

## PART 2: n8n Nodes That Need Updating

### Current Workflow Files:
1. **Wrapper Workflow**: `v18 Wrapper - Telegram Chat ID Fix V5.json`
2. **Dashboard Workflow**: `v18 Dashboard - Telegram Chat ID Fix.json`

### Nodes Requiring Changes:

#### 1. "Upload to Google Drive" Node (Dashboard Workflow)
**Current Location**: After "Build Filename from Parsed Data" node  
**Current Type**: `n8n-nodes-base.googleDrive`  
**Action**: Replace with **AWS S3 node** (R2 is S3-compatible)

**Configuration:**
```
Node Type: n8n-nodes-base.awsS3
Operation: Upload
Bucket Name: receiptai-images
File Key: =receipts/{{ $json.user_id }}/{{ $json.dynamic_filename }}
Binary Data: Yes
Binary Property Name: data
Access Key ID: [Your R2 Access Key]
Secret Access Key: [Your R2 Secret Key]
Region: auto
Endpoint: https://[account-id].r2.cloudflarestorage.com
```

#### 2. "Make File Shareable" Node (Dashboard Workflow)
**Current Type**: `n8n-nodes-base.googleDrive`  
**Action**: **DELETE this node** (not needed with R2 public buckets)

#### 3. "Combine OCR and Drive Data" Node (Dashboard Workflow)
**Current Type**: `n8n-nodes-base.code`  
**Action**: Modify code to generate R2 URLs instead of Google Drive URLs

**Current Code generates:**
```javascript
receipt_image_url = `https://drive.google.com/file/d/${fileId}/view`;
receipt_direct_url = `https://drive.google.com/uc?id=${fileId}`;
```

**New Code should generate:**
```javascript
const r2BaseUrl = 'https://receiptai-images.[account-id].r2.dev';
// OR if using custom domain: 'https://cdn.receiptai.com'
const fileKey = `receipts/${user_id}/${filename}`;
receipt_image_url = `${r2BaseUrl}/${fileKey}`;
receipt_direct_url = receipt_image_url; // Same for R2
```

#### 4. "Send Success Confirmation" Node (Dashboard Workflow)
**Action**: Update to use new URL structure
- Currently references `receipt_image_url` from parsed data
- No code changes needed if "Combine OCR and Drive Data" node is updated correctly

---

## PART 3: Database Impact

### No Breaking Changes Required

Your database schema can remain unchanged:
- `drive_file_id` column → Can store R2 file key instead (optional)
- `receipt_image_url` → Will store R2 URL instead of Google Drive URL
- `receipt_direct_url` → Will store R2 URL instead of Google Drive URL

### Recommended Schema Additions (Optional):

```sql
-- Add column to track storage provider (for future flexibility)
ALTER TABLE expenses ADD COLUMN storage_provider VARCHAR(20) DEFAULT 'google_drive';

-- Update as you migrate
UPDATE expenses SET storage_provider = 'google_drive' WHERE drive_file_id IS NOT NULL;
```

### Backward Compatibility:
- Old Google Drive URLs continue to work
- Application can detect provider and handle both URL formats
- See code example in Part 4

---

## PART 4: Application Code Updates

### Update URL Generation Helper

Add this to your application code:

```typescript
// lib/storage.ts
const R2_BASE_URL = process.env.R2_PUBLIC_URL || 'https://receiptai-images.[account-id].r2.dev';

export function getReceiptImageUrl(expense: Expense): string {
  // Check if this is an R2-stored receipt
  if (expense.storage_provider === 'r2' && expense.drive_file_id) {
    // drive_file_id now contains the R2 file key
    return `${R2_BASE_URL}/${expense.drive_file_id}`;
  }
  
  // Fallback to legacy Google Drive URL
  return expense.receipt_image_url;
}

export function getReceiptDirectUrl(expense: Expense): string {
  // For R2, direct URL is same as image URL
  if (expense.storage_provider === 'r2') {
    return getReceiptImageUrl(expense);
  }
  
  return expense.receipt_direct_url;
}
```

### Environment Variables

Add to `.env.local`:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=receiptai-images
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_PUBLIC_URL=https://receiptai-images.[account-id].r2.dev
# OR if using custom domain:
# R2_PUBLIC_URL=https://cdn.receiptai.com
```

---

## PART 5: Testing Checklist

### Before Go-Live:

1. **Upload Test Receipt via Telegram**
   - Send image to bot
   - Verify it uploads to R2 bucket
   - Check Cloudflare R2 dashboard for file

2. **Verify Public Access**
   - Copy URL from success message
   - Open in incognito/private browser
   - Confirm image displays without login

3. **Check Database Entry**
   - Query: `SELECT * FROM expenses ORDER BY created_at DESC LIMIT 1;`
   - Verify `receipt_image_url` contains R2 URL
   - Verify `drive_file_id` contains file key

4. **Test Web Application**
   - Open receipt in web dashboard
   - Click image to view
   - Download image

5. **Verify User Isolation**
   - Upload receipt as User A
   - URL should contain: `receipts/{user_a_id}/{filename}`
   - User B should not see User A's receipt

---

## PART 6: Rollback Plan

If issues occur:

1. **Revert n8n Workflow**
   - Import your backup Google Drive workflow
   - Disable R2 version
   - Takes < 5 minutes

2. **No Data Loss**
   - Existing Google Drive receipts remain accessible
   - Database URLs are preserved
   - Users can still view old receipts

3. **Gradual Migration**
   - Keep both systems running in parallel
   - New receipts → R2
   - Old receipts → Google Drive
   - Migrate existing receipts later

---

## Summary

**Yes, this is 100% doable and users will be able to:**
✅ Click URL and view receipt **without authentication**  
✅ Have faster image loading (Cloudflare CDN)  
✅ No Google Drive prompts or login requirements  
✅ Better mobile experience  

**Cost for 100-200 users:** $0/month (within 10 GB free tier)  
**Setup time:** 2-3 hours  
**Testing time:** 1-2 days  

---

## Ready to Proceed?

1. Create Cloudflare account and R2 bucket
2. Enable public access (Option A for testing, Option B for production)
3. Import the new workflow file (provided separately)
4. Configure credentials in n8n
5. Test with one receipt
6. Go live!

**Next Step**: See the attached `n8n-workflow-r2-migration.json` file for the complete modified workflow ready to import.
