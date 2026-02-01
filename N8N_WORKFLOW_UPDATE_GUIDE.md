# n8n Workflow Update Guide for API Authentication

## Overview
The ReceiptAI API now requires JWT authentication. All n8n workflows that call `https://receipt-parcer.vercel.app/api/*` endpoints must be updated to include an Authorization header.

## Current Status
- ✅ Security updates deployed to Vercel
- ✅ API endpoints now require JWT tokens
- ❌ n8n workflows will break without updates
- ❌ Service account needs to be created

## Step 1: Create Service Account in Database

### Option A: Using Database Client
1. Connect to your PostgreSQL database
2. Run the following SQL:

```sql
-- Create n8n service account
INSERT INTO users (username, email, password_hash, is_verified, location)
VALUES (
  'n8n-service',
  'n8n-service@receiptai.com',
  -- Generate hash for a secure password (use bcrypt with cost 12)
  '$2a$12$YourGeneratedHashHere',
  true,
  'Automation'
) RETURNING id;
```

3. Save the returned user ID (e.g., `3`)

### Option B: Using the Provided Script
1. Make sure your database is accessible
2. Run: `node create-n8n-service-account.js`
3. Save the generated user ID and password

## Step 2: Generate JWT Token

You need a JWT token for the service account. The token should contain:
```json
{
  "id": <user_id_from_step_1>,
  "email": "n8n-service@receiptai.com",
  "role": "service",
  "iss": "receiptai-n8n-service",
  "exp": <future_timestamp>
}
```

### Generate token using:
```bash
# Using Node.js
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    id: 3,  # Replace with actual user ID
    email: 'n8n-service@receiptai.com',
    role: 'service',
    iss: 'receiptai-n8n-service'
  },
  process.env.JWT_SECRET,  # Use your JWT_SECRET from Vercel
  { expiresIn: '365d' }
);
console.log(token);
"
```

## Step 3: Update n8n Workflow

### For each HTTP Request node calling the API:

1. **Open the HTTP Request node** that calls:
   ```
   https://receipt-parcer.vercel.app/api/upload-receipt
   ```

2. **Add Authorization Header**:
   - Go to "Add Option" → "Headers"
   - Add a new header:
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_JWT_TOKEN_HERE`

3. **Example Configuration**:
   ```
   URL: =https://receipt-parcer.vercel.app/api/upload-receipt?userId={{ $json.user_id }}&filename={{ $json.dynamic_filename }}
   Method: POST
   Headers:
     - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Content-Type: binaryData
   Binary Property: data
   ```

4. **Save and test** the workflow

## Step 4: Update All Affected Workflows

Check and update these workflows:
1. `v18_Dashboard_R2_Binary_20260131_103610.json`
2. `v18 Dashboard - Telegram Chat ID Fix.json`
3. `v18_Dashboard_R2_Base64_20260131_101933.json`
4. Any other workflow calling the API

## Step 5: Test the Updated Workflow

### Test Steps:
1. **Manual Test**: Use the "Test Workflow" button in n8n
2. **API Test**: Use curl to verify:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     "https://receipt-parcer.vercel.app/api/upload-receipt?userId=1&filename=test.jpg" \
     -d '{"test":"data"}'
   ```
3. **Expected Response**: Should return validation errors (not 401 Unauthorized)

## Step 6: Monitor and Troubleshoot

### Common Issues:

1. **401 Unauthorized**:
   - Token expired or invalid
   - Missing "Bearer " prefix
   - Wrong JWT_SECRET used

2. **403 Forbidden**:
   - User doesn't have required permissions
   - Token doesn't have correct claims

3. **500 Internal Server Error**:
   - Database connection issues
   - Environment variable problems

### Debug Steps:
1. Check Vercel logs for API errors
2. Verify database connection
3. Test token validation locally
4. Check user exists in database

## Security Considerations

1. **Token Storage**: Store JWT token securely in n8n credentials
2. **Token Rotation**: Consider rotating tokens periodically
3. **Scope Limitation**: Service account should have minimal permissions
4. **Monitoring**: Monitor for unauthorized access attempts

## Rollback Plan

If authentication causes issues:

1. **Temporary Fix**: Comment out auth middleware in API routes
2. **Update Code**: Fix authentication issues
3. **Redeploy**: Push fixes to Vercel
4. **Update n8n**: Once fixed, re-enable authentication

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connection
4. Contact development team

## Next Steps After Update

1. ✅ Update all n8n workflows
2. ✅ Test authentication works
3. ✅ Monitor for any issues
4. ✅ Revoke exposed API keys (Google, Anthropic, etc.)
5. ✅ Update documentation

## Important Notes

- **DO NOT** commit JWT tokens to version control
- **DO** use n8n's credential management for tokens
- **TEST** thoroughly before deploying to production
- **MONITOR** logs for authentication failures

## Sample Token (for testing only - replace with actual)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJuOG4tc2VydmljZUByZWNlaXB0YWkuY29tIiwicm9sZSI6InNlcnZpY2UiLCJpc3MiOiJyZWNlaXB0YWktbjhuLXNlcnZpY2UiLCJpYXQiOjE3Njk5Mjg0MDQsImV4cCI6MTgwMTQ2NDQwNH0.REPLACE_WITH_ACTUAL_SIGNATURE
```