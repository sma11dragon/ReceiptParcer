# 🚨 IMMEDIATE ACTION CHECKLIST
## n8n Workflow Authentication Update

**Status:** ⚠️ **URGENT** - n8n workflows are currently broken
**Time estimate:** 30-60 minutes
**Priority:** 🔴 **HIGHEST**

---

## 📋 BEFORE YOU START

### What you need:
- [ ] Database client (pgAdmin/DBeaver) installed
- [ ] Access to PostgreSQL database on NAS
- [ ] n8n instance accessible
- [ ] Vercel dashboard access

### Files provided:
- ✅ `STEP_BY_STEP_GUIDE.md` - Complete instructions
- ✅ `create-service-account.sql` - SQL commands
- ✅ `generate-n8n-token.js` - Token generator
- ✅ `quick-test.sh` - API tester
- ✅ `N8N_WORKFLOW_UPDATE_GUIDE.md` - n8n specific guide

---

## 🎯 QUICK START (15 minutes)

### 1. Create Service Account (5 min)
```sql
-- Run in your database client:
INSERT INTO users (username, email, password_hash, is_verified, location)
VALUES (
  'n8n-service',
  'n8n-service@receiptai.com',
  '$2b$12$TnOovoDSIoHVP4KsKge4LeGdhSOUlkY0yZhpl.Odk8DRLbnELaZbi',
  true,
  'Automation'
) RETURNING id;
```

**📝 Note returned ID:** ______

### 2. Generate Token (2 min)
```bash
cd "/Users/siewloongchan/Documents/AI Projects/Receipts Parsing"
JWT_SECRET="your-secret-from-vercel" node generate-n8n-token.js YOUR_ID
```

**📝 Copy token:** ______

### 3. Test Token (1 min)
```bash
./quick-test.sh "YOUR_TOKEN"
```

**Expected:** 400 error (not 401)

### 4. Update One n8n Workflow (7 min)
1. Open n8n
2. Find HTTP Request node to API
3. Add header: `Authorization: Bearer YOUR_TOKEN`
4. Test workflow

---

## ⏰ TIMELINE

### Phase 1: Emergency Fix (Now - 30 min)
- [ ] Create service account in database
- [ ] Generate JWT token
- [ ] Update ONE n8n workflow
- [ ] Test it works

### Phase 2: Complete Update (+30 min)
- [ ] Update ALL n8n workflows
- [ ] Test all workflows
- [ ] Monitor Vercel logs

### Phase 3: Verification (+1 hour)
- [ ] Send test receipt
- [ ] Verify processing works
- [ ] Check database updates

---

## 🆘 TROUBLESHOOTING QUICK FIXES

### If 401 Unauthorized:
```bash
# Regenerate token
JWT_SECRET="correct-secret" node generate-n8n-token.js USER_ID

# Test again
./quick-test.sh "new-token"
```

### If database error:
1. Check PostgreSQL is running on NAS
2. Verify connection string
3. Check user exists: `SELECT * FROM users WHERE email='n8n-service@receiptai.com';`

### If n8n still fails:
1. Check "Bearer " prefix in header
2. Verify token not expired
3. Test with curl to isolate issue

---

## 📞 URGENT SUPPORT

### If stuck at any step:
1. **Database issue**: Check NAS PostgreSQL service
2. **Token issue**: Verify JWT_SECRET in Vercel matches
3. **n8n issue**: Test with curl first

### Test commands:
```bash
# Test API without auth (should fail)
curl https://receipt-parcer.vercel.app/api/upload-receipt

# Test with auth (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://receipt-parcer.vercel.app/api/upload-receipt?userId=1&filename=test.jpg
```

---

## ✅ SUCCESS CRITERIA

- [ ] `./quick-test.sh` returns 400 (not 401)
- [ ] n8n workflow executes without 401 errors
- [ ] Receipts process normally
- [ ] Vercel logs show no auth failures

---

## 🚀 READY TO START?

**Time required:** 30 minutes
**Risk:** Medium (reversible if issues)
**Impact:** Critical (workflows broken until fixed)

**Proceed to:** `STEP_BY_STEP_GUIDE.md` for detailed instructions