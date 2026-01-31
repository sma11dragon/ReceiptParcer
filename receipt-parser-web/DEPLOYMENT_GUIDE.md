# ReceiptAI Deployment Guide

## 📋 Quick Reference

### Production Environment
- **Application URL**: https://receipts.daeit.com.sg
- **Host**: Synology NAS (`KolaNest`)
- **Location**: `/volume1/docker/ReceiptParcer`
- **Database**: PostgreSQL container (port 2665:5432)
- **Public Access**: Cloudflare Tunnel

### Critical Configuration
```bash
# DATABASE_URL for Synology NAS with host network
DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable"

# Network mode (required for Synology)
--network host

# Container restart policy
--restart unless-stopped
```

---

## 🚀 One-Click Deployment

### Standard Deployment
```bash
# On Synology NAS at /volume1/docker/ReceiptParcer
sudo ./deploy.sh
```

### Manual Deployment (if deploy.sh fails)
```bash
# Stop and remove existing container
sudo docker stop receipt-parser 2>/dev/null || true
sudo docker rm receipt-parser 2>/dev/null || true

# Run new container with correct configuration
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

---

## 🔧 Configuration Details

### Environment Variables
| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable` | PostgreSQL connection |
| `RESEND_API_KEY` | `re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w` | Email service API key |
| `EMAIL_FROM` | `onboarding@resend.dev` | Sender email address |
| `N8N_WEBHOOK_URL` | `https://n8ntest.daeit.com.sg/webhook/telegram-receipts` | n8n automation endpoint |
| `NODE_ENV` | `production` | Runtime environment |
| `HOST` | `0.0.0.0` | Bind to all network interfaces |

### Network Configuration
- **Mode**: `host` (required for Synology Docker compatibility)
- **Port**: 3000 (Next.js default)
- **Access**: Localhost + Cloudflare Tunnel

### Database Configuration
- **Container**: PostgreSQL with port mapping `2665:5432`
- **Credentials**: `root` / `112233_root`
- **Database**: `sma11dragon_DB`
- **SSL**: Disabled for local connections (`?sslmode=disable`)

---

## 🛠️ Maintenance Commands

### Container Management
```bash
# Check container status
sudo docker ps | grep receipt-parser

# View application logs
sudo docker logs receipt-parser
sudo docker logs receipt-parser --tail 50
sudo docker logs receipt-parser --follow

# Restart container
sudo docker restart receipt-parser

# Stop container
sudo docker stop receipt-parser

# Remove container
sudo docker rm receipt-parser

# View container details
sudo docker inspect receipt-parser
```

### Database Management
```bash
# Check PostgreSQL container
sudo docker ps | grep postgres

# Test database connection
# Method 1: Using /dev/tcp (works on Synology)
timeout 3 bash -c "cat < /dev/null > /dev/tcp/localhost/2665" && echo "Port open" || echo "Port closed"

# Method 2: From inside container
sudo docker exec receipt-parser sh -c "if command -v nc >/dev/null 2>&1; then nc -z -w 3 localhost 2665 && echo 'Connected' || echo 'Failed'; fi"
```

### Application Health Checks
```bash
# Test homepage
curl -I http://localhost:3000

# Test login API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check API response
curl http://localhost:3000/api/metrics
```

---

## 🚨 Troubleshooting

### Common Issues

#### Issue 1: Cloudflare Error 524 (Timeout)
**Symptoms**: Login fails, API times out, Cloudflare shows 524 error
**Root Cause**: Database connection failure
**Solution**:
```bash
# 1. Verify DATABASE_URL uses localhost:2665
echo $DATABASE_URL

# 2. Check PostgreSQL is running
sudo docker ps | grep postgres

# 3. Test port 2665
timeout 3 bash -c "cat < /dev/null > /dev/tcp/localhost/2665" && echo "OK" || echo "FAILED"

# 4. Fix container
sudo docker stop receipt-parser
sudo docker rm receipt-parser
# Run manual deployment command above
```

#### Issue 2: PostgreSQL SSL Error
**Symptoms**: "The server does not support SSL connections"
**Solution**: Add `?sslmode=disable` to DATABASE_URL

#### Issue 3: Container Won't Start
**Symptoms**: Container exits immediately
**Solution**:
```bash
# Check logs
sudo docker logs receipt-parser

# Common causes:
# 1. Port 3000 already in use
# 2. Missing environment variables
# 3. Database connection failure
```

#### Issue 4: Application Slow/Unresponsive
**Symptoms**: High response times, timeouts
**Solution**:
```bash
# Check resource usage
sudo docker stats receipt-parser

# Check application logs for errors
sudo docker logs receipt-parser --tail 100 | grep -i "error\|warn\|timeout"

# Restart container
sudo docker restart receipt-parser
```

### Diagnostic Scripts
```bash
# Run comprehensive diagnostics
./diagnose-nas.sh

# Quick fix for common issues
./fix-nas.sh

# Test database connectivity
./test-db-connection.sh

# Check container configuration
./check-container-config.sh
```

---

## 📊 Monitoring

### Key Metrics to Monitor
1. **Container Status**: `sudo docker ps | grep receipt-parser`
2. **Application Logs**: `sudo docker logs receipt-parser --tail 20`
3. **Database Connectivity**: Port 2665 accessibility
4. **API Response Time**: Login API performance
5. **Memory Usage**: Container resource consumption

### Health Check Endpoints
- `http://localhost:3000` - Homepage
- `http://localhost:3000/api/metrics` - Application metrics
- `http://localhost:3000/api/auth/login` - Authentication health

### Log Analysis
```bash
# Search for errors
sudo docker logs receipt-parser | grep -i "error"

# Search for database issues
sudo docker logs receipt-parser | grep -i "database\|postgres\|timeout"

# Monitor recent activity
sudo docker logs receipt-parser --tail 50 --follow
```

---

## 🔄 Update Procedures

### Code Updates
```bash
# 1. Pull latest code
sudo git pull origin main

# 2. Rebuild and deploy
sudo ./deploy.sh

# 3. Verify deployment
sudo docker ps | grep receipt-parser
curl -I http://localhost:3000
```

### Database Updates
```bash
# Run migrations
node run_migration.js

# Verify schema
node verify_schema.js
```

### Configuration Updates
```bash
# 1. Update environment variables in deploy.sh
vi deploy.sh

# 2. Redeploy
sudo ./deploy.sh
```

---

## 🗂️ File Structure Reference

### Key Files
```
/volume1/docker/ReceiptParcer/
├── deploy.sh              # Main deployment script
├── Dockerfile            # Container definition
├── .env.local           # Environment variables
├── package.json         # Node.js dependencies
├── app/                 # Next.js application
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── expenses/   # Expense management
│   │   └── bots/       # Telegram bot integration
│   └── dashboard/      # User dashboard
├── lib/                 # Shared utilities
│   ├── db.ts           # Database connection
│   └── email.ts        # Email service
└── tests/              # Test suite
```

### Scripts Directory
```
/volume1/docker/ReceiptParcer/
├── fix-nas.sh           # Interactive fix script
├── diagnose-nas.sh      # Diagnostic tool
├── test-access.sh       # Connectivity testing
├── fix-docker-permissions.sh # Permission fixes
├── test-db-connection.sh # Database testing
└── check-container-config.sh # Container inspection
```

---

## 📞 Emergency Contacts & Procedures

### Immediate Actions for Outages
1. **Check Container Status**: `sudo docker ps | grep receipt-parser`
2. **View Logs**: `sudo docker logs receipt-parser --tail 100`
3. **Test Database**: Check port 2665 connectivity
4. **Restart Container**: `sudo docker restart receipt-parser`
5. **Full Redeploy**: Run manual deployment command if needed

### Escalation Path
1. **Level 1**: Container restart
2. **Level 2**: Database connectivity check
3. **Level 3**: Full redeployment
4. **Level 4**: Infrastructure review (NAS, network, Cloudflare)

### Recovery Time Objectives
- **Minor Issues**: < 5 minutes (container restart)
- **Database Issues**: < 15 minutes (connectivity fixes)
- **Major Outages**: < 30 minutes (full redeployment)

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Database backup completed
- [ ] Code changes tested locally
- [ ] Environment variables updated
- [ ] Deployment window scheduled

### During Deployment
- [ ] Stop existing container
- [ ] Pull latest code
- [ ] Build Docker image
- [ ] Start new container
- [ ] Verify container status
- [ ] Test application health

### Post-Deployment
- [ ] Verify homepage loads
- [ ] Test login functionality
- [ ] Check API endpoints
- [ ] Monitor logs for errors
- [ ] Update deployment documentation

---

## 📈 Performance Benchmarks

### Expected Response Times
- **Homepage Load**: < 2 seconds
- **Login API**: < 1 second
- **Dashboard Load**: < 3 seconds
- **Database Queries**: < 500ms

### Resource Limits
- **Memory**: 512MB recommended
- **CPU**: 1 core minimum
- **Storage**: 1GB for application + logs
- **Network**: 100Mbps minimum

### Scaling Considerations
- Current setup supports 100+ concurrent users
- Database can handle 10,000+ expense records
- Image processing: 10+ concurrent receipts
- API rate limiting: 100 requests/minute per user

---

*Last Updated: January 27, 2026*
*Deployment Environment: Synology NAS (KolaNest)*
*Application Version: 0.1.0*
*Database: PostgreSQL 15+*