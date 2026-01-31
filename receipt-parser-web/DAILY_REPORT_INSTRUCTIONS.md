# Weekly Query Logs Email Report

## Overview
The system now includes automated weekly email reports for query logs analysis (sent every Friday midnight Singapore time). These reports provide insights into user query patterns, success rates, and areas for improvement with AI-generated error analysis.

## Files Created
1. **`send_weekly_report.js`** - Main script that runs analysis for last 7 days and sends HTML email with AI-generated error summary
2. **`send_daily_report.js`** - Original daily report script (still available)
3. **Updated `analyze_query_logs.js`** - Enhanced to support silent mode and structured data return

## Configuration
- **Recipient**: `sma11dragon@gmail.com` (configured in script)
- **Email Service**: Resend API (uses `RESEND_API_KEY` from `.env.local`)
- **From Address**: `ReceiptAI Daily Report <onboarding@resend.dev>` (or configured `EMAIL_FROM`)

## Manual Testing

### 1. Send a weekly test report:
```bash
cd receipt-parser-web
node send_weekly_report.js
```

### 2. Send a daily test report (legacy):
```bash
cd receipt-parser-web
node send_daily_report.js
```

### 3. Run analysis only (no email):
```bash
cd receipt-parser-web
node analyze_query_logs.js
```

### 4. Using npm scripts:
```bash
npm run report:weekly   # Send weekly report (recommended)
npm run report:daily    # Send daily report (legacy)
npm run report:analyze  # Run analysis only
```

## Scheduling (Cron Job)

### Weekly Report (Friday midnight Singapore time):
Singapore time is UTC+8. Midnight Singapore time = 16:00 UTC (previous day).

**Option 1: Using UTC time (recommended for consistency):**
```bash
# Run weekly on Friday at 16:00 UTC (midnight Friday Singapore time)
0 16 * * 5 cd /Users/siewloongchan/Documents/AI\ Projects/Receipts\ Parsing/receipt-parser-web && node send_weekly_report.js >> /tmp/weekly_report.log 2>&1

# Using npm script
0 16 * * 5 cd /Users/siewloongchan/Documents/AI\ Projects/Receipts\ Parsing/receipt-parser-web && npm run report:weekly >> /tmp/weekly_report.log 2>&1
```

**Option 2: Using system timezone (if TZ=Asia/Singapore is set):**
```bash
# Set timezone in crontab (add at top of crontab)
TZ=Asia/Singapore

# Run weekly on Friday at 00:00 (midnight Singapore time)
0 0 * * 5 cd /Users/siewloongchan/Documents/AI\ Projects/Receipts\ Parsing/receipt-parser-web && node send_weekly_report.js >> /tmp/weekly_report.log 2>&1
```

### Daily Report (Optional - if still needed):
```bash
# Run daily at 8:00 AM Singapore time (00:00 UTC)
0 0 * * * cd /Users/siewloongchan/Documents/AI\ Projects/Receipts\ Parsing/receipt-parser-web && node send_daily_report.js >> /tmp/daily_report.log 2>&1
```

### For Windows (Task Scheduler):
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily, 8:00 AM
4. Action: Start a program
5. Program: `node.exe`
6. Arguments: `send_daily_report.js`
7. Start in: `C:\Users\siewloongchan\Documents\AI Projects\Receipts Parsing\receipt-parser-web`

## Report Content
Each **weekly** email includes:

1. **🤖 AI-Generated Error Analysis Summary** - Intelligent analysis of error patterns and trends
2. **Overall Statistics** - Query counts by outcome type (success, empty, invalid, ambiguous) for the last 7 days
3. **Recent Hourly Success Rate** - Performance trends for the last 12 hours
4. **Empty/Invalid Queries with Outcome Types** - Top 10 queries showing both message_text and outcome_type
5. **Common Filter Patterns** - Filters frequently leading to empty results
6. **Potential Misspellings** - Location names that might be misspelled
7. **Actionable Recommendations** - Suggestions for improving query classification

**Daily reports** (legacy) include similar content but for the last 24 hours only.

## Troubleshooting

### Email not sending:
1. Check `RESEND_API_KEY` in `.env.local`
2. Verify internet connection
3. Check console output for errors

### No data in report:
1. Ensure `query_logs` table has data from last 24 hours
2. Check database connection (`DATABASE_URL` in `.env.local`)

### Script errors:
1. Run with debug output: `node send_daily_report.js`
2. Check Node.js version: `node --version` (requires Node.js 14+)

## Customization

### Change recipient email:
Edit `send_daily_report.js`, line 334:
```javascript
to: 'sma11dragon@gmail.com',  // Change to desired email
```

### Change report frequency:
Adjust cron schedule as needed:
- Weekly on Friday at midnight Singapore time: `0 16 * * 5` (UTC) or `0 0 * * 5` with `TZ=Asia/Singapore`
- Daily at 8 AM Singapore time: `0 0 * * *` (UTC)
- Twice daily at 8 AM and 8 PM Singapore time: `0 0,12 * * *` (UTC)
- Weekly on Monday at 9 AM Singapore time: `0 1 * * 1` (UTC)

### Modify report content:
- **Weekly reports**: Edit `generateHTMLReport()` and `generateErrorSummary()` functions in `send_weekly_report.js`
- **Daily reports**: Edit `generateHTMLReport()` function in `send_daily_report.js`