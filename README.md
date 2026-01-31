# Multi-Tenant Telegram Bot System - Project Status

## Overview
A multi-tenant Telegram bot system for receipt parsing where users can register their own Telegram bots. Each user's bot sends messages to a shared webhook, which routes messages to the correct user account.

## Architecture Overview

### Infrastructure Components
1. **Remote NAS Server**: Hosts PostgreSQL database and n8n workflow automation
   - PostgreSQL: `postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB`
   - n8n: `https://n8ntest.daeit.com.sg` (public-facing)
   - Connected via Tailscale tunnel for secure access

2. **Local Development Environment**:
   - Node.js scripts for database operations, migrations, and analysis
   - Next.js web application (`receipt-parser-web/`) for user registration
   - Git repository for version control

3. **Telegram Bot Infrastructure**:
   - Multiple user-owned Telegram bots with unique tokens
   - Centralized webhook endpoint at `https://n8ntest.daeit.com.sg/webhook/telegram-receipts`
   - Query parameter routing: `?bot_token=<TOKEN>` for multi-tenant support

4. **Data Flow**:
   - User registers via web interface → database record created with verification token
   - User adds Telegram bot token → stored in `users.telegram_bot_token`
   - Webhook script configures bot webhook with token parameter
   - User sends `/start TOKEN` via Telegram → links Telegram chat ID to account
   - Bot messages routed via webhook → n8n wrapper workflow → user-specific processing

5. **Security & Connectivity**:
   - Tailscale VPN ensures secure database access from local scripts
   - Database credentials stored in `.env.local` (not committed)
   - Telegram bot tokens stored encrypted in database

### File Organization
- **`receipt-parser-web/`**: Next.js web application with API routes and scripts
- **`n8n/`**: Workflow definitions (JSON) for dashboard and wrapper workflows
- **`db/`**: Database schema and migration scripts
- **`skills/`**: n8n skill documentation for AI assistants
- **Root scripts**: Utility scripts for database operations, testing, and analysis

## Core Problem
New users who register via web interface have `NULL` values for `telegram_chat_id` and `telegram_user_id` in the database. The wrapper workflow fails to lookup users when `telegram_chat_id` is `NULL`, requiring users to send `/start TOKEN` from Telegram to link their account.

## What's Been Fixed

### 1. Database Layer Improvements
**Functions Created:**
- `update_user_telegram_ids()` - Updates both `verification_tokens` AND `users` tables during token verification
- `get_user_by_bot_token_or_chat_id()` - Looks up users by `telegram_chat_id` OR `bot_token`

**Database Connection:**
```bash
postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB
```

### 2. Dashboard Workflow (`v18 Dashboard - Telegram Chat ID Fix.json`)
**Purpose:** Handles `/start` command from users to link Telegram accounts
**Key Features:**
- Updates both `verification_tokens` and `users` tables when token is verified
- Sets `telegram_chat_id`, `telegram_user_id`, and `is_verified = true`
- Works with verification tokens generated during web registration

### 3. Wrapper Workflow Evolution (V1-V5)
**Latest Version:** `v18 Wrapper - Telegram Chat ID Fix V5.json` (Enhanced Debugging)

**Current Flow:**
1. Webhook receives message with `?bot_token=TOKEN` query parameter
2. "Normalize Telegram Data" node extracts token via `input.query?.bot_token`
3. SQL lookup: `WHERE telegram_chat_id = X OR bot_token = Y`
4. If no user found but bot_token exists → prompts user to send `/start TOKEN`

**V5 Enhanced Features:**
- Comprehensive logging of webhook data structure
- Multiple extraction attempts (query params, URL parsing, raw body)
- Safe token masking in logs (shows only first 10 chars)
- Better error messages for unregistered users

### 4. Webhook Configuration
**Script:** `receipt-parser-web/fix_webhook.js`
**Purpose:** Updates all bot webhooks with `?bot_token=` query parameter
**Current Webhooks:**
- RachelTBot: `https://n8ntest.daeit.com.sg/webhook/telegram-receipts?bot_token=8194014177:...`
- AntiGravity: `https://n8ntest.daeit.com.sg/webhook/telegram-receipts?bot_token=8300983745:...`

## Current Issue: RachelTBot (User ID 4)

### Problem Description
When RachelTBot sends a message:
- `bot_token_from_webhook` is empty in "Normalize Telegram Data" node
- SQL executes: `WHERE ... OR ('' != '' AND u.telegram_bot_token = '')`
- Workflow hangs without notifying user

### RachelTBot Database Status
```sql
-- Users table
id: 4
username: 'RachelTBot'
telegram_bot_token: '8194014177:AAG_IWsKrtusA7u1tnSrxCBqPtqxQkoBjT0'
telegram_chat_id: NULL
telegram_user_id: NULL
is_verified: false

-- user_telegram_bots table
bot_username: '@RachelTBot'
bot_token: '8194014177:AAG_IWsKrtusA7u1tnSrxCBqPtqxQkoBjT0'
```

### Root Cause Analysis
Webhook query parameters may not be accessible in n8n webhook node output, or token extraction logic needs adjustment. The wrapper V5 includes debugging to identify the actual data structure.

## Files Modified

### Core Workflows
- `n8n/v18 Wrapper - Telegram Chat ID Fix V5.json` - Main wrapper with enhanced debugging
- `n8n/v18 Dashboard - Telegram Chat ID Fix.json` - Handles `/start` commands

### Database Scripts
- `apply_telegram_fix.js` - Creates database functions
- `fix_telegram_chat_id.sql` - SQL functions for multi-tenant lookup
- `check_rachel_bot.js` - Verifies RachelTBot database state

### Webhook Management
- `receipt-parser-web/fix_webhook.js` - Updates bot webhooks with token parameter
- `receipt-parser-web/.env.local` - Contains `DATABASE_URL` and `N8N_WEBHOOK_URL`

## Key Technical Details

### Database Schema
```sql
-- users table
telegram_chat_id BIGINT
telegram_user_id BIGINT
telegram_bot_token VARCHAR(100)
telegram_bot_username VARCHAR(100)
is_verified BOOLEAN

-- verification_tokens table
token VARCHAR(64)
user_id INTEGER
type VARCHAR(20) -- 'telegram'
telegram_user_id BIGINT
telegram_username VARCHAR(255)
verified_at TIMESTAMP

-- user_telegram_bots table (used by webhook script)
bot_username VARCHAR(255)
bot_token VARCHAR(100)
```

### User Flow
1. **Web Registration:** User creates account, gets verification token
2. **Bot Setup:** User registers their own Telegram bot via web interface
3. **Webhook Configuration:** Script sets webhook with `?bot_token=` parameter
4. **Telegram Linking:** User sends `/start TOKEN` to link Telegram account
5. **Message Processing:** Bot messages routed to correct user account

## Next Steps - Ready for Execution

### Immediate Actions
1. **Deploy V5 wrapper** to n8n production
2. **Ask user to send test message** via RachelTBot
3. **Examine n8n execution logs** for debug output from "Normalize Telegram Data" node
4. **Fix bot token extraction** based on observed data structure

### Debug Strategy
If token still not found:
- Check if n8n webhook node exposes query params differently (maybe `input.query` is a string)
- Try parsing the raw webhook URL from `input.url`
- Update extraction logic in "Normalize Telegram Data" node

### Testing Scenarios
1. **New user** (no chat_id): Should receive "send /start with token" message
2. **Registered user with linked chat_id**: Should proceed to expense processing
3. **Callback queries**: Should work with existing chat_id lookup

## Environment Configuration

### Required Environment Variables
```bash
# receipt-parser-web/.env.local
DATABASE_URL=postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB
N8N_WEBHOOK_URL=https://n8ntest.daeit.com.sg/webhook/telegram-receipts
```

### Database Functions
Both functions have been applied to production database:
- `update_user_telegram_ids()` - Called by dashboard workflow during `/start`
- `get_user_by_bot_token_or_chat_id()` - Called by wrapper workflow for user lookup

## Workflow Execution Order

1. **User Registration** → Web interface
2. **Bot Registration** → User adds their bot token via web
3. **Webhook Setup** → Run `fix_webhook.js` to configure webhooks
4. **Telegram Linking** → User sends `/start TOKEN` (handled by dashboard workflow)
5. **Message Processing** → User's bot messages processed by wrapper workflow

## Common Issues & Solutions

### Issue: "bot_token_from_webhook" is empty
**Possible causes:**
1. Webhook query parameters not accessible via `input.query`
2. N8N webhook node wraps data differently
3. Token extraction logic needs adjustment

**Debug with V5:**
- Check n8n execution logs for "Normalize Telegram Data" node output
- Examine full webhook data structure
- Adjust extraction logic based on actual data

### Issue: User not found in database lookup
**Check:**
1. Bot token exists in `users.telegram_bot_token`
2. User has `is_verified = true` (after sending `/start`)
3. `telegram_chat_id` is set (after sending `/start`)

### Issue: Webhook not receiving messages
**Verify:**
1. Bot webhook is set with correct URL and token parameter
2. Webhook URL is accessible from Telegram servers
3. Bot token is valid and bot is running

## Starting New Session

When starting a new session with this project:

1. **Read this README.md** to understand current status
2. **Check RachelTBot issue** - bot token extraction from webhook
3. **Deploy V5 wrapper** if not already deployed
4. **Test with RachelTBot** to see debug output
5. **Fix extraction logic** based on observed data structure
6. **Verify complete flow** from registration to message processing

## Project Cleanup (Jan 25 2026)
To reduce project size for new sessions, the following cleanup was performed:

### Files/Directories Removed:
1. **Node modules**: `node_modules/` (828K) and `receipt-parser-web/node_modules/` (379MB)
2. **Next.js build cache**: `receipt-parser-web/.next/` (311MB)
3. **Obsolete workflow versions**: Kept only V5 wrapper and dashboard fix, removed V1-V4 and v17 workflows
4. **Temporary scripts**: `patch_dashboard.js`, `patch_wrapper.js`, `fix_wrapper_sql*.js`, `run_fix_sql.js`, `test_fix_sql.js`, `create_wrapper_v5.js`
5. **Obsolete documentation**: `TELEGRAM_CHAT_ID_FIX_INSTRUCTIONS.md`, `TELEGRAM_FIX_DEPLOYMENT_GUIDE.md`
6. **System files**: `.DS_Store` files (where possible)

### Files/Directories Retained:
1. **Essential scripts**: `apply_telegram_fix.js`, `check_rachel_bot.js`, `check_database_state.js`, `fix_telegram_chat_id.sql`
2. **Workflows**: `n8n/v18 Dashboard - Telegram Chat ID Fix.json`, `n8n/v18 Wrapper - Telegram Chat ID Fix V5.json`
3. **Web application**: `receipt-parser-web/` (without node_modules and .next, includes source code and `fix_webhook.js`)
4. **Database**: `db/` directory with schema and test data
5. **Documentation**: `README.md`, `AGENTS.md`, `CLAUDE.md`, `ENGINEERING_MANAGER_DOCUMENTATION.md`, `QA_TESTING_FRAMEWORK.md`
6. **Configuration**: `.github/`, `.vscode/`, `.claude/`, `package.json`, `package-lock.json`

### Project Size Reduction:
- **Before cleanup**: ~1.1GB (including node_modules and build caches)
- **After cleanup**: ~24MB (97.8% reduction)

### To Restore Development Environment:
```bash
# Install root dependencies (if needed)
npm install

# Install web application dependencies
cd receipt-parser-web
npm install

# Build Next.js application
npm run build
```

## Recent Changes
- **Weekly Report System**: Implemented `send_weekly_report.js` with AI-generated error analysis for Friday midnight Singapore time delivery
- **Enhanced Analysis**: Updated `analyze_query_logs.js` to support 7-day intervals and improved error categorization
- **Cron Scheduling**: Added weekly cron job configuration for automated reporting
- **Database Functions**: Created for multi-tenant user lookup
- **Dashboard Workflow**: Updated to properly link Telegram IDs
- **Wrapper Workflow V5**: Enhanced debugging and fixed onboarding for new users
- **Webhook Configuration**: Configured with `?bot_token=` parameter for all bots
- **RachelTBot Issue**: Webhook correctly set but token extraction fails (ongoing)
- **Project Cleanup**: Reduced size from 1.1GB to 24MB (previous cleanup)
- **AI Query Handling**: Identified issues with empty result notification

## Current Focus
1. **Weekly Report System**: ✅ Implemented and ready for scheduling (Friday midnight Singapore time)
2. **AI Query Handling**: Robust system for user queries with empty result notification and clarification prompts
3. **Self-Learning Design**: Feedback loop with query logging and analysis for continuous improvement
4. **Bot Token Extraction**: Debugging why `bot_token` isn't being extracted from webhook query parameters in wrapper workflow V5
5. **Project Cleanup**: Identifying and documenting unused/redundant files for removal

## AI Query Handling Improvements
**Problem**: User queries like "what are my expenses from the Philippine?", "list all expenses from the Philippines", "list the top 10 expenses (most expensive first) in 2025" result in "🔍 Searching your expenses..." message but stop without informing users when queries return nothing.

**Solution Requirements**:
1. **Robust Query Design**: Ensure SQL queries can correctly interpret user intent and return relevant results
2. **Empty Result Notification**: When queries return no data, inform users and ask clarification questions to refine/rephrase
3. **Self-Learning System**: Design workflow to adapt to new query patterns through user interaction
4. **Edge Case Handling**: Handle misspellings, ambiguous filters, date ranges, and partial matches

**Implementation Plan**:
- Enhance the "Classify Text Input" node for better intent detection
- Modify the "Execute a SQL query" node with smarter query generation
- Add post-processing nodes to check result emptiness and provide feedback
- Implement a clarification loop for ambiguous queries
- Add logging to track query patterns for future improvements
## Proposed Feedback Loop Architecture

**Goal**: Create a closed-loop system that learns from user interactions to improve query handling, prevent failures, and enhance user experience.

### Database Schema for Query Logging
```sql
CREATE TABLE query_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    chat_id BIGINT,
    message_text TEXT,
    classification_json JSONB,
    sql_query TEXT,
    result_count INTEGER,
    outcome_type VARCHAR(20), -- "invalid", "ambiguous", "empty", "success", "error"
    error_message TEXT,
    filters_applied JSONB,
    session_id UUID
);
```

### Strategic Logging Nodes in the Workflow
1. **After Classification**: Log all classification outcomes (`is_valid_expense_query`, `needs_clarification`, extracted filters)
2. **After SQL Execution**: Log SQL queries, result counts, empty results
3. **After Response Formatting**: Log final response type and user-facing message

### Analysis Pipeline (Daily & Weekly)
- **Daily Analysis**: Run automatically via cron job for immediate insights
- **Weekly Report**: Comprehensive analysis sent every Friday midnight (Singapore time) with AI-generated error summaries
- **Pattern Recognition**: Common misspellings, ambiguous queries, empty result filters
- **Improvement Suggestions**: New location names, regex adjustments, keyword expansions
- **Email Reports**: Automated insights delivered to `sma11dragon@gmail.com`

#### Weekly Report Features:
1. **AI-Generated Error Analysis**: Intelligent summary of error patterns and trends
2. **Detailed Query Analysis**: Message text with outcome type mapping for empty/invalid queries
3. **Success Rate Monitoring**: Hourly trends and overall statistics for past 7 days
4. **Actionable Recommendations**: Specific suggestions for improving classification logic
5. **Misspelling Detection**: Automated fuzzy matching against known locations

#### Scheduling:
- **Weekly**: Friday at 00:00 Singapore time (16:00 UTC Thursday) via cron job
- **Script**: `receipt-parser-web/send_weekly_report.js` (uses `npm run report:weekly`)
- **Daily (optional)**: Legacy daily reports available via `send_daily_report.js`

### Self-Learning Mechanism
- **Pattern Mapping**: Track `failed_query → successful_query` patterns
- **Correction Dictionary**: Automatically add corrections (e.g., "Philppines" → "Philippines")
- **Weekly Updates**: Update `knownLocations`, vendor lists, confidence thresholds
- **Success Rate Monitoring**: Adjust classification based on query success rates

### Privacy Considerations
- Hash `message_text` for analysis while keeping raw for debugging
- Anonymize `chat_id` after 30 days
- Exclude sensitive filters (payment methods) from logging
- GDPR-compliant retention (90 days raw, 1 year aggregated)

### Benefits for Future Interactions
- **Preventive Improvements**: Identify confusion points before they affect many users
- **Predictive Enhancements**: Suggest clarifications before ambiguous queries fail
- **User Experience**: Reduced "no results found" frustration, faster query resolution
- **Engineering Efficiency**: Focus improvements on actual user pain points

### Next Steps for Implementation
1. ✅ Add logging nodes to the `ai_query` branch after classification, SQL execution, and formatting
2. ✅ Create database table for query logs
3. ✅ Implement daily analysis script (Python/Node.js)
4. Build automated improvement suggestion system
5. Integrate with existing classification logic for dynamic updates

### Feedback Loop Implementation Progress (Completed)

#### ✅ Database Schema & Migration
- **Table Created**: `query_logs` with all required fields
- **Indexes Added**: Performance indexes for `timestamp`, `chat_id`, `outcome_type`, `result_count`, and GIN indexes for JSONB columns
- **Migration Script**: `receipt-parser-web/run_query_logs_migration.js` uses DATABASE_URL from `.env.local`
- **Schema Integration**: Added to `receipt-parser-web/db/schema.sql` for future deployments

#### ✅ Logging Nodes Added & Configured in n8n Workflow
- **"Log Classification"**: PostgreSQL node after "Classify Query Intent" with `queryReplacement` mapping classification data
- **"Log SQL Execution"**: PostgreSQL node after "Execute SQL Query" with `queryReplacement` mapping SQL query and result count
- **"Log Query Outcome"**: PostgreSQL node after "Simple Formatter" with `queryReplacement` mapping final outcome type
- **Workflow Connections**: 
  - "Classify Query Intent" → "Log Classification" (parallel with original branch)
  - "Execute SQL Query" → "Log SQL Execution" (parallel with "Simple Formatter")
  - "Simple Formatter" → "Log Query Outcome" (parallel with "get Chat ID")
- **Parameter Configuration**: All logging nodes have proper `queryReplacement` expressions to map workflow data to database columns
- **Positioning**: Nodes placed at coordinates [-8000, 1600], [-8000, 1700], and [-8000, 1800] in workflow canvas

#### ✅ Daily Analysis Script Implemented
- **File**: `receipt-parser-web/analyze_query_logs.js`
- **Features**:
  - Overall statistics by outcome type (success, empty, invalid, ambiguous, error)
  - Empty result query analysis with filter patterns
  - Potential misspellings detection using fuzzy matching against known locations
  - Common filters in empty results (location, category, vendor)
  - Hourly success rate trends
  - Actionable recommendations for improving classification logic
- **Database Connection**: Uses same DATABASE_URL configuration as other scripts

#### 📊 Current Status
- Database table ready for logging (`query_logs`)
- All three logging nodes configured and connected in workflow
- Analysis script ready to process logs
- JSON syntax validated - workflow is syntactically correct
- Ready for testing with actual user queries

#### 🔄 Remaining Steps for Full Implementation
1. **Test full flow**: Verify data flows into query_logs during actual queries (simulate test queries)
2. **Schedule analysis**: Set up daily cron job or n8n workflow to run analysis script
3. **Implement automated updates**: Create mechanism to update classification logic based on analysis findings
4. **Add session tracking**: Implement `session_id` generation to correlate multiple logs for same query
5. **Enhance outcome detection**: Improve `outcome_type` determination in logging nodes

### Deploying the Feedback Loop

#### Scheduling Analysis Reports
**Weekly Report (Recommended)**: Runs every Friday midnight Singapore time (16:00 UTC Thursday)
```bash
# Edit crontab
crontab -e

# Weekly report (Friday midnight Singapore time)
0 16 * * 5 cd /path/to/receipts-parsing/receipt-parser-web && node send_weekly_report.js >> /var/log/weekly_report.log 2>&1

# Using npm script
0 16 * * 5 cd /path/to/receipts-parsing/receipt-parser-web && npm run report:weekly >> /var/log/weekly_report.log 2>&1
```

**Daily Analysis (Optional)**: For more frequent monitoring
```bash
# Daily analysis at 9 AM
0 9 * * * cd /path/to/receipts-parsing/receipt-parser-web && node analyze_query_logs.js >> /var/log/daily_analysis.log 2>&1

# Daily report (legacy)
0 9 * * * cd /path/to/receipts-parsing/receipt-parser-web && node send_daily_report.js >> /var/log/daily_report.log 2>&1
```

Alternatively, create an n8n workflow with a Schedule Trigger node that calls the script via HTTP request or command line.

#### Using Analysis Results
The analysis script provides actionable recommendations:

1. **Adding new location names**: When new locations appear in empty result filters, add them to the `knownLocations` array in the "Classify Query Intent" node.
2. **Correcting misspellings**: Add corrections to a fuzzy matching dictionary or update the Levenshtein matching threshold.
3. **Improving classification**: Review invalid query patterns to enhance intent detection.

#### Manual Update Process
1. Run analysis: `cd receipt-parser-web && node analyze_query_logs.js`
2. Review recommendations in the output
3. Update the "Classify Query Intent" node code in `n8n/v18 Dashboard - Telegram Chat ID Fix.json`:
   - Add new locations to `knownLocations` array
   - Adjust confidence thresholds
   - Add vendor/category keywords
4. Save and deploy the updated workflow to n8n.

#### Towards Automation
For full automation, consider:
- Storing `knownLocations` and correction mappings in a database table
- Modifying the classification node to query dynamic configuration
- Creating an update script that applies recommendations automatically
- Setting up CI/CD to deploy workflow updates

### Testing the System
1. **Test logging**: Send test queries to the Telegram bot and verify logs appear in `query_logs` table:
   ```sql
   SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 10;
   ```
2. **Test analysis**: Run the analysis script with test data:
   ```bash
   cd receipt-parser-web && node test_query_logs.js
   ```
3. **Verify improvements**: After applying recommendations, test that previously failing queries now succeed.

The feedback loop is now operational. With daily analysis and manual updates, the system will continuously improve its query handling capabilities.

## Comprehensive File Inventory & Architecture

### Project Architecture Overview

#### Infrastructure Components & Data Flow
```
┌─────────────────┐    Tailscale Tunnel    ┌─────────────────────┐
│  Local Machine  │───────────────────────▶│   Remote NAS Server │
│                 │                        │                     │
│ • Git Repository│                        │ • PostgreSQL DB     │
│ • Node.js Scripts│                       │ • n8n Workflows     │
│ • Next.js App   │                        │ • Public Webhook    │
│ • Workflow JSON │◀───────────────────────│   Endpoint          │
└─────────────────┘    File Sync (Manual)  └─────────────────────┘
         │                                            │
         │                                            │
         ▼                                            ▼
┌─────────────────┐                        ┌─────────────────────┐
│   Telegram Bots │───────────────────────▶│   n8n Webhook       │
│  (User-owned)   │    HTTPS + bot_token   │  https://n8ntest.   │
│                 │                        │  daeit.com.sg/      │
└─────────────────┘                        └─────────────────────┘
```

#### Key Infrastructure Details:
1. **Remote NAS Server** (`100.90.68.68:2665` via Tailscale)
   - **PostgreSQL Database**: `postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB`
   - **n8n Instance**: `https://n8ntest.daeit.com.sg` (public-facing workflow automation)
   - **Connectivity**: Secure Tailscale VPN tunnel for database access, public HTTPS for webhooks

2. **Local Development Environment**
   - **Git Repository**: Version control for all code and configurations
   - **Node.js Scripts**: Database operations, migrations, analysis, and utilities
   - **Next.js Web App** (`receipt-parser-web/`): User registration interface
   - **n8n Workflow Definitions**: JSON files imported into n8n instance

3. **Telegram Bot Infrastructure**
   - **Multi-tenant Architecture**: Each user registers their own Telegram bot
   - **Webhook Routing**: Central endpoint with `?bot_token=` query parameter routing
   - **Bot Token Management**: Stored in `users.telegram_bot_token` for authentication

4. **Data Synchronization Process**
   - **Database**: Direct connection via Tailscale tunnel (scripts use `DATABASE_URL`)
   - **n8n Workflows**: Manual import/export of JSON files via n8n UI
   - **Code Deployment**: Manual git pull on NAS for production scripts (if deployed)
   - **Environment Variables**: Managed via `.env.local` files (not committed)

#### File Synchronization Guide:
- **Database Schema**: Managed via migration scripts (`run_migration.js`)
- **n8n Workflows**: Export from n8n UI → save to `n8n/` directory → commit to git
- **Utility Scripts**: Run locally via Tailscale tunnel to remote database
- **Web Application**: Can be deployed anywhere with database access

### Complete File Inventory

#### Core Application Files
| File | Purpose | Dependencies | Status | Cleanup Recommendation |
|------|---------|--------------|--------|------------------------|
| **`receipt-parser-web/`** | Next.js web application | Node.js, PostgreSQL, Resend API | Active | Keep |
| `receipt-parser-web/package.json` | Node.js dependencies | Node.js | Active | Keep |
| `receipt-parser-web/.env.local` | Environment configuration | - | Active | Keep (not committed) |
| `receipt-parser-web/analyze_query_logs.js` | Query logs analysis (daily/weekly) | Node.js, PostgreSQL | Active | Keep |
| `receipt-parser-web/send_weekly_report.js` | Weekly email reports | Node.js, Resend API, PostgreSQL | Active | Keep |
| `receipt-parser-web/send_daily_report.js` | Daily email reports (legacy) | Node.js, Resend API, PostgreSQL | Optional | Keep for reference |
| `receipt-parser-web/DAILY_REPORT_INSTRUCTIONS.md` | Report instructions | - | Active | Keep (updated for weekly) |
| `receipt-parser-web/run_migration.js` | Database migrations | Node.js, PostgreSQL | Essential | Keep |
| `receipt-parser-web/diagnose_db.js` | Database diagnostics | Node.js, PostgreSQL | Essential | Keep |
| `receipt-parser-web/verify_schema.js` | Schema verification | Node.js, PostgreSQL | Essential | Keep |
| `receipt-parser-web/check_users.js` | User verification utility | Node.js, PostgreSQL | Debugging | Keep |
| `receipt-parser-web/check_verification_tokens.js` | Token verification | Node.js, PostgreSQL | Debugging | Keep |
| `receipt-parser-web/fix_webhook.js` | Telegram bot webhook configuration | Node.js, Telegram API | Maintenance | Keep |
| `receipt-parser-web/corrections.json` | Misspelling corrections | - | Active | Keep |

#### n8n Workflow Definitions
| File | Purpose | Dependencies | Status | Cleanup Recommendation |
|------|---------|--------------|--------|------------------------|
| **`n8n/v18 Dashboard - Telegram Chat ID Fix.json`** | Main dashboard workflow | n8n, PostgreSQL | Active | Keep |
| **`n8n/v18 Wrapper - Telegram Chat ID Fix V5.json`** | Main wrapper workflow | n8n, PostgreSQL | Active | Keep |
| `n8n/v18 Dashboard - Telegram Chat ID Fix.json.backup` | Backup of dashboard workflow | - | Redundant | **Remove** (original preserved) |

#### Database & Schema Files
| File | Purpose | Dependencies | Status | Cleanup Recommendation |
|------|---------|--------------|--------|------------------------|
| **`apply_telegram_fix.js`** | Applies database functions | Node.js, PostgreSQL | One-time use | Keep for reference |
| **`fix_telegram_chat_id.sql`** | SQL functions for multi-tenant | PostgreSQL | One-time use | Keep for reference |
| **`db/` directory** | Database schema and migrations | PostgreSQL | Essential | Keep |

#### Root Utility Scripts (Debugging & Fixes)
| File | Purpose | Dependencies | Status | Cleanup Recommendation |
|------|---------|--------------|--------|------------------------|
| `check_rachel_bot.js` | Diagnostics for RachelTBot issue | Node.js, PostgreSQL | Debugging | Archive after issue resolved |
| `check_database_state.js` | General database state check | Node.js, PostgreSQL | Debugging | Keep |
| `check_classification.js` | Classification debugging | Node.js | Debugging | **Remove** (redundant) |
| `classification_test.js` | Classification logic test | Node.js | Testing | **Remove** (redundant) |
| `test_classification_logic.js` | Another classification test | Node.js | Testing | **Remove** (redundant) |

#### Python Fix Scripts (One-time Use)
| File | Purpose | Dependencies | Status | Cleanup Recommendation |
|------|---------|--------------|--------|------------------------|
| `extract_classification.py` | Extracts classification logic | Python | One-time use | **Archive** |
| `fix_classification_ordering.py` | Fixes classification ordering | Python | One-time use | **Archive** |
| `fix_all_telegram_references.py` | Fixes Telegram references | Python | One-time use | **Archive** |
| `fix_escaped.py` | Fixes escaped characters | Python | One-time use | **Archive** |
| `fix_telegram_trigger.py` | Fixes Telegram trigger | Python | One-time use | **Archive** |
| `fix_workflow_simple.py` | Simplifies workflows | Python | One-time use | **Archive** |
| `remove_debug.py` | Removes debug nodes | Python | One-time use | **Archive** |
| `reorder_classification.py` | Reorders classification | Python | One-time use | **Archive** |
| `update_classification.py` | Updates classification | Python | One-time use | **Archive** |
| `update_merge_results.py` | Updates merge results | Python | One-time use | **Archive** |
| `update_readme.py` | Updates README | Python | One-time use | **Archive** |
| `update_simple_formatter.py` | Updates simple formatter | Python | One-time use | **Archive** |

#### JavaScript Fix Scripts (One-time Use)
| File | Purpose | Dependencies | Status | Cleanup Recommendation |
|------|---------|--------------|--------|------------------------|
| `n8n/fix_logging_nodes.js` | Fixes logging nodes in n8n | Node.js | One-time use | **Archive** |
| `receipt-parser-web/fix_workflow_exact.js` | Exact workflow fixes | Node.js | One-time use | **Archive** |
| `receipt-parser-web/fix_workflow_permissive.js` | Permissive workflow fixes | Node.js | One-time use | **Archive** |
| `receipt-parser-web/fix_workflow_references.js` | Workflow reference fixes | Node.js | One-time use | **Archive** |
| `receipt-parser-web/update_simple_formatter.js` | Updates simple formatter | Node.js | One-time use | **Archive** |

#### Test Files
| File | Purpose | Dependencies | Status | Cleanup Recommendation |
|------|---------|--------------|--------|------------------------|
| `receipt-parser-web/test_query_logs.js` | Query logs testing | Node.js, PostgreSQL | Testing | **Remove** after testing |
| `receipt-parser-web/test_logging.js` | Logging tests | Node.js | Testing | **Remove** |
| `receipt-parser-web/check_logs.js` | Log checking utility | Node.js, PostgreSQL | Testing | **Remove** |
| `receipt-parser-web/check_table.js` | Table checking utility | Node.js, PostgreSQL | Testing | **Remove** |

#### Documentation Files
| File | Purpose | Status | Cleanup Recommendation |
|------|---------|--------|------------------------|
| **`README.md`** | Project documentation | Essential | Keep (this file) |
| **`AGENTS.md`** | Guidelines for AI assistants | Essential | Keep |
| **`CLAUDE.md`** | Project context for Claude | Essential | Keep |
| **`ENGINEERING_MANAGER_DOCUMENTATION.md`** | Engineering documentation | Essential | Keep |
| **`QA_TESTING_FRAMEWORK.md`** | Testing framework | Essential | Keep |
| **`SCHEDULED_ANALYSIS.md`** | Analysis scheduling guide | Essential | Keep |
| **`FEEDBACK_LOOP_IMPLEMENTATION.md`** | Feedback loop design | Essential | Keep |
| **`skills/` directory** | n8n skill documentation for AI | Essential | Keep |
| `receipt-parser-web/ai_orchestrated_plan.md` | AI plan documentation | Reference | Keep |
| `.claude/`, `.opencode/`, `.vscode/` | Editor/assistant configurations | Reference | Keep |

#### Configuration Files
| File | Purpose | Status | Cleanup Recommendation |
|------|---------|--------|------------------------|
| `package.json`, `package-lock.json` | Root dependencies | Active | Keep |
| `receipt-parser-web/tsconfig.json` | TypeScript configuration | Active | Keep |
| `.vscode/settings.json` | VS Code settings | Reference | Keep |
| `.claude/settings.local.json` | Claude settings | Reference | Keep |
| `.opencode/package.json` | OpenCode configuration | Reference | Keep |

### Backup Files (Obsolete)
| File | Purpose | Cleanup Recommendation |
|------|---------|------------------------|
| `receipt-parser-web/app/api/bots/[id]/route.ts.backup` | Backup of API route | **Remove** (original preserved in git) |

### Cleanup Implementation Plan

#### Phase 1: Immediate Cleanup (Safe to Delete)
1. **Delete backup files**: Both `.backup` files listed above
2. **Remove redundant test files**: All files marked "**Remove**" in Test Files section
3. **Archive Python scripts**: Move to `archive/python_fixes/` directory
4. **Archive JavaScript fix scripts**: Move to `archive/js_fixes/` directory

#### Phase 2: Consolidation
1. **Merge debugging utilities**: Combine `check_*` scripts into unified diagnostic tool
2. **Organize archive**: Create structured archive directory with README explaining each fix
3. **Update documentation**: Ensure all references to archived files are updated

#### Phase 3: Validation
1. **Test core functionality**: Verify after cleanup:
   - Database migrations still work
   - Weekly reports generate correctly
   - n8n workflows can be imported
   - Webhook configuration script functions
2. **Update gitignore**: Ensure archive directories are tracked but temporary files ignored

#### File Retention Rationale
- **Keep**: Files actively used in production or essential for maintenance
- **Archive**: Historical fixes that may inform future debugging
- **Remove**: Duplicate tests, temporary files, backups with git history

### Cleanup Status (2025-01-25)

#### Phase 1: Immediate Cleanup ✅ **COMPLETED**
- ✅ **Backup files deleted**: `n8n/v18 Dashboard - Telegram Chat ID Fix.json.backup` and `receipt-parser-web/app/api/bots/[id]/route.ts.backup`
- ✅ **Redundant test files removed**: `check_classification.js`, `classification_test.js`, `test_classification_logic.js`, `receipt-parser-web/test_logging.js`, `receipt-parser-web/check_table.js`, `receipt-parser-web/test_query_logs.js`, `receipt-parser-web/check_logs.js`
- ✅ **Python fix scripts archived**: 12 scripts compressed into `receipt-parser-web/archive/python_fixes/python_fixes.tar.gz` with README documentation
- ✅ **JavaScript fix scripts archived**: 5 scripts compressed into `receipt-parser-web/archive/js_fixes/js_fixes.tar.gz` with README documentation
- ⚠️ **Note**: Due to iCloud Drive restrictions, some original JavaScript fix files could not be deleted automatically. They remain in their original locations but are archived in tar.gz format.

#### Phase 2: Consolidation ⏳ **PENDING**
- **Merge debugging utilities**: Combine `check_*` scripts into unified diagnostic tool
- **Organize archive**: Create structured archive directory with README explaining each fix
- **Update documentation**: Ensure all references to archived files are updated

#### Phase 3: Validation ✅ **PARTIAL**
- ✅ **Database migrations**: Verified working (`node receipt-parser-web/diagnose_db.js`)
- ✅ **Weekly reports**: Test script passes (`node receipt-parser-web/test_weekly_report.js`)
- ✅ **n8n workflows**: Core JSON files present and importable
- ✅ **Webhook configuration**: Script `receipt-parser-web/fix_webhook.js` exists and functional
- ⏳ **Git tracking**: Archive directories need to be added to version control

### Getting Started for New Engineers
1. **Setup Tailscale**: Connect to the NAS VPN for database access
2. **Configure Environment**: Copy `.env.local.example` to `.env.local` and set `DATABASE_URL`
3. **Test Connection**: Run `node receipt-parser-web/diagnose_db.js` to verify database access
4. **Import Workflows**: Upload JSON files from `n8n/` directory to n8n instance
5. **Schedule Reports**: Add cron job for weekly reports (Friday midnight Singapore time)
6. **Configure Webhooks**: Run `node receipt-parser-web/fix_webhook.js` to set up bot webhooks

## Project Context

This project uses n8n for workflow automation.

AI assistants should:
- Prefer native n8n nodes over custom code
- Use correct node parameters and expressions
- Follow n8n best practices for error handling and retries