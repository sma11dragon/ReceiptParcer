# R2 Upload Troubleshooting Guide

## Problem: SSL Handshake Failure with Cloudflare R2

**Error Message:**
```
Error: write EPROTO ... SSL routines:ssl3_read_bytes:ssl/tls alert handshake failure
```

## Common Causes & Solutions

### 1. R2 API Key Permissions (MOST COMMON)

**Symptom:** Everything works in test mode (skipping R2 upload), but fails when actually uploading to R2.

**Cause:** New or rotated R2 API keys don't have proper S3 permissions.

**Fix:**
1. Go to Cloudflare Dashboard → R2
2. Check your API tokens have these permissions:
   - `Object Read & Write`
   - `Bucket Read`
3. Verify the token is active (not expired or revoked)
4. Update Vercel environment variables with correct keys:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
5. Redeploy Vercel after updating env vars

### 2. Cloudflare SSL/TLS Settings

**Symptom:** SSL errors on all uploads.

**Fix:**
1. Cloudflare Dashboard → SSL/TLS
2. Set encryption mode to **"Full (Strict)"**
3. Do NOT use "Flexible" mode (causes redirect loops)

### 3. Endpoint URL Issues

**Correct R2 Endpoint Format:**
```
https://<account-id>.r2.cloudflarestorage.com
```

**Common Mistakes:**
- ❌ Using HTTP instead of HTTPS
- ❌ Wrong account ID
- ❌ Using R2_PUBLIC_URL as the endpoint
- ❌ Using Cloudflare API token instead of R2 S3 credentials

### 4. Custom Domain SSL Issues (CRITICAL)

**Symptom:** SSL handshake failure when using custom domain for R2_PUBLIC_URL.

**Real Error:** `ssl3_read_bytes:ssl/tls alert handshake failure`

**Cause:** Custom domains (e.g., `images.yourdomain.com`) require proper SSL certificate configuration with Cloudflare R2. The r2.dev subdomain has built-in SSL that works immediately.

**Solution:**
**Use r2.dev URL instead of custom domain:**
- ❌ DON'T: `https://images.yourdomain.com`
- ✅ DO: `https://<account-id>.r2.dev`

**To get your r2.dev URL:**
1. Cloudflare Dashboard → R2 → Your Bucket
2. Look for "Public URL" or "r2.dev subdomain"
3. It looks like: `https://pub-xxxxx.r2.dev`

**If you MUST use custom domain:**
1. Cloudflare SSL/TLS → Edge Certificates → Enable Universal SSL
2. Add CNAME record in DNS pointing to R2
3. Configure custom domain in R2 bucket settings
4. Wait for SSL certificate to generate (can take 24 hours)

**Case Study:** ReceiptAI switched from custom domain `receiptimages.daeit.com.sg` back to r2.dev URL and uploads immediately worked.

### 5. Vercel Function Timeout

**Symptom:** Upload fails with timeout, not SSL error.

**Fix:**
- Increase function timeout in `vercel.json`
- Or use chunked upload for large files

## Testing Steps

### Step 1: Test n8n → Vercel (No R2)

Temporarily disable R2 upload in route.ts:
```typescript
// Skip actual R2 upload for testing
return NextResponse.json({ 
  success: true,
  testMode: true,
  message: 'R2 upload skipped'
});
```

If this works → n8n → Vercel is fine, problem is R2 credentials.

### Step 2: Verify R2 Credentials Locally

Test R2 connection outside Vercel:
```bash
curl -X PUT \
  "https://<account-id>.r2.cloudflarestorage.com/<bucket>/test.txt" \
  -H "Authorization: AWS <access-key>:<signature>" \
  --data "test"
```

### Step 3: Check Vercel Logs

In Vercel Dashboard:
1. Go to your project
2. Click "Functions" tab
3. Check logs for `/api/upload-receipt`
4. Look for specific error messages

## Working Configuration

**Vercel Environment Variables:**
```
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://<your-domain>/<bucket>
R2_BUCKET_NAME=<bucket-name>
R2_ACCESS_KEY_ID=<r2-s3-access-key>
R2_SECRET_ACCESS_KEY=<r2-s3-secret-key>
```

**Important:** Use R2 S3-compatible credentials, NOT Cloudflare API tokens.

## Prevention Checklist

Before rotating R2 credentials:
- [ ] Generate new S3-compatible tokens (not Cloudflare API tokens)
- [ ] Ensure tokens have Object Read & Write permissions
- [ ] Test locally first with new credentials
- [ ] Update Vercel env vars one at a time
- [ ] Deploy and test before revoking old credentials
- [ ] Keep old credentials as backup until verified

## Last Resort: Bypass SSL Verification

**WARNING:** Only for testing, not production!

In route.ts options:
```typescript
rejectUnauthorized: false  // Temporarily disable SSL verification
```

If this fixes it → SSL certificate issue, not credential issue.

## Getting Help

If all else fails:
1. Check Cloudflare R2 status: https://www.cloudflarestatus.com/
2. Test with AWS CLI: `aws s3 ls --endpoint-url=<r2-endpoint> s3://<bucket>`
3. Contact Cloudflare support with your account ID

## Temporary Workaround (Active Feb 2, 2026)

**Status:** SSL handshake issues persist between Vercel and Cloudflare R2.
**Current Solution:** Images stored locally in `/tmp` on Vercel server.
**⚠️ WARNING:** This is TEMPORARY - images will be lost on next deployment!

### What We Tried (All Failed):
- TLS 1.2 forced protocol
- AWS SDK default HTTP handler
- Fresh R2 API credentials
- Multiple TLS configurations

### Root Cause:
Infrastructure-level SSL/TLS incompatibility between Vercel's Node.js runtime and Cloudflare R2.

### Immediate Action Required:
**Contact Cloudflare Support:**
- Email: support@cloudflare.com
- Account ID: `e21ca487c714259a0c1d0ff82c8e8ff6f`
- Include error logs showing: `ssl3_read_bytes:ssl/tls alert handshake failure`
- Mention started Feb 1, 2026

### Alternative Permanent Solutions:
1. **Switch to AWS S3** (recommended)
2. **Use Vercel Blob Storage** (native Vercel solution)
3. **Upload directly from n8n** (bypass Vercel)

**DO NOT rely on /tmp storage for production use!**
