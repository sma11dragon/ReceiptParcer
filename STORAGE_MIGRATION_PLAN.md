# ReceiptAI Storage Migration Plan
## Google Drive to Alternative Storage Solutions

**Date:** January 30, 2026  
**Status:** Analysis Complete - Ready for Implementation Review  
**Scope:** Replace Google Drive (sma11dragon@gmail.com) with commercial-grade storage for 100-200 users

---

## 1. Current System Architecture

### 1.1 Image Storage Workflow

**Current Flow:**
```
Telegram Webhook (Wrapper Workflow)
    ↓
Download Image from Telegram
    ↓
Process Dashboard Workflow
    ↓
Optimize Image (1800x2400, JPEG 90% for OCR)
    ↓
Google Vision OCR + AI Parsing
    ↓
Compress Image (1200x1600, JPEG 75% for storage)
    ↓
Build Filename: {Vendor}_{Currency}{Amount}_{Date}.jpg
    ↓
Upload to Google Drive (Folder: 1ZjaJqxNQ525DPfgoM6A8lVzpdYKgisWT)
    ↓
Make File Public (Share with anyone)
    ↓
Store URLs in PostgreSQL
```

**Database Storage:**
- `drive_file_id` (VARCHAR) - Google Drive file ID
- `receipt_image_url` (TEXT) - Web view URL: `https://drive.google.com/file/d/{id}/view`
- `receipt_direct_url` (TEXT) - Direct URL: `https://drive.google.com/uc?id={id}`

**Current Limitations:**
- Personal Google Drive account (sma11dragon@gmail.com)
- No user isolation (all images in single folder)
- No programmatic access control
- Not scalable for multi-tenant SaaS
- API rate limits apply

---

## 2. Alternative Storage Options Analysis

### 2.1 Recommended: Cloudflare R2 **(BEST FREE OPTION)**

**Pricing:**
- **FREE TIER:** 10 GB/month storage + 1M Class A ops + 10M Class B ops
- **Paid:** $0.015/GB/month storage + $4.50/million writes + $0.36/million reads
- **Egress:** Always FREE (huge advantage!)

**Pros:**
✅ **Free tier excellent for 100-200 users**  
✅ Zero egress fees (no bandwidth charges)  
✅ S3-compatible API (easy migration)  
✅ Global CDN included  
✅ No request charges for egress  
✅ Durable and reliable  
✅ Easy to implement user-isolated buckets  

**Cons:**
❌ Requires Cloudflare account setup  
❌ 10 GB free limit (approx 2,000-3,000 receipt images)  
❌ Need to configure R2 buckets per user or shared bucket with prefixes  

**Estimated Cost for 200 users:**
- Assuming 5 receipts/user/month at 500KB each = 50MB/user/month
- 200 users × 50MB = 10 GB/month (within free tier)
- **Cost: $0/month initially**
- After growth beyond 10 GB: $0.015/GB = ~$0.15/month per GB overage

---

### 2.2 Alternative: Backblaze B2

**Pricing:**
- **FREE:** First 10 GB storage daily
- **Storage:** $0.005/GB/month (cheapest storage!)
- **Egress:** First 1 GB/day free, then $0.01/GB
- **Transactions:** Free

**Pros:**
✅ Very cheap storage ($0.005/GB)  
✅ Free egress up to 1 GB/day  
✅ S3-compatible API  
✅ No transaction fees  
✅ Simple pricing  

**Cons:**
❌ Egress fees after 1 GB/day (could be expensive at scale)  
❌ Need to monitor bandwidth usage  
❌ Less generous free tier than R2  

**Estimated Cost for 200 users:**
- 10 GB storage = $0.05/month
- Egress: 1 GB/day free covers ~1,000 image views/day
- **Cost: ~$0.05-5/month depending on viewing frequency**

---

### 2.3 Alternative: Supabase Storage

**Pricing:**
- **FREE:** 1 GB storage + 5 GB egress
- **Pro:** $25/month includes 100 GB storage
- **Storage overage:** $0.021/GB/month
- **Egress overage:** $0.09/GB

**Pros:**
✅ Integrated with PostgreSQL (your database)  
✅ Built-in authentication/authorization  
✅ Row-level security policies  
✅ Simple API  
✅ Good for user isolation  

**Cons:**
❌ Only 1 GB free (too small for 200 users)  
❌ $25/month minimum for Pro plan  
❌ Egress charges apply  
❌ More complex setup  

**Estimated Cost for 200 users:**
- Must upgrade to Pro: $25/month minimum
- 10 GB storage included
- **Cost: $25/month minimum**

---

### 2.4 Alternative: Cloudinary

**Pricing:**
- **FREE:** 25 GB storage + 25 monthly credits
- **Paid:** Plans start at $25/month

**Pros:**
✅ Built-in image optimization  
✅ Automatic format conversion  
✅ CDN included  
✅ Image transformations on-the-fly  

**Cons:**
❌ Limited to 3 users on free plan  
❌ Credit-based system (complex)  
❌ Not suitable for multi-user SaaS on free tier  
❌ Expensive for scale  

**Verdict:** ❌ **Not recommended** for multi-user commercial use

---

### 2.5 Alternative: AWS S3

**Pricing:**
- **Free Tier:** 5 GB for 12 months only
- **Standard:** $0.023/GB/month
- **Egress:** $0.09/GB

**Pros:**
✅ Industry standard  
✅ Highly reliable  
✅ S3-compatible (n8n has native node)  
✅ Flexible storage classes  

**Cons:**
❌ No permanent free tier  
❌ Expensive egress fees  
❌ Complex pricing  
❌ Not cost-effective for 100-200 users  

**Estimated Cost for 200 users:**
- 10 GB storage: $0.23/month
- Egress (assuming 5 GB/month): $0.45/month
- **Cost: ~$0.70/month minimum**

---

## 3. Comparison Summary Table

| Provider | Free Tier | Storage Cost | Egress Cost | Best For | Cost @ 200 Users |
|----------|-----------|--------------|-------------|----------|------------------|
| **Cloudflare R2** | **10 GB** | $0.015/GB | **$0** | **Multi-user SaaS** | **$0/month** |
| Backblaze B2 | 10 GB | $0.005/GB | $0.01/GB | Cheap storage | $0.05-5/month |
| Supabase | 1 GB | $0.021/GB | $0.09/GB | Integrated DB | $25/month |
| Cloudinary | 25 GB | Credit-based | Included | Image processing | $25+/month |
| AWS S3 | 5 GB (12mo) | $0.023/GB | $0.09/GB | Enterprise | $0.70+/month |
| Google Drive | N/A | N/A | N/A | Personal use | **Personal account** |

---

## 4. RECOMMENDATION: Cloudflare R2

**Why Cloudflare R2 is the best choice:**

1. **FREE for your initial 100-200 users** (within 10 GB limit)
2. **Zero egress fees** - users can view receipts without bandwidth charges
3. **S3-compatible** - easy to replace Google Drive node with S3 node in n8n
4. **Scalable** - pay-as-you-grow model
5. **User isolation** - can create bucket structure per user or use path prefixes
6. **CDN included** - fast global access to receipt images

**Growth Projection:**
- **Months 1-6:** $0 (within 10 GB free tier)
- **Months 7-12:** ~$0.15-0.30/month (20 GB total)
- **Year 2+:** ~$1-3/month depending on growth

---

## 5. Detailed Migration Plan

### Phase 1: Setup Cloudflare R2 (1-2 days)

**Step 1.1: Create Cloudflare Account**
```
1. Sign up at https://dash.cloudflare.com/sign-up
2. Verify email
3. No credit card required for free tier
```

**Step 1.2: Create R2 Bucket**
```
1. Navigate to R2 in Cloudflare dashboard
2. Create bucket: "receiptai-images"
3. Enable public access (or configure custom domain)
4. Note the S3-compatible endpoint URL
5. Generate API tokens (Access Key ID + Secret Access Key)
```

**Step 1.3: Configure Bucket Structure**
Options for user isolation:
```
Option A: Single bucket with user prefixes
  - Path: receipts/{user_id}/{filename}.jpg
  - Easier to manage, single bucket

Option B: Bucket per user (if needed for strict isolation)
  - Bucket names: receiptai-user-{user_id}
  - More complex, but complete isolation
```

**Recommended: Option A** (single bucket with prefixes)

---

### Phase 2: Update n8n Workflow (1-2 days)

**Step 2.1: Modify "Upload to Google Drive" Node**

**Current Node:** `n8n-nodes-base.googleDrive`
**New Node:** `n8n-nodes-base.awsS3` (S3-compatible)

**Configuration Changes:**
```
Node: Upload Image to R2
├── Operation: Upload
├── Bucket Name: receiptai-images
├── File Key: receipts/{{user_id}}/{{file_name}}
├── Access Key ID: [R2 API Token]
├── Secret Access Key: [R2 API Secret]
├── Endpoint: https://[account_id].r2.cloudflarestorage.com
├── Region: auto
└── ACL: public-read (or private + presigned URLs)
```

**Step 2.2: Remove "Make File Shareable" Node**
- R2 files with public-read ACL don't need separate sharing step
- Or use presigned URLs for private access

**Step 2.3: Update URL Generation Code**

**Current Code (Google Drive):**
```javascript
// Generates: https://drive.google.com/file/d/{fileId}/view
receipt_image_url = `https://drive.google.com/file/d/${drive_file_id}/view`;
receipt_direct_url = `https://drive.google.com/uc?id=${drive_file_id}`;
```

**New Code (Cloudflare R2):**
```javascript
// Generates: https://[account_id].r2.cloudflarestorage.com/receiptai-images/receipts/{user_id}/{filename}
const baseUrl = 'https://[account_id].r2.cloudflarestorage.com';
const bucket = 'receiptai-images';
const fileKey = `receipts/${user_id}/${file_name}`;

receipt_image_url = `${baseUrl}/${bucket}/${fileKey}`;
receipt_direct_url = receipt_image_url; // Same URL for R2
```

**Step 2.4: Update Filename Building Node**

No changes needed - current filename logic works:
```javascript
{Vendor}_{Currency}{Amount}_{Date}.jpg
// Example: Starbucks_USD5.50_15Nov2025.jpg
```

---

### Phase 3: Database Schema Updates (2-3 hours)

**Step 3.1: New Columns (Optional but Recommended)**

Add to `expenses` table:
```sql
-- Track storage provider for future flexibility
ALTER TABLE expenses ADD COLUMN storage_provider VARCHAR(20) DEFAULT 'google_drive';

-- Store full file path/key
ALTER TABLE expenses ADD COLUMN storage_path TEXT;

-- Store bucket name (if using multiple buckets)
ALTER TABLE expenses ADD COLUMN storage_bucket VARCHAR(100);
```

**Step 3.2: Update Existing Data**

**Option A: Keep existing Google Drive URLs (backward compatible)**
```sql
-- Update storage_provider for existing records
UPDATE expenses SET storage_provider = 'google_drive' WHERE drive_file_id IS NOT NULL;
```

**Option B: Migrate existing images to R2 (recommended)**
See Phase 5 for migration script

**Step 3.3: Modify Application Queries**

Update application code to handle both old and new URLs:
```typescript
// Helper function to get image URL
function getReceiptImageUrl(expense: Expense): string {
  if (expense.storage_provider === 'r2') {
    return `${R2_BASE_URL}/${expense.storage_bucket}/${expense.storage_path}`;
  }
  // Fallback to old Google Drive URL
  return expense.receipt_image_url;
}
```

---

### Phase 4: Web Application Updates (1-2 days)

**Step 4.1: Environment Variables**

Add to `.env.local`:
```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=receiptai-images
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_PUBLIC_URL=https://[account_id].r2.cloudflarestorage.com/receiptai-images

# Optional: Custom domain (recommended for production)
R2_CUSTOM_DOMAIN=https://cdn.receiptai.com
```

**Step 4.2: Update Image Display Components**

No major changes - just update base URL:
```typescript
// Before
<img src={expense.receipt_image_url} alt="Receipt" />

// After (if using new structure)
<img src={`${process.env.R2_PUBLIC_URL}/${expense.storage_path}`} alt="Receipt" />
```

**Step 4.3: Update Receipt Gallery/Download Features**

Ensure direct downloads work with new URLs:
```typescript
// Direct download (works with R2 public URLs)
const handleDownload = () => {
  window.open(expense.receipt_direct_url, '_blank');
};
```

---

### Phase 5: Data Migration (Existing Receipts) - Optional

**If you want to migrate existing Google Drive images to R2:**

**Step 5.1: Export Google Drive File List**
```bash
# Use Google Drive API to list all files in folder
# Save to CSV: file_id, file_name, current_url
```

**Step 5.2: Migration Script (Node.js)**
```javascript
// Migration script
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

async function migrateImages() {
  const expenses = await pool.query(
    'SELECT * FROM expenses WHERE drive_file_id IS NOT NULL AND storage_provider IS NULL'
  );
  
  for (const expense of expenses.rows) {
    try {
      // Download from Google Drive
      const response = await fetch(expense.receipt_direct_url);
      const buffer = await response.buffer();
      
      // Upload to R2
      const fileKey = `receipts/${expense.user_id}/${expense.file_name}`;
      await s3.putObject({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
        Body: buffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      }).promise();
      
      // Update database
      await pool.query(
        `UPDATE expenses 
         SET storage_provider = 'r2',
             storage_path = $1,
             storage_bucket = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [fileKey, process.env.R2_BUCKET_NAME, expense.id]
      );
      
      console.log(`Migrated expense ${expense.id}`);
    } catch (error) {
      console.error(`Failed to migrate ${expense.id}:`, error);
    }
  }
}

migrateImages();
```

**Step 5.3: Run Migration**
```bash
# Test with small batch first
node migrate_receipts.js --limit=10

# Full migration
node migrate_receipts.js
```

**Cost of Migration:**
- Download from Google Drive: Free
- Upload to R2: Free
- **Total: $0**

---

### Phase 6: Testing & Validation (1-2 days)

**Step 6.1: Test New Receipt Processing**
```
1. Send test receipt via Telegram
2. Verify image uploads to R2
3. Check URL is generated correctly
4. Verify image displays in web app
5. Test download functionality
```

**Step 6.2: Validate User Isolation**
```
1. Create receipt as User A
2. Verify User B cannot access User A's image URL
3. Test with different user_id paths
```

**Step 6.3: Load Testing**
```
1. Upload 50 test receipts
2. Verify all URLs accessible
3. Check R2 dashboard for usage
4. Monitor costs
```

---

### Phase 7: Cleanup & Go-Live (1 day)

**Step 7.1: Remove Google Drive Dependencies**
- Disable Google Drive node in n8n
- Remove Google Drive credentials
- Update documentation

**Step 7.2: Update User Communication**
- Notify users of improved receipt access speeds
- No action required from users

**Step 7.3: Monitoring Setup**
```
1. Set up Cloudflare R2 usage alerts
2. Monitor costs monthly
3. Set up dashboard for storage metrics
```

---

## 6. Database Impact Assessment

### 6.1 Schema Changes Required

**MINIMAL IMPACT:** Only additive changes (no breaking changes)

**New Columns (Optional):**
```sql
-- These columns can be added without affecting existing functionality
ALTER TABLE expenses ADD COLUMN storage_provider VARCHAR(20);
ALTER TABLE expenses ADD COLUMN storage_path TEXT;
ALTER TABLE expenses ADD COLUMN storage_bucket VARCHAR(100);
```

**Existing Columns (No Change):**
- `drive_file_id` - Keep for backward compatibility
- `receipt_image_url` - Keep for existing receipts
- `receipt_direct_url` - Keep for existing receipts

### 6.2 Backward Compatibility

**✅ NO BREAKING CHANGES**

Your application can support both old and new receipts:
```typescript
// Application logic handles both
if (expense.storage_provider === 'r2') {
  return generateR2Url(expense);
} else {
  return expense.receipt_image_url; // Old Google Drive URL
}
```

### 6.3 Migration Rollback Plan

**If issues arise:**
1. **Immediate:** Revert n8n workflow to Google Drive node
2. **Data:** No data loss (all URLs preserved)
3. **Users:** Can continue accessing old receipts
4. **Time to rollback:** < 5 minutes

---

## 7. Cost Analysis Summary

### Current State (Google Drive)
- Personal account (sma11dragon@gmail.com)
- No direct cost
- **Not suitable for commercial use**
- **Not scalable**

### Future State (Cloudflare R2)

**Months 1-6 (Growth Phase):**
```
Users: 100-200
Receipts: ~1,000-2,000/month
Storage: ~5-10 GB
R2 Cost: $0/month (within free tier)
Egress: $0/month (always free)
**Total: $0/month**
```

**Months 7-12 (Scaling):**
```
Users: 200-500
Receipts: ~3,000-5,000/month
Storage: ~15-25 GB
R2 Cost: $0.23-0.38/month (15-25 GB @ $0.015/GB)
Egress: $0/month
**Total: ~$0.25-0.40/month**
```

**Year 2+ (Mature):**
```
Users: 500-1,000
Receipts: ~10,000/month
Storage: ~50-100 GB
R2 Cost: $0.75-1.50/month
Egress: $0/month
**Total: ~$1-2/month**
```

**Even at 10,000 users:**
- Storage: ~500 GB = $7.50/month
- **Still incredibly cost-effective!**

---

## 8. Implementation Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Cloudflare R2 Setup | 1-2 days | None |
| 2 | n8n Workflow Update | 1-2 days | Phase 1 |
| 3 | Database Schema Update | 2-3 hours | None |
| 4 | Web App Updates | 1-2 days | Phase 3 |
| 5 | Data Migration (Optional) | 2-3 days | Phase 2 |
| 6 | Testing & Validation | 1-2 days | Phase 4 |
| 7 | Go-Live & Cleanup | 1 day | Phase 6 |
| | **TOTAL** | **7-14 days** | |

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| R2 API limits | Low | Medium | Can upgrade or switch to S3 |
| Migration data loss | Low | High | Keep Google Drive backups |
| User URL breakage | Low | Medium | Support both old/new URLs |
| Cost overruns | Very Low | Low | Generous free tier |
| n8n workflow errors | Medium | Medium | Test thoroughly before deploy |

---

## 10. Next Steps

1. **Review this plan** and approve approach
2. **Create Cloudflare account** and R2 bucket
3. **Test n8n workflow** changes in development
4. **Implement database migrations**
5. **Run parallel systems** (Google Drive + R2) for 1 week
6. **Switch to R2** as primary storage
7. **Monitor costs** and usage

---

## Appendix A: R2 Configuration Code

### n8n S3 Node Configuration (JSON)
```json
{
  "name": "Upload to R2",
  "type": "n8n-nodes-base.awsS3",
  "typeVersion": 1,
  "position": [2500, 300],
  "parameters": {
    "operation": "upload",
    "bucket": "receiptai-images",
    "key": "=receipts/{{$json.user_id}}/{{$json.file_name}}",
    "binaryData": true,
    "binaryPropertyName": "data",
    "acl": "public-read"
  },
  "credentials": {
    "aws": {
      "id": "r2_credentials",
      "name": "R2 Account"
    }
  }
}
```

### R2 Credentials Setup
```
Credential Type: AWS
Access Key ID: [R2 API Token]
Secret Access Key: [R2 API Secret]
Region: auto
Endpoint: https://[account_id].r2.cloudflarestorage.com
```

---

**END OF MIGRATION PLAN**

**Prepared by:** AI Code Review  
**Date:** January 30, 2026  
**Version:** 1.0
