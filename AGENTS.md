# AGENTS.md

Guidelines for agentic coding agents working in the ReceiptAI codebase.

## Build Commands

```bash
# Development (from receipt-parser-web/)
cd receipt-parser-web
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npx tsc --noEmit         # Type checking

# Testing
npm test                 # Run all tests
npm test -- tests/api/auth.test.ts    # Single test file
npm test -- --testNamePattern="Happy Path"  # Tests matching pattern
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:api         # API tests only
npm run test:ocr         # OCR tests only
npm run test:bot         # Bot tests only
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode

# Reporting
npm run report:daily     # Daily report generation
npm run report:weekly    # Weekly report generation
npm run report:analyze   # Query log analysis

# Database (from project root)
node run_migration.js    # Run migrations
node diagnose_db.js      # Diagnose issues
node verify_db.js        # Verify schema
node receipt-parser-web/check_users.js  # Check user records
```

## Code Style

### Imports
- External imports first, then internal imports
- Use `@/*` path aliases for internal imports (e.g., `@/lib/db`, `@/context/LanguageContext`)
- Group React imports separately
- Use named imports for utilities: `import { Pool } from 'pg';`

### TypeScript
- Strict mode enabled with proper type annotations
- Use `NextRequest` and `NextResponse` for API routes
- Use `Readonly<>` for React component props
- Export reusable types: `export type Language = 'en' | 'zh';`
- Define interfaces for API request/response bodies

### Database Queries
- Always use parameterized queries: `pool.query(sql, [param1, param2])`
- Never interpolate user input directly into SQL strings
- Use `async/await` with try/catch error handling
- Validate sortBy against allowlists to prevent SQL injection
- Use parameter indexing: `let paramIdx = 2;` then `WHERE col = $${paramIdx++}`
- Use connection pooling via `pg.Pool`
- Release connections in `finally` blocks if using `pool.connect()`

### API Routes
- Extract search params: `const { searchParams } = new URL(request.url);`
- Validate required parameters early with 400 status codes
- Return consistent JSON: `{ success: boolean, data?: any, error?: string }`
- Use appropriate HTTP status codes: 400, 401, 500
- Log errors with context: `console.error('Action Error:', error);`

### React Components
- Use `'use client';` directive for client-side components
- Define custom hooks with `use` prefix: `useLanguage()`, `useMobile()`
- Use React Context for global state (e.g., `LanguageContext`)
- Persist user preferences to localStorage
- Handle context undefined state with proper error messages

### Naming Conventions
- **Files**: kebab-case for utilities (`lib/db.ts`), PascalCase for components (`components/LanguageSwitcher.tsx`)
- **Functions**: camelCase with descriptive names (`handleSetLanguage`, `validateUserInput`)
- **Variables**: camelCase with meaningful names (`paramIdx`, `allowedSortCols`)
- **Constants**: UPPER_SNAKE_CASE for configuration values
- **Database columns**: snake_case (following PostgreSQL conventions)

### Error Handling
- Wrap database operations in try/catch blocks
- Return generic error messages to clients (avoid exposing internal details)
- Log detailed errors for debugging
- Validate inputs before processing
- Never expose password hashes in API responses

### Security
- Use bcryptjs for password hashing and verification
- Implement proper SQL injection prevention
- Validate and sanitize all user inputs
- Use environment variables for sensitive configuration

### Performance
- Use database indexes on frequently queried columns
- Implement pagination with LIMIT/OFFSET parameters
- Use LEFT JOINs sparingly
- Optimize queries with proper WHERE clauses

## Code Organization

- **API routes**: `app/api/[resource]/route.ts` pattern
- **Shared utilities**: `lib/` directory
- **Components**: `components/` directory
- **Context providers**: `context/` directory
- **Database schema**: `db/` directory with migration files
- **Tests**: `tests/` directory with subdirectories by type (api, ocr, bot, e2e)

## Testing Patterns

- Use Jest with ts-jest preset (configured in package.json)
- Test files: `*.test.ts` or `*.spec.ts`
- Use Supertest for API endpoint testing
- Database tests use separate test database with fixtures
- Follow test naming: "Happy Path", "Fix Path", "Edge Path"
- Use beforeEach/afterEach for test isolation
- Mock external services (email, webhooks) in tests

## Environment Variables

Required in `receipt-parser-web/.env.local`:
```
DATABASE_URL=postgresql://user:password@host:port/database
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@receiptai.com
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/receipt
NODE_ENV=development
```

## Multi-Language Support

- Translations stored in `lib/translations.ts` with nested structure
- Use `useLanguage()` hook to access current language translations
- Language state persisted to localStorage
- Support for 'en' and 'zh' languages with TypeScript safety

## Project Structure

- **Root**: Database scripts, n8n workflows, documentation
- **receipt-parser-web/**: Next.js web application
- **skills/**: n8n MCP skills and documentation
- **n8n/**: Workflow JSON exports
- **db/**: Database schema and CSV data

## Configuration Files

- **ESLint**: `receipt-parser-web/eslint.config.mjs` (uses eslint-config-next)
- **TypeScript**: `receipt-parser-web/tsconfig.json` (strict mode, `@/*` paths)
- **Jest**: Configured in `package.json` with ts-jest preset

## Current Working Configuration (Feb 3, 2026) ✅

### ✅ Backblaze B2 Storage - FULLY WORKING
**Status:** Receipt images uploading successfully to B2  
**Implementation:** February 3, 2026 at ~06:30 UTC  
**Migration From:** Cloudflare R2 (broken since Feb 1)  
**Storage:** Backblaze B2 (10GB free tier)

### ⚠️ Telegram Bot Onboarding Issue - PENDING FIX
**Status:** New users cannot onboard via `/start` command  
**Problem:** Registration creates `bot_token` but NOT `verification_token`  
**Impact:** New users get "Invalid token" error  
**Solution:** Auto-link fallback branch (planned for Feb 4, 2026)  
**Risk:** LOW - Safe fallback approach with easy rollback  
**Documentation:** See `SESSION_NOTES_20260203.md` for complete plan

### Why We Switched to B2
- ❌ **Cloudflare R2:** SSL handshake failure with Vercel (unfixable from our side)
- ✅ **Backblaze B2:** AWS S3-compatible API, no SSL issues, generous free tier

### Working Configuration Backup
**File:** `B2_WORKING_BACKUP_20260203.md` - Complete B2 working state  
**Git Commit:** `50616d51` - B2 implementation working  
**Previous R2 Backup:** `R2_WORKING_BACKUP_20260202.md` - For historical reference

### Current Environment Variables (receipt-parcer)

```env
# Backblaze B2 (PRIMARY - Working)
B2_KEY_ID=005a1119bde3d4e0000000001
B2_APPLICATION_KEY=K005yuYkg7Tn9EYV2eAKAe0cEF3j7p0
B2_BUCKET_NAME=receiptai-images
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_PUBLIC_URL=https://s3.us-east-005.backblazeb2.com/receiptai-images
B2_REGION=us-east-005

# Cloudflare R2 (LEGACY - Keep for old receipts)
R2_PUBLIC_URL=https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev/receiptai-images
R2_BUCKET_NAME=receiptai-images
R2_ENDPOINT=https://e21ca487c714259a0c1d0ff82c8e8ff6f.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=01a434e4cb02672e8a7d3dd39735bc79
R2_SECRET_ACCESS_KEY=[HIDDEN]
```

### n8n Working Configuration

**"HTTP Request to Vercel" Node:**
- Method: POST
- URL: `https://receipt-parcer.vercel.app/api/upload-receipt?userId={{ $json.user_id }}&filename={{ $json.dynamic_filename }}`
- Body: n8n Binary File (field: data)

**"Combine OCR and R2 Data" Node (Working B2 Code):**
```javascript
const B2_PUBLIC_URL = 'https://s3.us-east-005.backblazeb2.com/receiptai-images';
const fileKey = `receipts/${userId}/${filename}`;
const b2Url = `${B2_PUBLIC_URL}/${fileKey}`;
// storage_provider: 'backblaze-b2'
```

### Public URL Format (Working)
**New Receipts (B2):**
```
https://s3.us-east-005.backblazeb2.com/receiptai-images/receipts/{userId}/{filename}.jpg
```

**Old Receipts (R2 - Read Only):**
```
https://pub-18f1f7c4601c489e84019b50d64917cd.r2.dev/receiptai-images/receipts/{userId}/{filename}.jpg
```

### To Restore Working B2 State
1. See `B2_WORKING_BACKUP_20260203.md` for complete restoration steps
2. Verify B2 environment variables are set correctly
3. Update n8n "Combine OCR and R2 Data" node with B2_PUBLIC_URL
4. Or run: `git checkout 50616d51` to revert to B2 working state

### Migration Summary
- ✅ New uploads go to Backblaze B2
- ✅ Old receipts (pre-Feb 3) remain in R2 (accessible)
- ✅ No data migration needed
- ✅ Both storage systems coexist
- ✅ 10GB free storage on B2

## Backup Procedures

### Before Making Changes to n8n Workflows

Always create backups before modifying critical workflows:

**Step 1: Export from n8n Editor**
1. Go to **n8n Editor** → **Workflows**
2. For each workflow being modified:
   - Click **"..."** → **"Download"**
   - Save with format: `WORKFLOW_NAME_BACKUP_YYYYMMDD_HHMM.json`

**Step 2: Copy to Project Directory**
```bash
cd /Users/siewloongchan/Documents/AI Projects/Receipts Parsing
cp "n8n/Original Workflow.json" "n8n/BACKUP_Original_Workflow_YYYYMMDD_HHMM.json"
```

**Step 3: Commit to Git**
```bash
git add n8n/*BACKUP*.json
git commit -m "BACKUP: Pre-change workflow versions for [DESCRIPTION]"
git push
```

**Step 4: Create Git Tag (Optional but Recommended)**
```bash
git tag -a PRE_[CHANGE_NAME]_BACKUP -m "Backup before implementing [CHANGE_NAME]"
git push origin PRE_[CHANGE_NAME]_BACKUP
```

### Restoring from Backup

**Option 1: n8n Version History (Fastest)**
1. Go to **n8n Editor** → **Workflows** → Select workflow
2. Click **"Version History"** (top right)
3. Find version before changes (by timestamp)
4. Click **"Restore"**

**Option 2: Import JSON File**
1. Go to **n8n Editor** → **Workflows** → **"Import from File"**
2. Select backup JSON file
3. Note: Creates NEW workflow - update webhook URL if needed

**Option 3: Git Revert**
```bash
git checkout [COMMIT_HASH] -- n8n/workflow-file.json
# Re-import into n8n
```

### Current Backups

**Pre-Auto-Link Backup (Feb 4, 2026)**
- Files: `V5_WRAPPER_BACKUP_20260204_0000.json`, `V5_DASHBOARD_BACKUP_20260204_0000.json`
- Commit: Will be created with this backup
- Purpose: Before implementing Telegram auto-link feature
- See: `SESSION_NOTES_20260203.md` for implementation plan

## Troubleshooting

### R2 Upload SSL Errors
If you see `SSL routines:ssl3_read_bytes:ssl/tls alert handshake failure`:

1. **Check R2 credentials first** - Most common cause is invalid/expired API keys
   - Go to Cloudflare R2 → Manage API Tokens
   - Verify tokens have "Object Read & Write" permissions
   - Check Vercel env vars match exactly

2. **See full guide**: `R2_TROUBLESHOOTING.md`

3. **Quick test**: Temporarily skip R2 upload in route.ts to isolate if it's n8n→Vercel or Vercel→R2 issue

4. **Restoration**: Use backup configuration from `R2_WORKING_BACKUP_20260202.md`
