# R2 SigV4 Authentication Fix Guide

## **Problem Identified**
Cloudflare R2 requires **AWS Signature Version 4 (SigV4)** authentication, not the older Version 2.

Your curl test showed:
```
<Error><Code>Unauthorized</Code>
<Message>SigV2 authorization is not supported. Please use SigV4 instead.</Message></Error>
```

## **Solution Options**

### **Option 1: Use HTTP Request Node (RECOMMENDED - Easiest)**
Instead of using the AWS S3 node, use n8n's HTTP Request node which handles this automatically.

**I've created a new migration script for you:**
```bash
cd "/Users/siewloongchan/Documents/AI Projects/Receipts Parsing"
python3 migrate_to_r2_v2.py
```

This version:
- ✅ Uses HTTP Request nodes (no AWS credential issues)
- ✅ Pre-configured with your R2 credentials
- ✅ Same functionality, simpler setup

### **Option 2: Manual Fix in n8n**

If you already imported the workflow from the first script, you can manually change the node:

**In n8n Editor:**
1. Find the "Upload to R2" node (currently AWS S3 type)
2. **Delete it**
3. **Add new node:** HTTP Request
4. **Configure HTTP Request:**
   ```
   Method: PUT
   URL: =https://e21ca487c714259a0c1d0ff82c8eff6f.r2.cloudflarestorage.com/receiptai-images/receipts/{{ $json.user_id || $('Process Image').first().json.user_id }}/{{ $json.dynamic_filename }}
   
   Body: Binary
   Binary Property: ={{ Object.keys($input.first().binary)[0] }}
   
   Headers:
     Content-Type: image/jpeg
     x-amz-acl: public-read
   ```

5. **Connect nodes:** Build Filename → HTTP Request → Combine OCR

### **Option 3: Try AWS CLI with SigV4**

If you want to use AWS credentials in n8n, test with AWS CLI first:

```bash
# Install AWS CLI if not installed
brew install awscli  # On Mac

# Configure
aws configure --profile r2
# Access Key: <Set via R2_ACCESS_KEY_ID environment variable>
# Secret Key: <Set via R2_SECRET_ACCESS_KEY environment variable>
# Region: auto

# Test upload (set R2_ENDPOINT environment variable first)
aws s3 cp test.txt s3://receiptai-images/test.txt \
  --endpoint-url $R2_ENDPOINT \
  --profile r2 \
  --acl public-read
```

If this works, then the AWS S3 node in n8n should also work. If not, use Option 1 or 2.

## **Quick Reference: R2 Credentials**

**Set these as environment variables:**
```bash
export R2_ACCESS_KEY_ID="your-access-key-id"
export R2_SECRET_ACCESS_KEY="your-secret-access-key"
export R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
export R2_BUCKET_NAME="receiptai-images"
export R2_PUBLIC_URL="https://your-public-url.r2.dev"
```

**Never commit credentials to version control!**

## **Next Steps**

1. **Run the new script:**
   ```bash
   python3 migrate_to_r2_v2.py
   ```

2. **Import the generated workflow**

3. **Test with one receipt**

4. **Verify:**
   - Image appears in R2 dashboard
   - URL is accessible without authentication
   - Database has correct R2 URL

The HTTP Request approach is much simpler and avoids all the AWS credential complexity!