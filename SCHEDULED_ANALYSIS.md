# Scheduled Analysis for Query Logs Feedback Loop

This document provides instructions for setting up automated daily analysis of query logs to enable the self-learning feedback loop.

## Overview

The feedback loop system logs all user queries at three stages:
1. **Classification** - When a query is classified by the AI
2. **SQL Execution** - When the SQL query is executed  
3. **Query Outcome** - When results are formatted and sent to user

Daily analysis of these logs helps identify:
- Common misspellings in location/vendor names
- Filters that frequently return empty results
- Invalid or ambiguous query patterns
- Success rate trends over time

## Analysis Script

The analysis script is located at:
- `receipt-parser-web/analyze_query_logs.js`

This script:
- Connects to the database using `DATABASE_URL` from `.env.local`
- Analyzes query logs from the last 24 hours
- Generates actionable recommendations
- Outputs formatted tables to console

## Scheduling Options

### Option 1: Cron Job (Recommended for Linux/macOS)

1. **Make the wrapper script executable**:
   ```bash
   chmod +x /path/to/Receipts\ Parsing/scripts/run_daily_analysis.sh
   ```

2. **Edit crontab**:
   ```bash
   crontab -e
   ```

3. **Add the following line to run daily at 2:00 AM**:
   ```
   0 2 * * * /path/to/Receipts\ Parsing/scripts/run_daily_analysis.sh
   ```

4. **Optional**: Add email notification for failures:
   ```
   MAILTO=your-email@example.com
   0 2 * * * /path/to/Receipts\ Parsing/scripts/run_daily_analysis.sh
   ```

### Option 2: Systemd Service (Linux with systemd)

1. **Create service file** `/etc/systemd/system/query-logs-analysis.service`:
   ```ini
   [Unit]
   Description=Daily Query Logs Analysis
   After=network.target

   [Service]
   Type=oneshot
   User=your-username
   WorkingDirectory=/path/to/Receipts Parsing
   ExecStart=/path/to/Receipts Parsing/scripts/run_daily_analysis.sh
   Environment="NODE_ENV=production"
   ```

2. **Create timer file** `/etc/systemd/system/query-logs-analysis.timer`:
   ```ini
   [Unit]
   Description=Run query logs analysis daily at 2:00 AM

   [Timer]
   OnCalendar=daily
   Persistent=true

   [Install]
   WantedBy=timers.target
   ```

3. **Enable and start the timer**:
   ```bash
   sudo systemctl enable query-logs-analysis.timer
   sudo systemctl start query-logs-analysis.timer
   ```

### Option 3: n8n Workflow Schedule

Create a new n8n workflow with:

1. **Schedule Trigger** node set to "Every Day" at 2:00 AM
2. **Code Node** that executes the analysis logic (copy the JavaScript from `analyze_query_logs.js`)
3. **Optional**: HTTP Request node to send results via webhook/email

**Advantages**:
- Integrated with existing n8n infrastructure
- Can easily trigger notifications (Telegram, email, Slack)
- No need for separate cron configuration

## Log Rotation

The wrapper script automatically:
- Stores analysis logs in `logs/analysis_YYYY-MM-DD_HH-MM-SS.log`
- Keeps only the last 30 days of logs
- Outputs both success and error messages

## Notification Integration

To add notifications when analysis reveals issues:

### Telegram Bot Notification
Add to the end of `analyze_query_logs.js`:
```javascript
// After generating recommendations
if (recommendations.length > 0) {
    const telegramMessage = `📊 Query Logs Analysis\n\n${recommendations.join('\n')}`;
    // Send via Telegram bot API
}
```

### Email Notification
Use the Resend API (already configured in the web app):
```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
```

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set in `receipt-parser-web/.env.local`
- Verify the PostgreSQL server is accessible from the machine running the analysis

### Permission Issues
- The script needs read access to `.env.local`
- The logs directory must be writable

### Node.js Version
- Requires Node.js 16 or higher
- Ensure all dependencies are installed: `pg` (PostgreSQL client)

## Monitoring

Check analysis execution:
- **Cron**: Check system logs: `grep CRON /var/log/syslog`
- **Systemd**: `sudo systemctl status query-logs-analysis.timer`
- **Logs**: Review the latest log file in `logs/` directory

## Manual Execution

To run analysis manually:
```bash
cd receipt-parser-web
node analyze_query_logs.js
```

## Next Steps

1. **Implement automated updates**: Use analysis results to automatically update classification logic
2. **Add real-time alerts**: Notify administrators when success rate drops below threshold
3. **Enhance analysis**: Add more sophisticated pattern detection and machine learning