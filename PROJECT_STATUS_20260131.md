# Receipts Parsing Project - Security Remediation & SSL/TLS Issues

## Summary of Work Done (2026-01-31)

### **Critical Security Issues Fixed:**
1. ✅ **Rotated Cloudflare R2 credentials** - Deleted old token, created new one
2. ✅ **Removed hardcoded credentials** from all files (R2, database, etc.)
3. ✅ **Fixed SQL injection risk** in expenses route
4. ✅ **Added filename validation** to prevent path traversal attacks
5. ✅ **Updated to custom domain** `https://receiptimages.daeit.com.sg` (from r2.dev URL)

### **Current Problem:**
**SSL/TLS handshake failure** when uploading from Vercel API to Cloudflare R2:
```
ssl/tls alert handshake failure:ssl/record/rec_layer_s3.c:912:SSL alert number 40
```

### **What We've Tried (All Failed):**
1. **AWS SDK** - Failed with SSL issues
2. **aws4fetch + fetch()** - Failed with SSL issues  
3. **Node.js runtime** (`runtime = 'nodejs'`) - Still failing
4. **axios with manual SigV4** - Failed with SSL issues
5. **Native https module with TLS 1.2** - Failed with SSL issues

### **Root Cause:**
Fundamental TLS compatibility issue between Vercel's Node.js runtime and Cloudflare R2's TLS configuration.

## **Current Status:**

### **Files Modified:**
- `/receipt-parser-web/app/api/upload-receipt/route.ts` - Latest: Native https module with TLS 1.2
- `/receipt-parser-web/.env.local` - Updated R2 credentials and custom domain
- `/n8n/v18_Dashboard_R2_Direct_20260131_FINAL.json` - Backup direct upload workflow

### **Environment Variables Configured:**
```
R2_ACCESS_KEY_ID=01a434e4cb02672e8a7d3dd39735bc79
R2_SECRET_ACCESS_KEY=8fb7a36b6293adb4c2927ad68e25f8176f5c01d5b6cdb5336e2768b2fde961d5
R2_ENDPOINT=https://e21ca487c714259a0c1d0ff82c8e8ff6f.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://receiptimages.daeit.com.sg
DATABASE_URL=postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB
```

## **CRITICAL SECURITY ALERT - EXPOSED API KEYS:**

### **⚠️ URGENT ACTION REQUIRED - API KEYS EXPOSED:**
1. **Google API keys exposed** in GitHub history (now cleaned locally):
   - `AIzaSyC9SlDURPMIRDFIdKTAkH5ZmSwmum8cOy0` (Google Vision)
   - `AIzaSyA2cfjpSVhdVgBVJPNUyTDDzAxtEcASEpk` (Google Gemini)
   
2. **Anthropic API key exposed and deactivated**:
   - `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`
   
3. **Other API keys exposed**:
   - Groq, Together AI, Alibaba, DeepSeek keys

### **✅ LOCAL CLEANUP COMPLETED:**
- Scripts run: `clean_api_keys.sh` and `clean_all_keys.sh`
- API keys replaced with placeholders in all n8n JSON files
- Backups saved in `backup_20260201_094446/` and `backup_all_20260201_094547/`

### **🚨 IMMEDIATE ACTIONS REQUIRED:**
1. **REVOKE ALL EXPOSED KEYS** in respective platforms
2. **Set new API keys** as environment variables in n8n
3. **Update n8n workflows** to use `{{ $env.API_KEY_NAME }}` syntax
4. **Commit cleaned files** to GitHub
5. **Consider purging git history** of exposed keys

## **To-Do List (Priority Order):**

### **CRITICAL PRIORITY - Security First:**
1. **Revoke exposed API keys** in all platforms
2. **Set new API keys** as n8n environment variables
3. **Update n8n workflows** to use environment variables

### **HIGH PRIORITY - Functionality:**
4. **Implement Direct n8n→R2 Upload** (Backup plan ready)
   - Set R2 env vars in n8n instance
   - Import workflow: `v18_Dashboard_R2_Direct_20260131_FINAL.json`
   - Disable old workflow calling Vercel API
   - Test with Telegram image upload

5. **Test Custom Domain**
   - Verify uploaded images accessible at: `https://receiptimages.daeit.com.sg/receipts/{userId}/{filename}`

### **MEDIUM PRIORITY - Next Steps:**
3. **Add Image Compression to n8n** (Optional)
   - Install sharp in n8n or implement compression logic
   - Or accept larger file sizes temporarily

4. **Investigate TLS Compatibility**
   - Contact Cloudflare support about Vercel TLS issues
   - Consider alternative storage (Backblaze B2, AWS S3)

### **LOW PRIORITY - Future Improvements:**
5. **Implement Hybrid Solution**
   - Try upload via Vercel first
   - Fall back to direct upload if SSL fails
   - Requires workflow logic changes

6. **Security Audit**
   - Verify all credentials properly rotated
   - Check for any remaining hardcoded secrets
   - Review SQL injection prevention

## **Rollback Options:**

### **Option A: Revert to Previous Working State**
1. **Restore old R2 credentials** (if backed up)
2. **Revert upload-receipt route** to previous working version
3. **Use old workflow** without R2 integration

### **Option B: Alternative Storage Solution**
1. **Set up Backblaze B2 or AWS S3**
2. **Update environment variables**
3. **Modify upload logic** for new storage provider

### **Option C: Self-hosted Upload Service**
1. **Deploy small Node.js service** on compatible VM
2. **Handle TLS negotiation** with Cloudflare R2
3. **Update n8n to call** new service endpoint

## **Files Created/Modified:**

### **Critical Files:**
1. `receipt-parser-web/app/api/upload-receipt/route.ts` - Current upload logic
2. `receipt-parser-web/.env.local` - Environment variables
3. `n8n/v18_Dashboard_R2_Direct_20260131_FINAL.json` - Backup workflow

### **Test Files:**
4. `test_upload.js` - Test image generator
5. `test_jpeg.js` - JPEG test generator
6. `n8n/direct_r2_upload_backup.json` - Simple test workflow

## **Next Session Starting Point:**

### **If Direct Upload Works:**
1. Monitor Telegram uploads
2. Verify custom domain URLs
3. Consider adding compression

### **If Direct Upload Also Fails:**
1. Check n8n TLS compatibility
2. Consider alternative storage providers
3. Investigate Cloudflare Worker proxy

### **Security Verification:**
1. Ensure no credentials in git history
2. Verify database connection security
3. Check all API endpoints for injection risks

## **Key Decisions Made:**
1. **Custom domain over r2.dev URLs** - Better branding, consistent
2. **Manual AWS SigV4 signing** - Required for Cloudflare R2 compatibility
3. **Bypass Vercel for uploads** - Necessary due to TLS incompatibility
4. **Keep image processing in Vercel** - For now, accept uncompressed uploads

## **Dependencies:**
- ✅ axios installed
- ✅ date-fns installed  
- ✅ sharp already present
- ❌ n8n environment variables need setting
- ❌ n8n workflow needs importing

---

**Status:** Ready for n8n configuration and testing of direct upload approach.

## **Immediate Next Actions:**
1. **Set R2 environment variables in n8n:**
   ```
   R2_ACCESS_KEY_ID=01a434e4cb02672e8a7d3dd39735bc79
   R2_SECRET_ACCESS_KEY=8fb7a36b6293adb4c2927ad68e25f8176f5c01d5b6cdb5336e2768b2fde961d5
   ```
2. **Import workflow:** `n8n/v18_Dashboard_R2_Direct_20260131_FINAL.json`
3. **Disable old workflow** that calls Vercel API
4. **Test** with Telegram image upload