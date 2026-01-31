# 🔐 ReceiptAI Production Credentials

**⚠️ SECURE DOCUMENT - DO NOT COMMIT TO GIT ⚠️**

Share this via password manager or encrypted message only.

---

## 🖥️ NAS Access

### SSH Access
```
Host: 100.90.68.68 (or KolaNest.local)
Username: [YOUR_USERNAME]
Password: [YOUR_PASSWORD]
Port: 22
```

### Directory
```
/volume1/docker/ReceiptParcer/
```

### SSH Key (Alternative)
```bash
# If using SSH keys, share the private key securely
-----BEGIN OPENSSH PRIVATE KEY-----
[YOUR_PRIVATE_KEY_HERE]
-----END OPENSSH PRIVATE KEY-----
```

---

## 🗄️ Database

### Production Database
```
Host: localhost:2665 (from NAS) or 100.90.68.68:2665 (external)
Database: sma11dragon_DB
Username: root
Password: 112233_root
URL: postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable
```

### Local Development Database
```
Host: localhost:5432
Database: sma11dragon_DB  
Username: root
Password: 112233_root
URL: postgresql://root:112233_root@localhost:5432/sma11dragon_DB
```

### pgAdmin Access (Database GUI)
```
URL: http://100.90.68.68:2660
Email: [YOUR_EMAIL]
Password: [YOUR_PASSWORD]
```

---

## 📧 Email Service (Resend)

### API Key
```
RESEND_API_KEY: re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w
```

### Sender Email
```
EMAIL_FROM: onboarding@resend.dev
```

---

## 🤖 Automation (n8n)

### Webhook URL
```
N8N_WEBHOOK_URL: https://n8ntest.daeit.com.sg/webhook/telegram-receipts
```

### n8n Dashboard Access
```
URL: https://n8ntest.daeit.com.sg
Username: [YOUR_USERNAME]
Password: [YOUR_PASSWORD]
```

---

## 🌐 Domain & DNS

### Primary Domain
```
https://receipts.daeit.com.sg
```

### Cloudflare Tunnel
- **Tunnel name**: receipt-tunnel
- **Configuration**: Maps receipts.daeit.com.sg → localhost:3000
- **Management**: Cloudflare Dashboard access needed for changes

### Cloudflare Access (if applicable)
```
Email: [YOUR_CLOUDFLARE_EMAIL]
Password: [YOUR_CLOUDFLARE_PASSWORD]
2FA: [SHARE_2FA_BACKUP_CODES]
```

---

## 🐳 Docker & Container Management

### Running Containers
```bash
# List all containers
sudo docker ps

# ReceiptAI app container
Container: receipt-parser
Port: 3000
Network: host

# PostgreSQL container  
Container: postgres (or PostgreSQL)
Port: 2665:5432 (external:internal)

# n8n container
Container: n8n
Port: 5678

# Cloudflare Tunnel
Container: receipt-tunnel
```

### Common Commands
```bash
# View logs
sudo docker logs receipt-parser --tail 50
sudo docker logs receipt-parser --follow

# Restart services
sudo docker restart receipt-parser
sudo docker restart postgres

# Stop everything
sudo docker stop receipt-parser postgres n8n receipt-tunnel

# Start everything
sudo docker start postgres receipt-parser n8n receipt-tunnel
```

---

## 🔑 Environment Variables (Production)

### Full Set
```bash
DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable"
RESEND_API_KEY="re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w"
EMAIL_FROM="onboarding@resend.dev"
N8N_WEBHOOK_URL="https://n8ntest.daeit.com.sg/webhook/telegram-receipts"
NODE_ENV="production"
HOST="0.0.0.0"
```

---

## 📱 Telegram Bot

### Bot Token
```
[TELEGRAM_BOT_TOKEN_HERE]
```

### Webhook Configuration
```
URL: https://n8ntest.daeit.com.sg/webhook/telegram-receipts
Method: POST
```

### Bot Username
```
@[YOUR_BOT_USERNAME]
```

---

## 🛡️ Security Notes

### Access Levels
- **Developer**: SSH + Docker commands
- **Database**: Read/Write to sma11dragon_DB
- **n8n**: Workflow view/edit access
- **Cloudflare**: DNS management only

### Emergency Contacts
```
Primary: [YOUR_NAME] - [YOUR_PHONE]
Secondary: [BACKUP_NAME] - [BACKUP_PHONE]
```

### Recovery Procedures
1. **Database down**: Restart PostgreSQL container
2. **App down**: Run `sudo ./deploy.sh`
3. **NAS offline**: Check power/network
4. **Domain not resolving**: Check Cloudflare Tunnel

---

## 📋 First-Time Setup Verification

### For New Developer
1. **SSH access working?**
   ```bash
   ssh [USERNAME]@100.90.68.68
   cd /volume1/docker/ReceiptParcer
   ls -la
   ```

2. **Docker commands working?**
   ```bash
   sudo docker ps
   sudo docker logs receipt-parser --tail 5
   ```

3. **Can deploy changes?**
   ```bash
   sudo git pull origin main
   sudo ./deploy.sh
   ```

4. **Verify site is up**
   ```bash
   curl http://localhost:3000
   # Should return HTML
   ```

---

## 🔄 Credential Rotation Schedule

### Regular Rotation
- **Database password**: Every 90 days
- **SSH passwords**: Every 180 days  
- **API keys**: As needed (some can't be rotated easily)

### When Developer Leaves
1. Revoke SSH access
2. Change database password
3. Rotate API keys if possible
4. Update this document

---

## 📞 Support Information

### Immediate Issues
```
Contact: [YOUR_NAME]
Phone: [YOUR_PHONE]
Signal/WhatsApp: [YOUR_NUMBER]
Email: [YOUR_EMAIL]
```

### Non-urgent Issues
- Create GitHub issue
- Message on Slack/Teams
- Email with "[ReceiptAI]" prefix

### Maintenance Windows
```
Regular: Sundays 2-4 AM UTC
Emergency: Anytime with notice
```

---

**⚠️ REMEMBER:**
- Never commit credentials to git
- Use environment variables
- Share this document securely
- Report any security concerns immediately

---
*Document version: 1.0*  
*Last updated: [DATE]*  
*For authorized personnel only*