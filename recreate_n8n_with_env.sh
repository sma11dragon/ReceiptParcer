#!/bin/bash
# Recreate n8n container with Google Vision API key environment variable
# Run on your server: ssh -p 25 sma11dragon@100.90.68.68

echo "🔧 Recreating n8n container with environment variable..."

# Current container ID
CONTAINER_ID="321ed2c719ee"

echo "📦 Current n8n container: $CONTAINER_ID"
echo "💾 Data location: /volume1/docker/n8n/data"

# Step 1: Stop the container
echo "⏸️  Stopping n8n container..."
sudo docker stop $CONTAINER_ID

# Step 2: Remove the container
echo "🗑️  Removing n8n container..."
sudo docker rm $CONTAINER_ID

# Step 3: Recreate container with environment variable
echo "🐳 Creating new n8n container with GOOGLE_VISION_API_KEY..."

sudo docker run -d \
  --name n8n \
  -e NODE_ENV=production \
  -e GOOGLE_VISION_API_KEY="AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc" \
  -p 5678:5678 \
  -v /volume1/docker/n8n/data:/root/.n8n \
  --restart unless-stopped \
  n8nio/n8n:latest

echo ""
echo "✅ n8n container recreated successfully!"
echo ""
echo "📋 Verification:"
echo "1. Check container status:"
echo "   sudo docker ps | grep n8n"
echo ""
echo "2. Verify environment variable is set:"
echo "   sudo docker exec n8n printenv GOOGLE_VISION_API_KEY"
echo ""
echo "3. Check n8n logs:"
echo "   sudo docker logs n8n --tail 10"
echo ""
echo "🔗 n8n should be accessible at: https://n8ntest.daeit.com.sg"
echo ""
echo "⚠️  IMPORTANT: Your n8n data is preserved at /volume1/docker/n8n/data"
echo "   All workflows, credentials, and settings should be intact."
echo ""
echo "📝 Next steps:"
echo "1. Update your n8n workflow to use {{ \$env.GOOGLE_VISION_API_KEY }}"
echo "2. Import the updated workflow"
echo "3. Test receipt processing"