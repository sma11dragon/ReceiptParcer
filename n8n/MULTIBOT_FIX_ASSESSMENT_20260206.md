# Multi-Bot Routing Fix - Impact Assessment & Implementation Plan
**Created:** 2026-02-06 11:05 UTC  
**Restoration Point:** PRE_MULTIBOT_FIX_20260206_1105  
**Status:** ASSESSMENT ONLY - No changes made yet

---

## Executive Summary

**Issue:** The current n8n workflow only supports ONE bot per user. When a user has multiple bots, all responses are incorrectly routed to the first bot (ExpenseBot_AntiGravity) instead of the bot that received the message (OnboardTest_Jakarta).

**Root Cause:** The wrapper workflow queries only the `users` table, which stores a single `telegram_bot_token`. It ignores the `user_telegram_bots` table where multiple bot tokens are stored.

**Solution:** Update the wrapper workflow to JOIN with `user_telegram_bots` table and route responses based on the bot token from the webhook URL.

---

## 1. BACKUPS CREATED

### Git Restoration Point
- **Tag:** `PRE_MULTIBOT_FIX_20260206_1105`
- **Commit:** `e3b0ed4d`
- **Backup Files:**
  - `n8n/BACKUP_Wrapper_V5_20260206_1105.json` (23KB)
  - `n8n/BACKUP_Dashboard_current_20260206_1105.json` (286KB)

### To Restore:
```bash
# Option 1: Git revert
git checkout PRE_MULTIBOT_FIX_20260206_1105

# Option 2: Manual file restore
cp n8n/BACKUP_Wrapper_V5_20260206_1105.json n8n/v18\ Wrapper\ -\ Telegram\ Chat\ ID\ Fix\ V5\ \(Enhanced\ Debugging\).json
cp n8n/BACKUP_Dashboard_current_20260206_1105.json n8n/v18\ Dashboard\ -\ Telegram\ Chat\ ID\ Fix\ -\ current.json
```

---

## 2. IMPACTED COMPONENTS

### A. n8n Workflow Files (REQUIRED CHANGES)

| File | Change Type | Risk Level | Description |
|------|-------------|------------|-------------|
| `v18 Wrapper - Telegram Chat ID Fix V5 (Enhanced Debugging).json` | MODIFY | **HIGH** | Main wrapper that receives webhooks. Must update SQL query in "Lookup User Bot Token" node. |
| `v18 Dashboard - Telegram Chat ID Fix - current.json` | NO CHANGE | N/A | Dashboard workflow is called by wrapper with correct data. Should work if wrapper passes correct bot_token. |

**Specific Changes Required in Wrapper:**
1. **"Lookup User Bot Token" node** (Line 38): Update SQL query
2. **"Normalize Telegram Data" node**: Verify bot_token extraction from webhook URL
3. **"Merge Bot Token" node**: Ensure proper bot_token passing to dashboard

### B. Database Impact

| Table | Impact | Description |
|-------|--------|-------------|
| `users` | READ ONLY | No schema changes. Query will still read from users table but JOIN with user_telegram_bots. |
| `user_telegram_bots` | READ ONLY | Already exists and populated. Just need to query it properly. |
| `expenses` | NO IMPACT | Records already include bot_token field. New records will continue to work. |
| `expense_tracker_pending` | NO IMPACT | Same as above. |

**Current Query (PROBLEMATIC):**
```sql
SELECT u.id as user_id, u.telegram_bot_token, u.telegram_bot_username 
FROM users u 
WHERE u.telegram_chat_id = {{ $json.chat_id }}
   OR ('{{ $json.bot_token_from_webhook }}' != '' AND u.telegram_bot_token = '{{ $json.bot_token_from_webhook }}')
LIMIT 1
```

**Proposed Query (FIXED):**
```sql
SELECT DISTINCT ON (u.id)
    u.id as user_id,
    utb.bot_token as telegram_bot_token,
    utb.bot_username as telegram_bot_username
FROM users u
LEFT JOIN user_telegram_bots utb ON utb.user_id = u.id
WHERE u.telegram_chat_id = {{ $json.chat_id }}
   OR (utb.bot_token = '{{ $json.bot_token_from_webhook }}')
ORDER BY u.id, 
    CASE WHEN utb.bot_token = '{{ $json.bot_token_from_webhook }}' THEN 0 ELSE 1 END
LIMIT 1
```

### C. Credentials & Environment Variables

| Credential | Impact | Notes |
|------------|--------|-------|
| Postgres DB | NONE | Read-only query changes, no credentials needed |
| Telegram Bot Tokens | NONE | Already stored in database |
| N8N Webhook URL | NONE | No changes to webhook configuration |

**NO credential changes required.**

### D. Web Application Impact

| Component | Impact | Description |
|-----------|--------|-------------|
| Registration (`/register`) | NONE | Already inserts into `user_telegram_bots` correctly |
| Dashboard | NONE | Reads bot list from `user_telegram_bots` |
| API Routes | NONE | No changes needed |

---

## 3. RISK ASSESSMENT

### HIGH RISK Items

1. **Wrapper Workflow Query Change**
   - **Risk:** Incorrect query could break ALL bot processing
   - **Mitigation:** Test with one bot first, verify query in pgAdmin before deployment
   - **Rollback:** Revert to backup file or git tag

2. **Bot Token Routing Logic**
   - **Risk:** If webhook bot_token extraction fails, no messages will be processed
   - **Mitigation:** Add fallback logic to use chat_id lookup if bot_token not found
   - **Test:** Verify webhook URL includes bot_token parameter

### MEDIUM RISK Items

3. **Multiple Bot Response Routing**
   - **Risk:** First-time bot interactions might not have chat_id linked yet
   - **Mitigation:** Ensure /start command flow works with bot_token lookup

### LOW RISK Items

4. **Existing Expenses**
   - **Risk:** Existing records are fine, no impact on historical data
   - **Note:** All expenses already store bot_token, no migration needed

---

## 4. IMPLEMENTATION PLAN

### Phase 1: Preparation (SAFE - No Risk)
1. ✅ Create backups (DONE)
2. ✅ Create git tag (DONE)
3. Verify `user_telegram_bots` table has data for both bots
4. Test current webhook URL format in browser/curl

### Phase 2: Query Development (SAFE - Read Only)
1. Open pgAdmin or psql
2. Test proposed SQL query with real data
3. Verify it returns correct bot_token for each scenario:
   - User sends message from Bot A
   - User sends message from Bot B
   - New user without chat_id yet

### Phase 3: Workflow Update (MODERATE RISK)
1. Update "Lookup User Bot Token" node in n8n
2. Save workflow with new version name
3. Activate new workflow
4. **DO NOT** delete old workflow yet

### Phase 4: Testing (CONTROLLED RISK)
1. Test with `OnboardTest_Jakarta` bot:
   - Send /start command
   - Verify welcome message comes from same bot
   - Upload receipt image
   - Verify processing message comes from same bot
2. Test with `ExpenseBot_AntiGravity` bot:
   - Verify it still works correctly
3. Test error scenarios:
   - Unregistered user
   - Missing bot_token in webhook

### Phase 5: Rollback Plan (If Issues)
1. Deactivate new workflow
2. Activate backup workflow
3. Or revert git and re-import old JSON
4. Verify both bots work with old workflow

---

## 5. VERIFICATION CHECKLIST

Before implementation, verify:
- [ ] Both bots are in `user_telegram_bots` table
- [ ] Webhook URLs contain `?bot_token=` parameter
- [ ] pgAdmin access available for query testing
- [ ] n8n workflow editor access available
- [ ] Rollback plan understood

After implementation, verify:
- [ ] `OnboardTest_Jakarta` sends responses to itself
- [ ] `ExpenseBot_AntiGravity` still works
- [ ] New user registration still works
- [ ] Receipt processing works from both bots
- [ ] Query performance is acceptable (< 100ms)

---

## 6. SUCCESS CRITERIA

1. **Primary:** When user presses "Start" on `OnboardTest_Jakarta`, welcome message appears in `OnboardTest_Jakarta` chat (not `ExpenseBot_AntiGravity`)

2. **Secondary:** Receipt images sent to `OnboardTest_Jakarta` are processed and responses appear in `OnboardTest_Jakarta` chat

3. **Tertiary:** Both bots can be used simultaneously by the same user without interference

---

## 7. OPEN QUESTIONS

1. What is the current webhook URL format? Does it include bot_token?
2. Are there any existing records in `user_telegram_bots` that might conflict?
3. Should we also update the Dashboard workflow to handle multiple bots better?
4. Do we need a "default bot" fallback for users who haven't linked their chat_id yet?

---

**Next Step:** Review this assessment, then decide:
- Option A: Proceed with Phase 1-2 (Query development in pgAdmin)
- Option B: Wait for more information
- Option C: Abandon multi-bot support for now
