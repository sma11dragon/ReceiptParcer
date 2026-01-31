# ReceiptAI Troubleshooting Guide

## 🚨 Quick Diagnosis Flow

```
Start Here
    ↓
Is container running? → No → Start container
    ↓ Yes
Can access homepage? → No → Check port 3000
    ↓ Yes
Login works? → No → Database issue
    ↓ Yes
System OK
```

---

## 🔍 Common Error Messages & Solutions

### Error 1: Cloudflare 524 Timeout
**Symptoms**: 
- Login page hangs then shows Cloudflare 524 error
- API calls timeout
- Database connection failure

**Root Cause**: 
- DATABASE_URL pointing to wrong IP (`100.90.68.68` instead of `localhost`)
- PostgreSQL not accessible from container

**Immediate Fix**:
```bash
# Stop and redeploy with correct DATABASE_URL
sudo docker stop receipt-parser
sudo docker rm receipt-parser
sudo docker run -d \
  --name receipt-parser \
  --network host \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable" \
  -e RESEND_API_KEY="re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w" \
  -e EMAIL_FROM="onboarding@resend.dev" \
  -e N8N_WEBHOOK_URL="https://n8ntest.daeit.com.sg/webhook/telegram-receipts" \
  -e NODE_ENV=production \
  -e HOST="0.0.0.0" \
  receipt-parser
```

### Error 2: "The server does not support SSL connections"
**Symptoms**:
- Login fails with SSL error in logs
- Database connection established but SSL rejected

**Root Cause**:
- PostgreSQL configured without SSL
- Application trying to use SSL for local connection

**Fix**:
Add `?sslmode=disable` to DATABASE_URL:
```bash
# Wrong: postgresql://root:112233_root@localhost:2665/sma11dragon_DB
# Correct: postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable
```

### Error 3: "Invalid email or password" (HTTP 401)
**Symptoms**:
- Login API returns 401
- Database connection works but user not found

**Root Cause**:
- Test credentials don't exist in database
- User account not created

**Fix**:
1. Use actual user credentials from database
2. Register new user at `/register`
3. Check users table: `SELECT * FROM users;`

### Error 4: Container Exits Immediately
**Symptoms**:
- `docker ps` shows no receipt-parser container
- Container starts then stops

**Root Cause**:
- Missing environment variables
- Port 3000 already in use
- Application crash on startup

**Diagnosis**:
```bash
# Check exit code
sudo docker ps -a | grep receipt-parser

# View logs from stopped container
sudo docker logs receipt-parser

# Check port usage
sudo netstat -tlnp | grep :3000
```

### Error 5: "Permission denied" for Docker
**Symptoms**:
- `docker ps` returns permission error
- Need sudo for all docker commands

**Root Cause**:
- User not in docker group on Synology

**Fix**:
```bash
# Use sudo for docker commands
sudo docker ps

# Or add user to docker group (if supported on Synology)
sudo usermod -aG docker $(whoami)
# Log out and back in
```

---

## 🛠️ Diagnostic Commands

### Quick Health Check
```bash
# 1. Container status
sudo docker ps | grep receipt-parser

# 2. Application logs
sudo docker logs receipt-parser --tail 20

# 3. Database connectivity
timeout 3 bash -c "cat < /dev/null > /dev/tcp/localhost/2665" && echo "✓ Port 2665 open" || echo "✗ Port 2665 closed"

# 4. Application response
curl -I http://localhost:3000

# 5. API test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Database Diagnostics
```bash
# Check PostgreSQL container
sudo docker ps | grep postgres

# Test database from inside container
sudo docker exec receipt-parser sh -c "
if command -v node >/dev/null 2>&1; then
    node -e \"
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
pool.query('SELECT 1 as test')
    .then(() => console.log('Database OK'))
    .catch(err => console.log('Database error:', err.message))
    .finally(() => pool.end());
\" 2>&1
fi
"
```

### Network Diagnostics
```bash
# Check host network
ip addr show

# Test localhost connectivity
ping -c 3 localhost

# Check firewall (if applicable)
sudo iptables -L -n | grep 3000
sudo iptables -L -n | grep 2665
```

---

## 📊 Log Analysis Guide

### Common Log Patterns

#### Pattern 1: Database Connection Success
```
▲ Next.js 16.1.1
- Local:         http://localhost:3000
- Network:       http://192.168.4.32:3000
✓ Starting...
✓ Ready in 4.1s
```

#### Pattern 2: Database Connection Failure
```
Login Error: Error: connect ETIMEDOUT 100.90.68.68:2665
    at <unknown> (Error: connect ETIMEDOUT 100.90.68.68:2665)
```

#### Pattern 3: SSL Error
```
Login Error: Error: The server does not support SSL connections
```

#### Pattern 4: Application Error
```
Error: Some application error
    at someFunction (file.js:123:45)
```

### Log Search Commands
```bash
# Search for errors
sudo docker logs receipt-parser | grep -i "error"

# Search for database issues
sudo docker logs receipt-parser | grep -i "database\|postgres\|timeout\|connection"

# Search for startup issues
sudo docker logs receipt-parser | head -50

# Monitor logs in real-time
sudo docker logs receipt-parser --follow
```

---

## 🔄 Recovery Procedures

### Scenario 1: Complete System Failure
**Symptoms**: Nothing works, website down
**Recovery Steps**:
```bash
# 1. Stop everything
sudo docker stop receipt-parser 2>/dev/null || true
sudo docker rm receipt-parser 2>/dev/null || true

# 2. Check PostgreSQL
sudo docker ps | grep postgres
# If PostgreSQL not running, start it first

# 3. Manual deployment
sudo docker run -d \
  --name receipt-parser \
  --network host \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable" \
  -e RESEND_API_KEY="re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w" \
  -e EMAIL_FROM="onboarding@resend.dev" \
  -e N8N_WEBHOOK_URL="https://n8ntest.daeit.com.sg/webhook/telegram-receipts" \
  -e NODE_ENV=production \
  -e HOST="0.0.0.0" \
  receipt-parser

# 4. Verify
sleep 5
curl -I http://localhost:3000
```

### Scenario 2: Database Issues Only
**Symptoms**: Website loads but login fails
**Recovery Steps**:
```bash
# 1. Test database connectivity
timeout 3 bash -c "cat < /dev/null > /dev/tcp/localhost/2665" || echo "Database down"

# 2. Check PostgreSQL container
sudo docker ps | grep postgres
sudo docker logs postgres_container_name --tail 20

# 3. Restart PostgreSQL if needed
sudo docker restart postgres_container_name

# 4. Update DATABASE_URL if wrong
# Check current DATABASE_URL in container
sudo docker inspect receipt-parser --format='{{range .Config.Env}}{{println .}}{{end}}' | grep DATABASE_URL
```

### Scenario 3: Application Issues Only
**Symptoms**: Database works, application misbehaves
**Recovery Steps**:
```bash
# 1. Restart application container
sudo docker restart receipt-parser

# 2. Check logs after restart
sudo docker logs receipt-parser --tail 30

# 3. If still failing, redeploy
sudo ./deploy.sh
```

---

## 🧪 Test Procedures

### Smoke Test (After Deployment)
```bash
#!/bin/bash
echo "=== ReceiptAI Smoke Test ==="

# Test 1: Container running
echo "1. Container status:"
sudo docker ps | grep receipt-parser && echo "✓ Running" || echo "✗ Not running"

# Test 2: Port 3000 responding
echo "2. Application response:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo "✓ Responding" || echo "✗ Not responding"

# Test 3: Database connectivity
echo "3. Database port:"
timeout 3 bash -c "cat < /dev/null > /dev/tcp/localhost/2665" 2>/dev/null && echo "✓ Port 2665 open" || echo "✗ Port 2665 closed"

# Test 4: Login API
echo "4. Login API:"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -w " HTTP %{http_code}" \
  -o /dev/null

echo ""
echo "=== Test Complete ==="
```

### Integration Test
```bash
# Test complete user flow
# 1. Register user
# 2. Login
# 3. Create Telegram bot
# 4. Send test receipt via Telegram
# 5. Verify receipt appears in dashboard
```

---

## 📞 Support Reference

### Key Configuration Values
```bash
# DATABASE_URL (Production)
postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable

# Network configuration
--network host
--restart unless-stopped

# Container name
receipt-parser

# Ports
Application: 3000
PostgreSQL: 2665 (external) -> 5432 (internal)
```

### Container Information
```bash
# Get container details
sudo docker inspect receipt-parser

# Get environment variables
sudo docker exec receipt-parser printenv

# Get resource usage
sudo docker stats receipt-parser
```

### Database Information
```bash
# PostgreSQL container name (adjust as needed)
PostgreSQL

# Credentials
Username: root
Password: 112233_root
Database: sma11dragon_DB
Port: 2665 (external), 5432 (internal)
```

---

## 🎯 Quick Fix Reference

### Most Common Fix: Wrong DATABASE_URL
```bash
# STOP using:
DATABASE_URL="postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB"

# START using:
DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable"
```

### Network Fix for Synology
```bash
# Add to docker run command:
--network host
```

### Permission Fix
```bash
# Use sudo for all docker commands
sudo docker ps
sudo docker logs receipt-parser
sudo ./deploy.sh
```

---

## 📋 Maintenance Checklist

### Daily
- [ ] Check container status: `sudo docker ps | grep receipt-parser`
- [ ] Check error logs: `sudo docker logs receipt-parser | grep -i error | tail -5`
- [ ] Verify website loads: https://receipts.daeit.com.sg

### Weekly
- [ ] Check disk space on NAS
- [ ] Review application logs for patterns
- [ ] Test backup procedures
- [ ] Update deployment scripts if needed

### Monthly
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Performance analysis
- [ ] Database optimization

---

*Last Updated: January 27, 2026*
*Based on production deployment on Synology NAS*