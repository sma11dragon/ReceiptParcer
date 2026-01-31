#!/bin/bash
set -e  # Exit on any error

echo "=== Starting ReceiptAI Deployment ==="
cd /volume1/docker/ReceiptParcer

# Detect if running on Synology NAS
if [ -f "/etc/synoinfo.conf" ]; then
    IS_SYNOLOGY=true
    echo "✓ Detected Synology NAS"
    echo "   Using host network mode for better compatibility"
else
    IS_SYNOLOGY=false
    echo "⚠ Not running on Synology NAS (or not detected)"
fi

echo "1. Pulling latest code..."
git pull origin main

echo "2. Building Docker image..."
docker build -t receipt-parser .

echo "3. Stopping existing container..."
docker stop receipt-parser || true
docker rm receipt-parser || true

echo "4. Setting network mode..."
# Set network mode based on platform BEFORE checking connectivity
if [ "$IS_SYNOLOGY" = true ]; then
    NETWORK_MODE="host"
    PORT_MAPPING=""
    echo "   Using host network (recommended for Synology)"
    echo "   Note: Port mapping (-p) not needed with host network"
else
    NETWORK_MODE="bridge"
    PORT_MAPPING="-p 3000:3000"
    echo "   Using bridge network with port mapping"
fi

echo "5. Checking PostgreSQL connectivity..."
# Use appropriate DATABASE_URL based on network mode
if [ "$IS_SYNOLOGY" = true ] && [ "$NETWORK_MODE" = "host" ]; then
    # When using host network on Synology, use localhost with mapped port
    DATABASE_URL="postgresql://root:112233_root@localhost:2665/sma11dragon_DB"
    echo "   Using localhost:2665 (host network mode)"
    TEST_HOST="localhost"
    TEST_PORT="2665"
else
    # For bridge network, use container IP
    DATABASE_URL="postgresql://root:112233_root@172.19.0.2:5432/sma11dragon_DB"
    echo "   Using container IP 172.19.0.2:5432 (bridge network)"
    TEST_HOST="172.19.0.2"
    TEST_PORT="5432"
fi

# Test if PostgreSQL port is open
if command -v nc >/dev/null 2>&1; then
    if nc -z -w 3 "$TEST_HOST" "$TEST_PORT"; then
        echo "   ✓ PostgreSQL port is open at $TEST_HOST:$TEST_PORT"
    else
        echo "   ⚠ PostgreSQL port is closed or unreachable at $TEST_HOST:$TEST_PORT"
        echo "   This may cause the application to fail on startup."
        echo "   Check if PostgreSQL is running on your NAS:"
        echo "   - sudo systemctl status postgresql"
        echo "   - Or check Docker: docker ps | grep postgres"
        echo "   If PostgreSQL is in Docker, check port mapping: should be 2665:5432"
    fi
fi

echo ""
echo "5. Checking port 3000 availability..."
if command -v ss >/dev/null 2>&1; then
    if ss -tln | grep -q :3000; then
        echo "   ⚠ Port 3000 is already in use"
        echo "   Trying to stop existing container..."
    else
        echo "   ✓ Port 3000 is available"
    fi
fi

echo ""
echo "6. Starting new container..."

echo "   DATABASE_URL: $DATABASE_URL"
echo "   HOST: 0.0.0.0 (binds to all interfaces)"

docker run -d \
  --name receipt-parser \
  --network "$NETWORK_MODE" \
  $PORT_MAPPING \
  --restart unless-stopped \
  -e DATABASE_URL="$DATABASE_URL" \
  -e RESEND_API_KEY="re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w" \
  -e EMAIL_FROM="onboarding@resend.dev" \
  -e N8N_WEBHOOK_URL="https://n8ntest.daeit.com.sg/webhook/telegram-receipts" \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id" \
  -e HOST="0.0.0.0" \
  receipt-parser

echo ""
echo "7. Waiting for container to start (10 seconds)..."
sleep 10

echo ""
echo "8. Checking container status..."
if docker ps | grep -q receipt-parser; then
    echo "   ✓ Container is running"
    CONTAINER_ID=$(docker ps --filter "name=receipt-parser" --format "{{.ID}}")
    echo "   Container ID: $CONTAINER_ID"
    
    # Check if application is responding
    echo ""
    echo "9. Testing application health..."
    echo "   Waiting for application to be ready (max 30 seconds)..."
    
    # Determine test URL based on network mode
    if [ "$IS_SYNOLOGY" = true ] && [ "$NETWORK_MODE" = "host" ]; then
        TEST_URL="http://localhost:3000"
        echo "   Testing on host network: $TEST_URL"
    else
        TEST_URL="http://localhost:3000"
        echo "   Testing on bridge network: $TEST_URL"
    fi
    
    RESPONSE_OK=false
    for i in {1..6}; do
        if command -v curl >/dev/null 2>&1; then
            if curl -s --connect-timeout 5 "$TEST_URL" >/dev/null 2>&1; then
                echo "   ✓ Application is responding on $TEST_URL"
                RESPONSE_OK=true
                break
            fi
        elif command -v wget >/dev/null 2>&1; then
            if wget -q --tries=1 --timeout=5 -O /dev/null "$TEST_URL" 2>/dev/null; then
                echo "   ✓ Application is responding on $TEST_URL"
                RESPONSE_OK=true
                break
            fi
        else
            # If no curl/wget, just check if process is running
            if docker exec receipt-parser ps aux | grep -q node; then
                echo "   ✓ Node.js process is running inside container"
                RESPONSE_OK=true
                break
            fi
        fi
        
        if [ $i -lt 6 ]; then
            echo "   Attempt $i/6: Application not responding yet..."
            sleep 5
        fi
    done
    
    if [ "$RESPONSE_OK" = false ]; then
        echo "   ⚠ Application is not responding on $TEST_URL"
        echo "   The container is running but the web server may have issues."
        
        # Additional diagnostics
        echo ""
        echo "   Additional diagnostics:"
        echo "   - Checking if port 3000 is listening inside container..."
        docker exec receipt-parser sh -c "ss -tln 2>/dev/null | grep :3000 || netstat -tln 2>/dev/null | grep :3000 || echo '      Port 3000 not listening inside container'" 2>/dev/null
        
        echo "   - Checking Next.js process..."
        docker exec receipt-parser ps aux | grep -E "node|next" | head -3 || echo "      No node/next processes found"
        
        if [ "$IS_SYNOLOGY" = true ] && [ "$NETWORK_MODE" = "bridge" ]; then
            echo ""
            echo "   ⚠ Synology NAS detected with bridge network"
            echo "   Try switching to host network:"
            echo "   Edit deploy.sh: change '--network bridge' to '--network host'"
            echo "   And remove '-p 3000:3000'"
        fi
    fi
else
    echo "   ⚠ Container is not running!"
fi

echo ""
echo "10. Displaying recent logs (last 30 lines)..."
docker logs receipt-parser --tail 30 2>/dev/null || echo "   Cannot fetch logs (container may have stopped)"

echo ""
echo "=== Deployment complete ==="
if docker ps | grep -q receipt-parser; then
    echo "✓ Container is running"
    if [ "$IS_SYNOLOGY" = true ] && [ "$NETWORK_MODE" = "host" ]; then
        echo "✓ Access locally: http://localhost:3000"
        echo "✓ Access from network: http://$(hostname -I | awk '{print $1}'):3000"
    else
        echo "✓ Access locally: http://localhost:3000"
    fi
    echo "✓ Check Cloudflare tunnel points to NAS IP: 100.90.68.68:3000"
    
    if [ "$RESPONSE_OK" = false ]; then
        echo ""
        echo "⚠ Container running but web server not responding"
        echo "Run diagnostic script: ./diagnose-nas.sh"
        echo "Or fix with: ./fix-nas.sh"
    fi
else
    echo "✗ Container failed to start"
    echo "Check full logs: docker logs receipt-parser"
    echo "Common issues:"
    echo "1. Database connection failed - check PostgreSQL is running"
    echo "2. Port 3000 conflict - change port in -p 3001:3000"
    echo "3. Missing environment variables - check deploy.sh"
    echo "4. Application crash - check logs above"
    echo ""
    echo "Run diagnostic script: ./diagnose-nas.sh"
fi

echo ""
echo "=== Troubleshooting ==="
echo "If http://localhost:3000 is not accessible:"
echo "1. Run: ./test-access.sh (to diagnose the issue)"
echo "2. Run: ./fix-nas.sh (interactive fix script)"
echo "3. Check Synology firewall: Control Panel → Security → Firewall"
echo "4. Ensure port 3000 is allowed in firewall rules"
