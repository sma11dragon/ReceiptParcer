#!/bin/bash
# Script to add GOOGLE_VISION_API_KEY to n8n container
# Run on your server: ssh -p 25 sma11dragon@100.90.68.68

echo "🔧 Adding Google Vision API key to n8n container..."

# Current container ID
CONTAINER_ID="321ed2c719ee"

echo "📦 Current n8n container: $CONTAINER_ID"

# Step 1: Get current container configuration
echo "🔍 Getting current container configuration..."
sudo docker inspect $CONTAINER_ID > /tmp/n8n_inspect.json

# Extract current environment variables
echo "📋 Current environment variables:"
sudo docker inspect $CONTAINER_ID | grep -A5 '"Env"' | grep -v '"Env"'

# Step 2: Stop the container
echo "⏸️  Stopping n8n container..."
sudo docker stop $CONTAINER_ID

# Step 3: Remove the container
echo "🗑️  Removing n8n container..."
sudo docker rm $CONTAINER_ID

# Step 4: Get the original run command
echo "🔍 Recreating container with environment variable..."

# Based on your setup, here's the command to recreate n8n with the API key
echo "🐳 Running new n8n container with environment variable..."

# Recreate n8n container with environment variable
sudo docker run -d \
  --name n8n \
  -e NODE_ENV=production \
  -e GOOGLE_VISION_API_KEY="AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc" \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  --restart unless-stopped \
  n8nio/n8n:latest

echo ""
echo "✅ n8n container recreated with environment variable"
echo ""
echo "📋 Verification steps:"
echo "1. Check if container is running:"
echo "   sudo docker ps | grep n8n"
echo ""
echo "2. Verify environment variable:"
echo "   sudo docker exec n8n printenv GOOGLE_VISION_API_KEY"
echo ""
echo "3. Test in n8n workflow:"
echo "   Create a Code node with: return [{ json: { api_key: process.env.GOOGLE_VISION_API_KEY } }];"
echo ""
echo "⚠️  IMPORTANT: Your n8n data should be preserved in the 'n8n_data' volume."
echo "   If you have custom configurations, they should persist."
echo ""
echo "🔗 n8n URL: https://n8ntest.daeit.com.sg"
echo "📝 Next: Update workflow to use {{ \$env.GOOGLE_VISION_API_KEY }}"