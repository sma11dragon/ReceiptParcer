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

### 4. Vercel Function Timeout

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
