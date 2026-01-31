#!/bin/bash

echo "=== Checking Container Configuration ==="
echo ""

echo "1. Current receipt-parser container details:"
sudo docker inspect receipt-parser --format='{{json .Config.Env}}' 2>/dev/null | python3 -m json.tool 2>/dev/null || \
sudo docker inspect receipt-parser --format='{{json .Config.Env}}' 2>/dev/null
echo ""

echo "2. Network configuration:"
sudo docker inspect receipt-parser --format='{{.HostConfig.NetworkMode}}' 2>/dev/null
echo ""

echo "3. Checking if DATABASE_URL is correct..."
CURRENT_DB_URL=$(sudo docker inspect receipt-parser --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep DATABASE_URL | cut -d= -f2-)
if [ -n "$CURRENT_DB_URL" ]; then
    echo "   Current DATABASE_URL: $CURRENT_DB_URL"
    if echo "$CURRENT_DB_URL" | grep -q "localhost:2665"; then
        echo "   ✓ DATABASE_URL looks correct (using localhost:2665)"
    elif echo "$CURRENT_DB_URL" | grep -q "100.90.68.68:2665"; then
        echo "   ⚠ DATABASE_URL uses NAS IP (100.90.68.68:2665)"
        echo "   This should work but localhost:2665 is better for host network"
    elif echo "$CURRENT_DB_URL" | grep -q "172.19.0.2:5432"; then
        echo "   ✗ DATABASE_URL uses container IP (172.19.0.2:5432)"
        echo "   This won't work with host network mode!"
    else
        echo "   ? DATABASE_URL format not recognized"
    fi
else
    echo "   ✗ DATABASE_URL not found in container environment"
fi
echo ""

echo "4. Quick diagnostic:"
echo "   A) Is container using host network?"
if [ "$(sudo docker inspect receipt-parser --format='{{.HostConfig.NetworkMode}}' 2>/dev/null)" = "host" ]; then
    echo "   ✓ Yes, using host network"
    echo "   DATABASE_URL should be: postgresql://root:112233_root@localhost:2665/sma11dragon_DB"
else
    echo "   ✗ No, not using host network"
    echo "   Current network: $(sudo docker inspect receipt-parser --format='{{.HostConfig.NetworkMode}}' 2>/dev/null)"
fi
echo ""

echo "5. Recommended fix:"
echo "   If DATABASE_URL is wrong or container is not using host network:"
echo "   sudo docker stop receipt-parser"
echo "   sudo docker rm receipt-parser"
echo "   sudo ./deploy.sh"
echo ""
echo "   The deploy.sh script will:"
echo "   - Detect Synology NAS"
echo "   - Use host network mode"
echo "   - Set DATABASE_URL to localhost:2665"
echo "   - Restart the container with correct configuration"