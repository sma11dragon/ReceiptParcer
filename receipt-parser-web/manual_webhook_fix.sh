#!/bin/bash

# Manual webhook fix for user siewloong's bot
BOT_TOKEN="8300983745:AAE51-GPPWl8MBpA_coQrQUMAYaxeJ2wJdg"
WEBHOOK_URL="https://n8ntest.daeit.com.sg/webhook/telegram-receipts"

echo "Setting webhook for DAE123_AntiGravity_TestBot..."
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}?bot_token=${BOT_TOKEN}\"}"

echo -e "\n\nChecking webhook info..."
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
