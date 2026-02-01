# 🚀 Step-by-Step Guide: Update n8n for API Authentication

## 📋 Prerequisites
- ✅ Security code deployed to Vercel
- ✅ API requires authentication (n8n workflows will break)
- ✅ You have pgAdmin/DBeaver installed
- ✅ You have access to your PostgreSQL database

## 🎯 Goal
Update n8n workflows to include JWT authentication so they continue working.

---

## 🔧 STEP 1: Create Service Account in Database

### 1.1 Open your database client (pgAdmin/DBeaver)
- Connect to your PostgreSQL database
- Make sure you're connected to `sma11dragon_DB`

### 1.2 Run this SQL to check if account exists:
```sql
SELECT id, username, email, is_verified 
FROM users 
WHERE email = 'n8n-service@receiptai.com';
```

### 1.3 If NO results, create the account:
```sql
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  is_verified, 
  location
) VALUES (
  'n8n-service',
  'n8n-service@receiptai.com',
  '$2b$12$TnOovoDSIoHVP4KsKge4LeGdhSOUlkY0yZhpl.Odk8DRLbnELaZbi',
  true,
  'Automation'
) RETURNING id;
```

**Important:** Copy the returned user ID (e.g., `3`, `4`, `5`, etc.)

### 1.4 Verify the account:
```sql
SELECT id, username, email, is_verified 
FROM users 
WHERE email = 'n8n-service@receiptai.com';
```

**📝 Note down:** User ID = ______

---

## 🔐 STEP 2: Generate JWT Token

### 2.1 Get your JWT_SECRET from Vercel:
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your `receipt-parcer` project
3. Go to Settings → Environment Variables
4. Copy the value of `JWT_SECRET`

**📝 Note down:** JWT_SECRET = ______

### 2.2 Generate the token:
Open terminal and run:

```bash
cd "/Users/siewloongchan/Documents/AI Projects/Receipts Parsing"
JWT_SECRET="YOUR_SECRET_FROM_VERCEL" node generate-n8n-token.js YOUR_USER_ID
```

**Example:**
```bash
JWT_SECRET="abc123def456ghi789" node generate-n8n-token.js 3
```

### 2.3 Save the generated token:
The script will output a long JWT token. Copy it.

**📝 Note down:** JWT Token = ______

---

## 🧪 STEP 3: Test the Token

### 3.1 Test with curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://receipt-parcer.vercel.app/api/upload-receipt?userId=1&filename=test.jpg"
```

**Expected response:** Validation errors (not 401 Unauthorized)

### 3.2 Or use the test script:
```bash
node test-api-with-auth.js "YOUR_TOKEN"
```

---

## ⚙️ STEP 4: Update n8n Workflow

### 4.1 Open n8n
- Launch your n8n instance
- Open the workflow: `v18_Dashboard_R2_Binary_20260131_103610.json`

### 4.2 Find the HTTP Request node:
- Look for node calling: `https://receipt-parcer.vercel.app/api/upload-receipt`
- It should have parameters: `userId` and `filename`

### 4.3 Add Authorization header:
1. Click on the HTTP Request node
2. Go to "Add Option" → "Headers"
3. Add new header:
   - **Name**: `Authorization`
   - **Value**: `Bearer YOUR_TOKEN` (replace with actual token)

### 4.4 Node configuration should look like:
```
URL: =https://receipt-parcer.vercel.app/api/upload-receipt?userId={{ $json.user_id }}&filename={{ $json.dynamic_filename }}
Method: POST
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: binaryData
Binary Property: data
```

### 4.5 Save the workflow

---

## 🧪 STEP 5: Test Updated Workflow

### 5.1 Test in n8n:
1. Click "Test Workflow" button
2. Check if it executes successfully
3. Look for any errors in the HTTP Request node

### 5.2 Check response:
- Should NOT get 401 Unauthorized
- May get validation errors (which is OK - means auth worked)

### 5.3 If it fails:
- Check token is correct
- Verify "Bearer " prefix
- Check user exists in database

---

## 🔄 STEP 6: Update Other Workflows

Update these workflows (same process as Step 4):

1. `v18_Dashboard_R2_Base64_20260131_101933.json`
2. `v18 Dashboard - Telegram Chat ID Fix.json`
3. Any other workflow calling the API

**Tip:** Use the same JWT token for all workflows.

---

## 📊 STEP 7: Monitor and Verify

### 7.1 Check Vercel logs:
1. Go to Vercel Dashboard → Project → Analytics
2. Check for 401 errors (should decrease)
3. Check for 500 errors (database issues)

### 7.2 Test complete flow:
1. Send a receipt through Telegram/n8n
2. Verify it processes correctly
3. Check database for new expenses

### 7.3 Monitor for 24 hours:
- Watch for authentication failures
- Check n8n execution logs
- Verify data consistency

---

## 🚨 Troubleshooting

### Problem: 401 Unauthorized
**Solution:**
- Token expired or invalid
- Missing "Bearer " prefix
- Wrong JWT_SECRET used
- User doesn't exist in database

### Problem: 500 Internal Server Error
**Solution:**
- Database connection issue
- Check Vercel logs for details
- Verify DATABASE_URL in Vercel

### Problem: n8n workflow fails silently
**Solution:**
- Enable debug logging in n8n
- Check HTTP response in node
- Test with curl to isolate issue

---

## ✅ Success Checklist

- [ ] Service account created in database (User ID: ______)
- [ ] JWT token generated (Token: ______)
- [ ] Token tested with API (returns validation errors, not 401)
- [ ] First n8n workflow updated with Authorization header
- [ ] Updated workflow tested successfully
- [ ] All other n8n workflows updated
- [ ] Complete flow tested end-to-end
- [ ] No 401 errors in Vercel logs
- [ ] Receipts processing normally

---

## 📞 Need Help?

### Check these files:
- `create-service-account.sql` - SQL commands
- `generate-n8n-token.js` - Token generation script
- `test-api-with-auth.js` - API testing
- `N8N_WORKFLOW_UPDATE_GUIDE.md` - Detailed instructions

### Common issues:
1. **Database connection**: Make sure PostgreSQL is running on NAS
2. **JWT secret**: Must match between token generation and API
3. **Token format**: Must include "Bearer " prefix
4. **User ID**: Must exist in database

---

## ⏰ Timeline

- **Now**: n8n workflows broken, need immediate update
- **+30 min**: First workflow updated and tested
- **+2 hours**: All workflows updated
- **+24 hours**: System stable, monitor logs

---

## 🔒 Security Notes

1. **Store token securely** in n8n credentials
2. **Do NOT commit** token to version control
3. **Token expires** in 365 days (set reminder)
4. **Regenerate token** if compromised
5. **Service account** has minimal permissions

---

## 🎉 Done!

Once all workflows are updated and tested:
1. ✅ n8n workflows work with authentication
2. ✅ API is secure
3. ✅ No exposed credentials
4. ✅ System monitoring in place

**Next:** Revoke exposed API keys (Google, Anthropic, etc.)