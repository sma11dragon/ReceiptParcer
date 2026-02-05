# ReceiptAI - AI-Powered Receipt Capture & Expense Management

A comprehensive expense management system featuring AI-powered receipt parsing, Telegram bot integration, and real-time expense tracking with a modern **Zen Glassmorphism** UI.

## 🏗️ System Architecture Overview

### Core Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │◄──►│   n8n Workflow  │◄──►│  Web Dashboard  │
│   (User Chat)   │    │  (Automation)   │    │  (Next.js App)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                         │
│                 (Central Data Store)                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 16.1.1 with React 19, TypeScript, Zen Glassmorphism UI
- **Backend**: Node.js API routes with PostgreSQL database
- **Automation**: n8n workflow automation platform
- **Deployment**: Docker containers on Synology NAS
- **Infrastructure**: Cloudflare Tunnel for secure public access

---

## 🚀 Production Deployment (Synology NAS)

### Current Production Setup
- **Location**: Synology NAS at `/volume1/docker/ReceiptParcer`
- **Network Mode**: Host network for Synology compatibility
- **Public Access**: Cloudflare Tunnel to `https://receipts.daeit.com.sg`
- **Database**: PostgreSQL container with port mapping `2665:5432`

### Environment Configuration
```bash
# Production .env.local configuration
DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB?sslmode=disable"
RESEND_API_KEY="re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w"
EMAIL_FROM="onboarding@resend.dev"
N8N_WEBHOOK_URL="https://n8ntest.daeit.com.sg/webhook/telegram-receipts"
NODE_ENV=production
HOST="0.0.0.0"
```

### Deployment Script (`deploy.sh`)
The deployment script automatically:
1. Detects Synology NAS environment
2. Uses host network mode for better compatibility
3. Sets correct DATABASE_URL for local PostgreSQL access
4. Builds and deploys the Docker container

**Key Configuration for Synology:**
- Uses `--network host` (required for Synology Docker compatibility)
- DATABASE_URL uses `localhost:2665` (not container IP)
- `?sslmode=disable` for local PostgreSQL connections

### Running Production Deployment
```bash
# On Synology NAS at /volume1/docker/ReceiptParcer
sudo ./deploy.sh
```

### Container Management
```bash
# Check running containers
sudo docker ps

# View application logs
sudo docker logs receipt-parser --tail 50

# Restart container
sudo docker restart receipt-parser

# Stop and remove container
sudo docker stop receipt-parser
sudo docker rm receipt-parser
```

---

## 🔄 Complete User Flow

### 1. User Registration & Authentication
```
User → Web Dashboard (/register) → PostgreSQL (users table)
     ↳ Creates account with email/password
     ↳ Receives verification email via Resend
     ↳ Can log in via email or Google OAuth
```

### 2. Telegram Bot Setup
```
User → Dashboard → "Connect Telegram Bot"
     ↳ Generates unique bot token
     ↳ Creates bot_username in PostgreSQL
     ↳ User adds bot to Telegram
     ↳ Bot becomes active for receipt processing
```

### 3. Receipt Processing Flow
```
1. User sends receipt photo to Telegram bot
2. Telegram → n8n webhook (https://n8ntest.daeit.com.sg/webhook/telegram-receipts)
3. n8n workflow processes image:
   - Extracts text using OCR
   - Parses vendor, date, amount, items
   - Categorizes expense
   - Sends data to Web API
4. Web API → PostgreSQL (expenses table)
5. Real-time sync to user's dashboard
```

### 4. Expense Management
```
User Dashboard Features:
- Real-time expense tracking
- Category breakdown charts
- Monthly spending analytics
- Export to CSV/PDF
- Receipt image storage
- Multi-currency support
```

### 5. Query & Reporting
```
Telegram Bot Commands:
- "/summary" - Get monthly expense summary
- "/category food" - Filter by category
- "/export" - Request CSV export
- "/help" - List available commands

Web Dashboard Features:
- Interactive charts (Recharts)
- Filter by date range, category, vendor
- Search functionality
- Bulk operations
```

---

## 🗄️ Database Schema

### Core Tables
```sql
-- Users table
users (id, username, email, password_hash, telegram_bot_username, created_at)

-- Telegram bots linked to users
user_telegram_bots (id, user_id, bot_token, bot_username, is_active)

-- Expense records
expenses (id, user_id, bot_id, expense_date, vendor, amount_sgd, 
          category, location, receipt_image_url, created_at)

-- Verification tokens
verification_tokens (id, user_id, token, type, expires_at)
```

### Key Relationships
- One user can have multiple Telegram bots
- Each expense is linked to a user and optionally a bot
- Verification tokens for email/telegram linking

---

## ⚙️ n8n Automation Workflow

### Webhook Endpoint
- **URL**: `https://n8ntest.daeit.com.sg/webhook/telegram-receipts`
- **Purpose**: Receives Telegram bot messages with receipt images
- **Processing**: OCR extraction, data parsing, API submission

### Workflow Steps
1. **Receive Telegram Webhook** - Capture image and metadata
2. **OCR Processing** - Extract text from receipt image
3. **Data Parsing** - Identify vendor, date, amount, items
4. **Category Detection** - AI-powered expense categorization
5. **API Submission** - Send parsed data to web application
6. **User Notification** - Confirm processing via Telegram

---

## 🔧 Development Setup

### Prerequisites
- Node.js 20+ & npm
- PostgreSQL 15+
- Docker & Docker Compose (for containerized deployment)

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your database credentials

# 3. Run development server
npm run dev

# 4. Run tests
npm test
npm run test:e2e  # End-to-end tests
```

### Docker Development
```bash
# Build and run with Docker
docker build -t receipt-parser .
docker run -p 3000:3000 -e DATABASE_URL="your-db-url" receipt-parser
```

---

## 🧪 Testing

### Test Types
```bash
# Unit tests
npm test

# API tests
npm run test:api

# OCR processing tests
npm run test:ocr

# Bot integration tests
npm run test:bot

# End-to-end tests (Playwright)
npm run test:e2e

# Test coverage report
npm run test:coverage
```

### Test Database
- Separate test database: `sma11dragon_DB_test`
- Automatic schema setup/teardown
- Test data fixtures included

---

## 📊 Monitoring & Maintenance

### Logging
- Application logs via Docker: `sudo docker logs receipt-parser`
- Database logs: PostgreSQL container logs
- n8n workflow execution logs

### Health Checks
```bash
# Application health
curl http://localhost:3000

# Database connectivity
nc -z localhost 2665

# Container status
sudo docker ps | grep receipt-parser
```

### Backup & Recovery
- PostgreSQL data volume persistence
- Regular database backups recommended
- Docker volume management for data persistence

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Database Connection Timeout (Cloudflare Error 524)
**Symptoms**: Login fails with timeout, API returns 524 error
**Solution**: 
```bash
# Ensure DATABASE_URL uses localhost:2665 (not external IP)
# Add ?sslmode=disable for local connections
# Use --network host for Synology deployment
```

#### 2. PostgreSQL SSL Connection Error
**Symptoms**: "The server does not support SSL connections"
**Solution**: Add `?sslmode=disable` to DATABASE_URL

#### 3. Container Network Issues on Synology
**Symptoms**: Container runs but can't connect to database
**Solution**: Use `--network host` instead of bridge network

#### 4. Port Conflicts
**Symptoms**: Application fails to start on port 3000
**Solution**: Check for other containers using port 3000

### Diagnostic Scripts
```bash
# Test database connectivity
./test-db-connection.sh

# Check container configuration
./check-container-config.sh

# Fix common issues
./fix-nas.sh
```

---

## 📈 Future Enhancements

### Planned Features
- Multi-language receipt support
- Advanced AI categorization
- Accounting software integrations (QuickBooks, Xero)
- Team/enterprise features
- Mobile app development
- Advanced reporting & analytics

### Performance Optimizations
- Database query optimization
- Image processing pipeline improvements
- Caching implementation
- CDN for static assets

---

## 📞 Support & Contact

### Production Support
- **Application URL**: https://receipts.daeit.com.sg
- **n8n Dashboard**: https://n8ntest.daeit.com.sg
- **Database Admin**: pgAdmin at port 2660

### Development Team
- Repository: https://github.com/sma11dragon/ReceiptParcer
- Issues: GitHub Issues tracker
- Deployment: Synology NAS at `/volume1/docker/ReceiptParcer`

### Emergency Procedures
1. Check container logs: `sudo docker logs receipt-parser --tail 100`
2. Verify database connectivity
3. Restart containers if needed
4. Check Cloudflare tunnel status

---

## 📋 Changelog

### Recent Fixes (January 2026)
- ✅ Fixed Cloudflare 524 timeout by correcting DATABASE_URL configuration
- ✅ Resolved PostgreSQL SSL connection issues with `?sslmode=disable`
- ✅ Updated deployment script for Synology NAS compatibility
- ✅ Improved error handling and logging
- ✅ Enhanced diagnostic scripts for troubleshooting

### Critical Issues Identified & Fixes Required

**⚠️ HIGH PRIORITY FIXES NEEDED:**

#### 1. **Logic Bug in `deploy.sh`** (Lines 29-41)
**Issue**: `$NETWORK_MODE` is checked before being set, causing wrong DATABASE_URL
**Current Code**:
```bash
if [ "$IS_SYNOLOGY" = true ] && [ "$NETWORK_MODE" = "host" ]; then
    # This condition is always false because NETWORK_MODE is set later at line 73
```
**Fix**:
```bash
# Move NETWORK_MODE assignment before DATABASE_URL logic
if [ "$IS_SYNOLOGY" = true ]; then
    NETWORK_MODE="host"
    PORT_MAPPING=""
else
    NETWORK_MODE="bridge"
    PORT_MAPPING="-p 3000:3000"
fi

# Now check NETWORK_MODE
if [ "$IS_SYNOLOGY" = true ] && [ "$NETWORK_MODE" = "host" ]; then
    DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB"
```

#### 2. **Hardcoded Container IPs**
**Issue**: Multiple files use hardcoded IP `172.19.0.2` which may not match actual deployments
**Files to fix**:
- `run_migration.js:7` - Change `host: '172.19.0.2'` to use environment variable
- `verify_schema.js:4` - Change `host: '172.19.0.2'` to use environment variable
- `deploy.sh:37` - Use consistent logic instead of hardcoded IP

**Fix Pattern**:
```javascript
// Instead of hardcoded IP (run_migration.js:7)
host: '172.19.0.2',

// Use environment variable
host: process.env.DB_HOST || 'localhost',
port: process.env.DB_PORT || 5432,
user: process.env.DB_USER || 'root',
password: process.env.DB_PASSWORD || '112233_root',
database: process.env.DB_NAME || 'sma11dragon_DB',

// Same fix needed for verify_schema.js:4
```

#### 3. **Security: Hardcoded Credentials**
**Issue**: Production credentials in committed files
**Files to secure**:
- `SECURE_CREDENTIALS_TEMPLATE.md` - Remove real credentials, keep as template only
- `deploy.sh:31,37` - Move credentials to environment variables
- `run_migration.js:10` - Use environment variables for passwords
- `verify_schema.js:7` - Use environment variables for passwords
- `tests/setup.ts:5,11` - Use test environment variables

**Fix Pattern**:
```bash
# Instead of hardcoded in deploy.sh
DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB"

# Use environment variable
DATABASE_URL="${DATABASE_URL:-postgresql://root:112233_root@localhost:2665/sma11dragon_DB}"
```

#### 4. **Inconsistent Database Connection Logic**
**Issue**: Different files use different connection methods
**Standardization Steps**:
1. Create `.env.local` with all database configuration
2. Update all scripts to read from environment variables
3. Use consistent fallback logic

**Example `.env.local`**:
```bash
DB_HOST=localhost
DB_PORT=2665
DB_NAME=sma11dragon_DB
DB_USER=root
DB_PASSWORD=112233_root
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable
```

#### 5. **Code Quality Issues**
**Linting Errors**: Fix `@typescript-eslint/no-explicit-any` violations
**Test Failures**: Separate Playwright tests from Jest tests, fix database connection in tests

### Step-by-Step Fix Implementation

**Phase 1: Immediate Security Fixes**
1. Remove real credentials from `SECURE_CREDENTIALS_TEMPLATE.md`
2. Create `.env.local` with placeholders only
3. Update `.gitignore` to exclude `.env.local`

**Phase 2: Logic Bug Fix**
1. Fix `deploy.sh` NETWORK_MODE logic bug
2. Test deployment on Synology NAS

**Phase 3: Standardization**
1. Update all scripts to use environment variables
2. Fix hardcoded IPs in migration and verification scripts:
   - `run_migration.js:7-11` - Replace hardcoded values with environment variables
   - `verify_schema.js:4-8` - Replace hardcoded values with environment variables
3. Update test setup to use test environment

**Phase 4: Code Quality**
1. Fix TypeScript linting errors
2. Separate test configurations
3. Run full test suite to verify fixes

### Verification Checklist
- [ ] `deploy.sh` logic bug fixed (NETWORK_MODE check works correctly)
- [ ] No hardcoded credentials in committed files
- [ ] All scripts use environment variables
- [ ] `.env.local` added to `.gitignore`
- [ ] Linting passes without errors
- [ ] Tests pass with proper database connections
- [ ] Migration scripts work with environment variables
- [ ] `run_migration.js` uses environment variables instead of hardcoded IP
- [ ] `verify_schema.js` uses environment variables instead of hardcoded IP

### UI/UX Improvements
- 🎨 Zen Glassmorphism design system
- 📱 Mobile-responsive dashboard
- 📊 Enhanced data visualization
- 🔐 Improved authentication flows
# Test
<!-- Deployment timestamp: 2026-02-06 -->
