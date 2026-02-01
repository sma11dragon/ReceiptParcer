#!/bin/bash
# Quick n8n setup check script
# Run on your server: ssh -p 25 sma11dragon@100.90.68.68

echo "🔍 Checking n8n Docker setup..."

echo ""
echo "1. Checking Docker access..."
sudo docker ps 2>/dev/null | head -5
if [ $? -ne 0 ]; then
    echo "❌ Cannot access Docker. Checking groups..."
    groups sma11dragon
    echo ""
    echo "💡 Try: sudo usermod -aG docker sma11dragon"
    echo "💡 Then log out and log back in"
fi

echo ""
echo "2. Looking for n8n containers..."
sudo docker ps -a --filter "name=n8n" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

echo ""
echo "3. Checking for docker-compose files..."
ls -la docker-compose*.yml 2>/dev/null || echo "No docker-compose.yml found"
ls -la *.yml 2>/dev/null | grep -v "docker-compose" || echo "No other YAML files found"

echo ""
echo "4. Checking current directory..."
pwd
ls -la

echo ""
echo "5. Checking Portainer access..."
echo "💡 Portainer URL: http://100.90.68.68:9000"
echo "💡 Login to Portainer and check n8n container settings"

echo ""
echo "📋 Next steps based on what you find:"
echo ""
echo "A. If you see n8n container:"
echo "   sudo docker inspect n8n | grep -i env"
echo ""
echo "B. If you have docker-compose.yml:"
echo "   cat docker-compose.yml"
echo "   # Add: - GOOGLE_VISION_API_KEY=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc"
echo ""
echo "C. If using Portainer:"
echo "   1. Go to http://100.90.68.68:9000"
echo "   2. Find n8n container"
echo "   3. Click 'Duplicate/Edit'"
echo "   4. Add environment variable"
echo "   5. Redeploy"
echo ""
echo "D. Quick fix - add to docker group:"
echo "   sudo usermod -aG docker sma11dragon"
echo "   # Then exit and reconnect"