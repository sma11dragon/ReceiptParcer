#!/bin/bash

# Quick test script for API authentication
# Usage: ./quick-test.sh <jwt_token>

set -e

TOKEN="$1"
API_URL="https://receipt-parcer.vercel.app/api"

if [ -z "$TOKEN" ]; then
    echo "Usage: ./quick-test.sh <jwt_token>"
    echo ""
    echo "To get a token:"
    echo "1. Create service account in database"
    echo "2. Generate token: JWT_SECRET='your-secret' node generate-n8n-token.js <user_id>"
    exit 1
fi

echo "🔍 Testing API Authentication"
echo "============================="
echo "Token: ${TOKEN:0:30}..."
echo ""

# Test 1: Without token (should fail)
echo "1. Testing WITHOUT token (should fail):"
curl -s -X POST \
  "${API_URL}/upload-receipt?userId=1&filename=test.jpg" \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' | jq -r '.error // "No error field"'
echo ""

# Test 2: With token (should not get 401)
echo "2. Testing WITH token (should not get 401):"
RESPONSE=$(curl -s -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "${API_URL}/upload-receipt?userId=1&filename=test.jpg" \
  -d '{"test":"data"}')

STATUS_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "Status Code: $STATUS_CODE"
if [ "$STATUS_CODE" = "401" ]; then
    echo "❌ FAIL: Got 401 Unauthorized - token invalid"
    echo "Response: $RESPONSE_BODY"
elif [ "$STATUS_CODE" = "400" ]; then
    echo "✅ PASS: Got 400 Bad Request - authentication worked!"
    echo "Response: $RESPONSE_BODY"
else
    echo "⚠️  NOTE: Got status $STATUS_CODE"
    echo "Response: $RESPONSE_BODY"
fi

echo ""
echo "📋 Test Summary:"
echo "If you get 400 (not 401), authentication is working!"
echo "The 400 error is expected because we're not sending actual receipt data."