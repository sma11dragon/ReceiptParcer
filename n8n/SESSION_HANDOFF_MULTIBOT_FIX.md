# SESSION HANDOFF: Multi-Bot Routing Fix
**Date:** 2026-02-06 11:30 UTC  
**Status:** Assessment Complete - Ready for Implementation  
**Next Action:** Execute MULTIBOT_FIX_VERIFICATION_GUIDE.md

---

## ✅ RESTORATION POINT CREATED

### Git Tag (Primary Rollback)
```bash
# Tag Name: PRE_MULTIBOT_FIX_20260206_1105
# Commit: ce7685eb
git tag -a PRE_MULTIBOT_FIX_20260206_1105 -m "Restoration point before multi-bot routing fix"

# To rollback:
git checkout PRE_MULTIBOT_FIX_20260206_1105
# OR
git reset --hard PRE_MULTIBOT_FIX_20260206_1105
```

### File Backups (Secondary Rollback)
Located in: `/Users/siewloongchan/Documents/AI Projects/Receipts Parsing/n8n/`
- `BACKUP_Wrapper_V5_20260206_1105.json` (23KB)
- `BACKUP_Dashboard_current_20260206_1105.json` (286KB)

```bash
# To restore from file backups:
cd /Users/siewloongchan/Documents/AI\ Projects/Receipts\ Parsing
cp n8n/BACKUP_Wrapper_V5_20260206_1105.json "n8n/v18 Wrapper - Telegram Chat ID Fix V5 (Enhanced Debugging).json"
```

---

## 📋 DOCUMENTATION FILES

All documentation is in: `/Users/siewloongchan/Documents/AI Projects/Receipts Parsing/n8n/`

### 1. MULTIBOT_FIX_ASSESSMENT_20260206.md
**Purpose:** Impact analysis and risk assessment  
**Read this first** to understand:
- What files will be modified
- Risk levels for each change
- Database impact analysis
- Success criteria

### 2. MULTIBOT_FIX_VERIFICATION_GUIDE.md ⭐ **PRIMARY GUIDE**
**Purpose:** Step-by-step implementation with verification  
**Follow this exactly** - it has:
- 7 sequential steps
- Exact SQL queries to run
- Expected results for each step
- Troubleshooting guide
- Rollback procedures

### 3. This file: SESSION_HANDOFF_MULTIBOT_FIX.md
**Purpose:** Quick reference for next agent

---

## 🔍 CURRENT SITUATION

### The Problem
User has TWO Telegram bots:
1. `ExpenseBot_AntiGravity` (original bot)
2. `OnboardTest_Jakarta` (new bot)

**Issue:** When user sends message to `OnboardTest_Jakarta`, responses go to `ExpenseBot_AntiGravity` instead.

**Root Cause:** The wrapper workflow queries only `users` table (single bot), not `user_telegram_bots` table (multiple bots).

### Why This Happens
Current query:
```sql
SELECT u.telegram_bot_token FROM users u WHERE u.telegram_chat_id = 1256744399 LIMIT 1
```
→ Always returns `ExpenseBot_AntiGravity` token

Fixed query:
```sql
SELECT utb.bot_token FROM users u 
JOIN user_telegram_bots utb ON utb.user_id = u.id 
WHERE utb.bot_token = '{webhook_bot_token}'
```
→ Returns the specific bot that sent the message

---

## 🎯 IMPLEMENTATION PLAN

### What Needs to Change
**Single File:** `n8n/v18 Wrapper - Telegram Chat ID Fix V5 (Enhanced Debugging).json`
**Single Node:** "Lookup User Bot Token" (line 38)
**Single Change:** Update SQL query to JOIN with `user_telegram_bots` table

### Files That Stay UNCHANGED
- Dashboard workflow (receives correct data from wrapper)
- Web application code
- Database schema
- Environment variables
- Credentials

### Verification Steps (in order)
1. Check database has both bots ✓
2. Test current query (should show the bug) ✓
3. Test fixed query (should work correctly) ← **DO THIS FIRST**
4. Check webhook URLs have bot_token parameter ✓
5. Run final validation ✓
6. Update n8n workflow (only after SQL tests pass)
7. Live test both bots

---

## 🔧 TECHNICAL DETAILS

### Database Tables Involved
```sql
-- users table (stores ONE bot per user)
users.id, users.telegram_chat_id, users.telegram_bot_token

-- user_telegram_bots table (stores MULTIPLE bots per user) ← USE THIS
user_telegram_bots.user_id, user_telegram_bots.bot_token, user_telegram_bots.bot_username
```

### The Exact SQL Fix
**Current (BROKEN):**
```sql
SELECT u.id as user_id, u.telegram_bot_token, u.telegram_bot_username 
FROM users u 
WHERE u.telegram_chat_id = {{ $json.chat_id }}
   OR ('{{ $json.bot_token_from_webhook }}' != '' AND u.telegram_bot_token = '{{ $json.bot_token_from_webhook }}')
LIMIT 1
```

**Fixed:**
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

### User's Information (for testing)
- **Telegram Chat ID:** 1256744399 (from screenshot)
- **Email:** You'll need to query to find it
- **Bots:** 
  - ExpenseBot_AntiGravity
  - OnboardTest_Jakarta

---

## ⚠️ RISKS & MITIGATION

### Risk Level: MEDIUM-HIGH
**Worst case scenario:** Bot processing stops entirely

### Mitigation Strategies
1. **Test SQL first** (read-only, safe)
2. **Keep n8n editor open** (can revert node immediately)
3. **Full backups created** (can restore in < 30 seconds)
4. **Test with one bot first** before testing both

### Rollback Options (in order of speed)
1. **Fastest (5 seconds):** Revert node in n8n editor (keep original query in clipboard)
2. **Fast (30 seconds):** Re-import backup JSON file
3. **Medium (2 mins):** Git checkout tag
4. **Slow (5 mins):** Copy backup file and re-import

---

## ✅ SUCCESS CRITERIA

After fix is implemented:
1. ✅ Send `/start` to `OnboardTest_Jakarta` → Response appears in `OnboardTest_Jakarta` chat
2. ✅ Send message to `ExpenseBot_AntiGravity` → Response appears in `ExpenseBot_AntiGravity` chat
3. ✅ Both bots work simultaneously without interference
4. ✅ New user registration still works
5. ✅ Receipt processing works from both bots

---

## 📁 FILE LOCATIONS

### Project Root
`/Users/siewloongchan/Documents/AI Projects/Receipts Parsing/`

### Key Files
- `n8n/v18 Wrapper - Telegram Chat ID Fix V5 (Enhanced Debugging).json` ← MODIFY THIS
- `n8n/v18 Dashboard - Telegram Chat ID Fix - current.json` ← DO NOT MODIFY
- `n8n/MULTIBOT_FIX_VERIFICATION_GUIDE.md` ← FOLLOW THIS GUIDE
- `n8n/MULTIBOT_FIX_ASSESSMENT_20260206.md` ← REFERENCE

### Database
- Host: Check credentials in n8n
- Tables: `users`, `user_telegram_bots`

---

## 🚀 NEXT AGENT INSTRUCTIONS

**When you start the next session:**

1. **Read this file first** (SESSION_HANDOFF_MULTIBOT_FIX.md)
2. **Open MULTIBOT_FIX_VERIFICATION_GUIDE.md** 
3. **Start with STEP 1** (verify database state)
4. **Follow each step in order** - do not skip steps
5. **Report results after each step** to user
6. **Only proceed to STEP 6** (n8n workflow update) after SQL tests pass
7. **Keep n8n editor open** during live testing

**If anything goes wrong:**
- Immediate: Revert node in n8n editor
- If needed: Run `git checkout PRE_MULTIBOT_FIX_20260206_1105`

---

## 📝 NOTES FOR USER

**User Requirements:**
- ✅ Must support multiple bots per user
- ✅ Has pgAdmin access
- ✅ Wants step-by-step verification before implementing
- ✅ Safety-first approach (test query first, then implement)

**User's Bots:**
- ExpenseBot_AntiGravity (existing, working)
- OnboardTest_Jakarta (new, routing incorrectly)

**Current Issue:** All responses going to ExpenseBot_AntiGravity regardless of which bot received the message

---

## 🔗 RELATED COMMITS

- `ce7685eb` - docs: step-by-step verification guide for multi-bot fix
- `c05b0afd` - docs: multi-bot fix impact assessment and implementation plan
- `e3b0ed4d` - BACKUP: Pre-multi-bot fix - 20260206_1105

---

**Ready for next session?** 
Agent should open `MULTIBOT_FIX_VERIFICATION_GUIDE.md` and start with STEP 1.

**Questions?** 
Refer to MULTIBOT_FIX_ASSESSMENT_20260206.md for detailed technical background.
