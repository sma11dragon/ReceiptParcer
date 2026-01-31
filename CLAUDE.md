# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReceiptAI is an AI-powered receipt parsing and expense tracking system that integrates Telegram bots with a Next.js web dashboard. Users submit receipt photos via Telegram, which are processed by n8n workflows using AI parsing, then stored in PostgreSQL and displayed in a web dashboard.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Telegram Bots  │ ───▶ │  n8n Workflows  │ ───▶ │   PostgreSQL    │
│  (multi-user)   │      │  (AI parsing)   │      │                 │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  Next.js Web    │
                                                  │  Dashboard      │
                                                  └─────────────────┘
```

### Key Components

**receipt-parser-web/** - Next.js 16 application (App Router, React 19, TypeScript 5)
- `app/api/auth/` - Authentication endpoints (login, register, forgot-password, reset-password)
- `app/api/expenses/` - Expense CRUD operations with filtering/sorting
- `app/api/bots/` - Telegram bot management (list, add, delete)
- `app/api/metrics/` - Dashboard analytics and spending insights
- `lib/db.ts` - PostgreSQL connection pool using pg library
- `lib/translations.ts` - i18n translations (en/zh) with comprehensive dashboard strings
- `context/LanguageContext.tsx` - React context for language switching (localStorage persistence)
- `components/` - Reusable UI components (LanguageSwitcher, TelegramDemo)

**n8n/** - n8n workflow JSON exports
- `v18 Multi-User Dashboard-2.json` - Main receipt processing workflow (AI OCR, parsing, DB storage)
- `v18 Multi-Bot Wrapper.json` - Multi-bot orchestration layer
- `AUTO_LINK_NODE_SETUP.md` - Configuration for auto-linking Telegram accounts

**db/** - Database schema and migrations
- `schema.sql` - PostgreSQL table definitions with multi-user/multi-bot architecture
- `migration_add_telegram_user_id.sql` - Migration for Telegram user ID support

**Root-level utilities**
- `run_migration.js` - Database migration runner with verification
- `diagnose_db.js`, `verify_db.js`, `check_users.js` - Database diagnostic scripts

## Development Commands

```bash
# Navigate to web app
cd receipt-parser-web

# Development server (default: http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Database operations (from project root)
node run_migration.js           # Run migrations
node diagnose_db.js            # Diagnose DB issues
node receipt-parser-web/check_users.js  # Verify user records
```

## Database Architecture

### Core Tables

**users** - User accounts
- Primary columns: `id`, `username`, `email`, `password_hash`, `location`
- Telegram fields: `telegram_chat_id`, `telegram_user_id`, `telegram_bot_username`, `telegram_bot_token`
- Legacy bot fields maintained for backward compatibility
- Unique constraints on `telegram_chat_id` and `telegram_user_id`

**user_telegram_bots** - Multi-bot support (one user → many bots)
- Links users to multiple Telegram bots via `user_id` foreign key
- Columns: `bot_token`, `bot_username`, `is_active`
- Each bot has unique token constraint

**expenses** - Receipt transaction records
- Dual foreign keys: `user_id` (for multi-user queries) and `bot_id` (specific bot tracking)
- Legacy `chat_id` field for backward compatibility with n8n workflows
- Rich metadata: `vendor`, `amount_original`, `currency`, `amount_sgd`, `exchange_rate`, `category`, `location`, `payment_method`
- AI parsing metadata: `parsed_by`, `parsing_time`, `provider_tier`, `confidence_score`
- Receipt storage: `receipt_image_url`, `drive_file_id`
- Performance indexes on `user_id`, `(user_id, expense_date)`, `(user_id, category)`, `chat_id`

**verification_tokens** - Email verification and bot linking
- Types: `'email'` or `'telegram_link'`
- Time-bound tokens with `expires_at` timestamp

### Migration Pattern

Migrations are run via `run_migration.js` which:
1. Reads SQL from `receipt-parser-web/db/migration_*.sql`
2. Executes against PostgreSQL
3. Verifies schema changes
4. Outputs verification tables

## API Architecture

### Request Pattern
All API routes follow Next.js App Router conventions with route handlers in `app/api/*/route.ts`:
- Use `NextRequest` and `NextResponse` types
- Extract params via `request.url` and `searchParams`
- Return JSON responses with appropriate status codes

### Authentication Flow
- **Registration**: POST `/api/auth/register` - bcryptjs password hashing, bot token optional
- **Login**: POST `/api/auth/login` - password verification, returns user object (no session/JWT yet)
- **Password Reset**: OTP-based flow via Resend email service
  1. POST `/api/auth/forgot-password` - generates OTP token
  2. POST `/api/auth/reset-password` - validates OTP and updates password

### Data Isolation
- All queries filter by `user_id` passed as query parameter (e.g., `?userId=1`)
- No server-side session management - user context stored client-side after login
- Database enforces foreign key constraints for user-scoped data

### Expense API Patterns
GET `/api/expenses?userId=1&startDate=2024-01-01&endDate=2024-12-31&botId=2&category=Food&search=starbucks&sortBy=expense_date&sortOrder=DESC&limit=50&offset=0`
- Supports pagination (`limit`/`offset`), multi-field filtering, case-insensitive search
- Joins with `user_telegram_bots` to include `bot_username` in results
- Returns sorted, filtered expense records with metadata

## n8n Workflow Integration

### Data Flow
1. User sends receipt photo to personal Telegram bot
2. n8n `v18 Multi-Bot Wrapper` identifies bot token and routes to user
3. n8n `v18 Multi-User Dashboard-2` processes receipt:
   - AI OCR extraction (vendor, date, amount, items)
   - Currency conversion to SGD
   - Category classification
   - Data validation and confidence scoring
4. Parsed data inserted into `expenses` table with `user_id` and `bot_id`
5. Web dashboard queries `expenses` by `user_id` for display

### Auto-Link Pattern
The `AUTO_LINK_NODE_SETUP.md` documents a pattern for automatically populating `telegram_chat_id` and `telegram_user_id` when users first interact with their bot:
1. Check if user needs auto-linking (`needs_auto_link` flag)
2. If true, execute `UPDATE users SET telegram_user_id = ..., telegram_chat_id = ... WHERE id = ...`
3. Merge result back into workflow data
4. Continue to receipt processing

## Multi-Language (i18n) Architecture

### Implementation
- `lib/translations.ts` exports nested translation objects for `en` and `zh` languages
- `context/LanguageContext.tsx` provides React context with:
  - `language` state (persisted to localStorage)
  - `setLanguage()` function
  - `t` accessor for current language translations
- Components access via `useLanguage()` hook

### Translation Structure
```typescript
translations.en.dashboard.metrics.total_spending  // "TOTAL SPENDING"
translations.zh.dashboard.metrics.total_spending  // "总支出"
```

Covers all UI sections: navbar, hero, demo, features, pricing, testimonials, auth, dashboard

## Environment Variables

Required in `receipt-parser-web/.env.local`:
```bash
DATABASE_URL=postgresql://user:password@host:port/database  # PostgreSQL connection
RESEND_API_KEY=re_xxxxx                                      # Email service for password reset
EMAIL_FROM=noreply@receiptai.com                             # Sender email address
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/receipt      # n8n webhook endpoint
NODE_ENV=development                                          # Controls SSL for DB connection
```

## Implementation Patterns

### Database Queries
- Always use parameterized queries: `pool.query(sql, [param1, param2])`
- Never interpolate user input directly into SQL strings
- Use `async/await` with try/catch error handling
- Release connections in `finally` blocks if using `pool.connect()`

### Multi-Bot Support
- Users can register with optional bot token during signup
- Additional bots added via POST `/api/bots` endpoint
- Bot deletion via DELETE `/api/bots/[id]` with user ownership verification
- Expenses track both `user_id` (for user-level aggregation) and `bot_id` (for bot-specific filtering)

### Client-Side State
- No formal session management (intentional limitation)
- User data (id, username, email) stored in component state after login
- Language preference persisted to localStorage
- Dashboard fetches data on mount using user ID from props/state
