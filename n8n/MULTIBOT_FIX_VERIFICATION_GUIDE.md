# Multi-Bot Fix - Step-by-Step Verification Guide
**Created:** 2026-02-06 11:30 UTC  
**Goal:** Fix multi-bot routing with 100% verification at each step

---

## STEP 1: VERIFY CURRENT DATABASE STATE (5 mins)

### 1.1 Check Your User Record
```sql
SELECT id, username, telegram_chat_id, telegram_bot_token, telegram_bot_username
FROM users 
WHERE email = 'your-email@example.com';  -- Replace with your email
```

**Expected Result:** 
- Should show ONE row
- `telegram_chat_id` should be your Telegram user ID
- `telegram_bot_token` shows ExpenseBot_AntiGravity token

### 1.2 Check Your Multiple Bots
```sql
SELECT id, user_id, bot_token, bot_username, is_active, created_at
FROM user_telegram_bots
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');
```

**Expected Result:**
- Should show TWO rows:
  1. `ExpenseBot_AntiGravity` token (older)
  2. `OnboardTest_Jakarta` token (newer)
- Both should have `is_active = true`

### 1.3 Verify Recent Webhook Calls
```sql
SELECT chat_id, message_text, created_at
FROM webhook_logs  -- If this table exists
ORDER BY created_at DESC
LIMIT 10;
```

If no webhook_logs table, skip this step.

---

## STEP 2: TEST THE CURRENT QUERY (2 mins)

**Run this in pgAdmin (this is the current BROKEN query):**

```sql
-- Get your actual chat_id first
SELECT telegram_chat_id FROM users WHERE email = 'your-email@example.com';

-- Then test the current query (replace 123456789 with your actual chat_id)
SELECT u.id as user_id, u.telegram_bot_token, u.telegram_bot_username 
FROM users u 
WHERE u.telegram_chat_id = 123456789  -- Replace with your chat_id
LIMIT 1;
```

**Expected Result (PROBLEM):**
- Returns `ExpenseBot_AntiGravity` token
- Does NOT return `OnboardTest_Jakarta` token
- This explains why all responses go to the wrong bot!

---

## STEP 3: TEST THE FIXED QUERY (5 mins)

**Get your bot tokens first:**
```sql
SELECT bot_username, LEFT(bot_token, 20) || '...' as token_preview
FROM user_telegram_bots
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');
```

**Now test the FIXED query for ExpenseBot_AntiGravity:**

```sql
-- Replace 'YOUR_EXPENSEBOT_TOKEN_HERE' with the actual token
SELECT DISTINCT ON (u.id)
    u.id as user_id,
    utb.bot_token as telegram_bot_token,
    utb.bot_username as telegram_bot_username
FROM users u
LEFT JOIN user_telegram_bots utb ON utb.user_id = u.id
WHERE u.telegram_chat_id = 1256744399  -- Replace with your chat_id
   OR utb.bot_token = 'YOUR_EXPENSEBOT_TOKEN_HERE'
ORDER BY u.id, 
    CASE WHEN utb.bot_token = 'YOUR_EXPENSEBOT_TOKEN_HERE' THEN 0 ELSE 1 END
LIMIT 1;
```

**Expected Result:**
- Should return `ExpenseBot_AntiGravity` details
- Notice it prioritizes matching bot_token

**Now test for OnboardTest_Jakarta:**

```sql
-- Replace 'YOUR_ONBOARDTEST_TOKEN_HERE' with the actual token
SELECT DISTINCT ON (u.id)
    u.id as user_id,
    utb.bot_token as telegram_bot_token,
    utb.bot_username as telegram_bot_username
FROM users u
LEFT JOIN user_telegram_bots utb ON utb.user_id = u.id
WHERE u.telegram_chat_id = 1256744399  -- Replace with your chat_id
   OR utb.bot_token = 'YOUR_ONBOARDTEST_TOKEN_HERE'
ORDER BY u.id, 
    CASE WHEN utb.bot_token = 'YOUR_ONBOARDTEST_TOKEN_HERE' THEN 0 ELSE 1 END
LIMIT 1;
```

**Expected Result:**
- Should return `OnboardTest_Jakarta` details
- This proves the query can distinguish between bots!

---

## STEP 4: VERIFY WEBHOOK URL FORMAT (2 mins)

### 4.1 Check Webhook URLs in Telegram

**Run in pgAdmin:**
```sql
-- Check what webhooks are currently set
SELECT bot_username, webhook_url
FROM (
    SELECT 
        'YOUR_EXPENSEBOT_TOKEN_HERE' as bot_token,
        'https://api.telegram.org/bot' || 'YOUR_EXPENSEBOT_TOKEN_HERE' || '/getWebhookInfo' as webhook_url
    UNION ALL
    SELECT 
        'YOUR_ONBOARDTEST_TOKEN_HERE' as bot_token,
        'https://api.telegram.org/bot' || 'YOUR_ONBOARDTEST_TOKEN_HERE' || '/getWebhookInfo' as webhook_url
) bots;
```

**Manually check webhook URLs:**

Open these URLs in your browser (replace with actual tokens):
```
https://api.telegram.org/bot<EXPENSEBOT_TOKEN>/getWebhookInfo
https://api.telegram.org/bot<ONBOARDTEST_TOKEN>/getWebhookInfo
```

**Expected Result:**
Both should show:
```json
{
  "ok": true,
  "result": {
    "url": "https://n8ntest.daeit.com.sg/webhook/telegram-receipts?bot_token=<BOT_TOKEN>",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40,
    "ip_address": "xxx.xxx.xxx.xxx"
  }
}
```

**KEY CHECK:** Verify that `url` contains `?bot_token=` parameter

---

## STEP 5: FINAL VALIDATION QUERY (3 mins)

**Test the EXACT query that will go into n8n:**

```sql
-- Simulate what n8n will receive
WITH webhook_data AS (
    SELECT 
        1256744399 as chat_id,  -- Replace with your chat_id
        'YOUR_ONBOARDTEST_TOKEN_HERE' as bot_token_from_webhook  -- Replace with OnboardTest token
)
SELECT DISTINCT ON (u.id)
    u.id as user_id,
    utb.bot_token as telegram_bot_token,
    utb.bot_username as telegram_bot_username,
    CASE 
        WHEN utb.bot_token = w.bot_token_from_webhook THEN 'MATCHING_BOT'
        ELSE 'NON_MATCHING_BOT'
    END as match_status
FROM users u
LEFT JOIN user_telegram_bots utb ON utb.user_id = u.id
CROSS JOIN webhook_data w
WHERE u.telegram_chat_id = w.chat_id
   OR utb.bot_token = w.bot_token_from_webhook
ORDER BY u.id, 
    CASE WHEN utb.bot_token = w.bot_token_from_webhook THEN 0 ELSE 1 END
LIMIT 1;
```

**Expected Result:**
- Returns `OnboardTest_Jakarta` details
- `match_status` = 'MATCHING_BOT'

**Now test with ExpenseBot token:**
```sql
WITH webhook_data AS (
    SELECT 
        1256744399 as chat_id,
        'YOUR_EXPENSEBOT_TOKEN_HERE' as bot_token_from_webhook  -- Replace with ExpenseBot token
)
SELECT DISTINCT ON (u.id)
    u.id as user_id,
    utb.bot_token as telegram_bot_token,
    utb.bot_username as telegram_bot_username,
    CASE 
        WHEN utb.bot_token = w.bot_token_from_webhook THEN 'MATCHING_BOT'
        ELSE 'NON_MATCHING_BOT'
    END as match_status
FROM users u
LEFT JOIN user_telegram_bots utb ON utb.user_id = u.id
CROSS JOIN webhook_data w
WHERE u.telegram_chat_id = w.chat_id
   OR utb.bot_token = w.bot_token_from_webhook
ORDER BY u.id, 
    CASE WHEN utb.bot_token = w.bot_token_from_webhook THEN 0 ELSE 1 END
LIMIT 1;
```

**Expected Result:**
- Returns `ExpenseBot_AntiGravity` details
- `match_status` = 'MATCHING_BOT'

---

## ✅ VERIFICATION COMPLETE

If all steps pass, the fixed query is working correctly!

**Next:** Proceed to STEP 6 (Update n8n Workflow)

---

## STEP 6: UPDATE N8N WORKFLOW (Only after SQL tests pass)

### 6.1 Open n8n Editor
1. Go to https://n8ntest.daeit.com.sg (or your n8n instance)
2. Find workflow: "v18 Wrapper - Telegram Chat ID Fix V5 (Enhanced Debugging)"
3. Click to edit

### 6.2 Update "Lookup User Bot Token" Node

**Current SQL (lines 38):**
```sql
SELECT u.id as user_id, u.telegram_bot_token, u.telegram_bot_username 
FROM users u 
WHERE u.telegram_chat_id = {{ $json.chat_id }}
   OR ('{{ $json.bot_token_from_webhook }}' != '' AND u.telegram_bot_token = '{{ $json.bot_token_from_webhook }}')
LIMIT 1
```

**Replace with:**
```sql
SELECT DISTINCT ON (u.id)
    u.id as user_id,
    utb.bot_token as telegram_bot_token,
    utb.bot_username as telegram_bot_username
FROM users u
LEFT JOIN user_telegram_bots utb ON utb.user_id = u.id
WHERE u.telegram_chat_id = {{ $json.chat_id }}
   OR utb.bot_token = '{{ $json.bot_token_from_webhook }}'
ORDER BY u.id, 
    CASE WHEN utb.bot_token = '{{ $json.bot_token_from_webhook }}' THEN 0 ELSE 1 END
LIMIT 1
```

### 6.3 Save and Test
1. Save the workflow (Ctrl+S)
2. Click "Activate" if not already active
3. Keep the workflow editor open

---

## STEP 7: LIVE TESTING (5 mins)

### 7.1 Test OnboardTest_Jakarta Bot
1. Open Telegram
2. Go to `OnboardTest_Jakarta` bot
3. Send: `/start`
4. **Expected:** Response appears in `OnboardTest_Jakarta` chat
5. **Fail:** Response appears in `ExpenseBot_AntiGravity` chat

### 7.2 Test ExpenseBot_AntiGravity
1. Go to `ExpenseBot_AntiGravity` bot
2. Send: `/start` or upload a receipt
3. **Expected:** Response appears in `ExpenseBot_AntiGravity` chat

### 7.3 Cross-Bot Test
1. Upload receipt to `OnboardTest_Jakarta`
2. **Expected:** Processing message appears in `OnboardTest_Jakarta`
3. Upload receipt to `ExpenseBot_AntiGravity`
4. **Expected:** Processing message appears in `ExpenseBot_AntiGravity`

---

## TROUBLESHOOTING

### Problem: Query returns NULL
**Check:**
```sql
-- Verify bot token exists
SELECT * FROM user_telegram_bots WHERE bot_token = 'YOUR_TOKEN_HERE';

-- Verify user exists
SELECT * FROM users WHERE telegram_chat_id = 123456789;
```

### Problem: Wrong bot still responding
**Check webhook URL:**
```sql
-- Get webhook URL for both bots and verify bot_token is in URL
```

### Problem: No response at all
**Check n8n execution logs:**
1. Go to n8n → Executions
2. Find recent execution of wrapper workflow
3. Check for errors

---

## ROLLBACK PROCEDURE (If Needed)

If anything goes wrong:

```bash
# SSH into NAS
cd /volume1/docker/ReceiptParcer

# Revert to backup
cp n8n/BACKUP_Wrapper_V5_20260206_1105.json "n8n/v18 Wrapper - Telegram Chat ID Fix V5 (Enhanced Debugging).json"

# Or use git
git checkout PRE_MULTIBOT_FIX_20260206_1105 -- "n8n/v18 Wrapper - Telegram Chat ID Fix V5 (Enhanced Debugging).json"
```

Then re-import the workflow in n8n.

---

**Ready to start?** Begin with STEP 1 and report back what you find!
