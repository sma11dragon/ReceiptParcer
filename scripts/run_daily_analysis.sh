#!/bin/bash
# Daily analysis script for query logs feedback loop
# Runs analysis of query_logs table and outputs recommendations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_APP_DIR="$PROJECT_ROOT/receipt-parser-web"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/analysis_$TIMESTAMP.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo "=========================================" >> "$LOG_FILE"
echo "Daily Query Logs Analysis - $TIMESTAMP" >> "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"

# Change to web app directory where analysis script is located
cd "$WEB_APP_DIR"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js." >> "$LOG_FILE"
    exit 1
fi

# Check if analysis script exists
if [ ! -f "analyze_query_logs.js" ]; then
    echo "ERROR: analyze_query_logs.js not found in $WEB_APP_DIR" >> "$LOG_FILE"
    exit 1
fi

# Run the analysis script
echo "Running query logs analysis..." >> "$LOG_FILE"
node analyze_query_logs.js >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "Analysis completed successfully." >> "$LOG_FILE"
    # Optional: Send notification (Telegram, email, etc.)
    # Add notification logic here if needed
else
    echo "Analysis failed with exit code $EXIT_CODE." >> "$LOG_FILE"
    # Optional: Send error notification
fi

echo "=========================================" >> "$LOG_FILE"
echo "Analysis completed at $(date)" >> "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"

# Keep only last 30 days of logs
find "$LOG_DIR" -name "analysis_*.log" -mtime +30 -delete

exit $EXIT_CODE