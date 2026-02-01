#!/bin/bash
# Setup script for n8n environment variables and workflow update
# Run this on your server: ssh -p 25 sma11dragon@100.90.68.68

echo "🔧 Setting up n8n environment variables for Google Vision API"

# Step 1: Check current n8n container
echo "📦 Checking n8n Docker container..."
sudo docker ps | grep n8n

echo ""
echo "📝 Choose your setup method:"
echo "1. Add environment variable to existing n8n container"
echo "2. Create new n8n container with environment variable"
echo "3. Use proxy server instead"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🔄 Adding environment variable to existing n8n container..."
        
        # Get n8n container ID
        CONTAINER_ID=$(sudo docker ps -q --filter "name=n8n")
        if [ -z "$CONTAINER_ID" ]; then
            echo "❌ No n8n container found!"
            exit 1
        fi
        
        echo "📦 Found n8n container: $CONTAINER_ID"
        
        # Get container info
        echo "🔍 Getting container information..."
        sudo docker inspect $CONTAINER_ID | grep -A5 -B5 "Env\|Environment"
        
        echo ""
        echo "📋 You need to recreate the n8n container with environment variable:"
        echo "   Add this to your docker run command:"
        echo "   -e GOOGLE_VISION_API_KEY='AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc'"
        echo ""
        echo "💡 Check your docker-compose.yml or startup script in /volume1/docker/ReceiptParcer"
        ;;
    
    2)
        echo "🐳 Creating new n8n container with environment variable..."
        
        echo "📋 Sample docker-compose.yml addition:"
        cat << 'EOF'
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    environment:
      - N8N_PROTOCOL=https
      - N8N_HOST=n8ntest.daeit.com.sg
      - N8N_PORT=5678
      - N8N_EDITOR_BASE_URL=https://n8ntest.daeit.com.sg
      - WEBHOOK_URL=https://n8ntest.daeit.com.sg
      - GOOGLE_VISION_API_KEY=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
EOF
        ;;
    
    3)
        echo "🔒 Setting up proxy server..."
        
        # Check if proxy files exist
        if [ ! -f "google-vision-proxy.js" ]; then
            echo "❌ Proxy file not found!"
            echo "📥 Downloading proxy files..."
            curl -O https://raw.githubusercontent.com/your-repo/google-vision-proxy.js
            curl -O https://raw.githubusercontent.com/your-repo/proxy-package.json
        fi
        
        # Install dependencies
        echo "📦 Installing proxy dependencies..."
        npm install express axios express-rate-limit
        
        # Create systemd service
        echo "⚙️  Creating systemd service..."
        cat << 'EOF' | sudo tee /etc/systemd/system/google-vision-proxy.service
[Unit]
Description=Google Vision API Proxy
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=/volume1/docker/ReceiptParcer
Environment=GOOGLE_VISION_API_KEY=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc
ExecStart=/usr/bin/node google-vision-proxy.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        echo "🚀 Starting proxy service..."
        sudo systemctl daemon-reload
        sudo systemctl enable google-vision-proxy
        sudo systemctl start google-vision-proxy
        
        echo "✅ Proxy server started on http://localhost:3001"
        echo "📝 Update n8n workflow URL to: http://localhost:3001/vision/ocr"
        ;;
    
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📋 Next steps:"
echo "1. Update n8n workflow to use environment variable or proxy"
echo "2. Test the workflow"
echo "3. Set Google Cloud quotas for the API key"
echo ""
echo "🔄 To update n8n workflow:"
echo "   Change URL from: https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc"
echo "   To: https://vision.googleapis.com/v1/images:annotate?key={{ $env.GOOGLE_VISION_API_KEY }}"
echo "   OR: http://localhost:3001/vision/ocr (if using proxy)"