#!/bin/bash

echo "=== ReceiptAI Container Access Test ==="
echo "Testing why http://localhost:3000 is not accessible"
echo ""

# Check if running on NAS (look for Synology-specific files)
if [ -f "/etc/synoinfo.conf" ]; then
    echo "✓ Running on Synology NAS"
    IS_SYNOLOGY=true
else
    echo "⚠ Not running on Synology (or not detected)"
    IS_SYNOLOGY=false
fi

echo ""
echo "1. Checking container status..."
if docker ps | grep -q receipt-parser; then
    echo "✓ Container 'receipt-parser' is running"
    CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' receipt-parser 2>/dev/null)
    CONTAINER_NETWORK=$(docker inspect -f '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}' receipt-parser 2>/dev/null)
    echo "   Container IP: $CONTAINER_IP"
    echo "   Network: $CONTAINER_NETWORK"
else
    echo "✗ Container 'receipt-parser' is NOT running"
    exit 1
fi

echo ""
echo "2. Checking port mappings..."
PORT_MAPPING=$(docker port receipt-parser 3000 2>/dev/null)
if [ -n "$PORT_MAPPING" ]; then
    echo "✓ Port 3000 is mapped: $PORT_MAPPING"
    HOST_PORT=$(echo "$PORT_MAPPING" | cut -d':' -f2)
else
    echo "✗ Port 3000 is not mapped"
    exit 1
fi

echo ""
echo "3. Testing from INSIDE the container..."
echo "   Checking if application is listening inside container..."
INSIDE_TEST=$(docker exec receipt-parser sh -c "wget -q --tries=1 --timeout=5 -O - http://localhost:3000 2>/dev/null | head -c 100 || curl -s --connect-timeout 5 http://localhost:3000 | head -c 100 || echo 'FAILED'" 2>/dev/null)

if [ "$INSIDE_TEST" != "FAILED" ] && [ -n "$INSIDE_TEST" ]; then
    echo "✓ Application is responding INSIDE container"
    echo "   Response preview: ${INSIDE_TEST:0:50}..."
else
    echo "✗ Application is NOT responding inside container"
    echo "   This means Next.js may have crashed or isn't listening."
    echo "   Check container logs: docker logs receipt-parser --tail 50"
    exit 1
fi

echo ""
echo "4. Testing from HOST to container IP ($CONTAINER_IP)..."
if command -v nc >/dev/null 2>&1; then
    if nc -z -w 3 "$CONTAINER_IP" 3000; then
        echo "✓ Can reach container IP $CONTAINER_IP:3000 from host"
    else
        echo "✗ Cannot reach container IP $CONTAINER_IP:3000 from host"
        echo "   This suggests Docker network isolation or firewall issue."
    fi
else
    echo "⚠ netcat not available, skipping IP connectivity test"
fi

echo ""
echo "5. Testing from HOST to localhost:3000..."
if command -v curl >/dev/null 2>&1; then
    HOST_TEST=$(curl -s --connect-timeout 5 http://localhost:3000 2>/dev/null | head -c 100)
    if [ -n "$HOST_TEST" ]; then
        echo "✓ Can reach http://localhost:3000 from host"
        echo "   Response preview: ${HOST_TEST:0:50}..."
    else
        echo "✗ Cannot reach http://localhost:3000 from host"
    fi
elif command -v wget >/dev/null 2>&1; then
    HOST_TEST=$(wget -q --tries=1 --timeout=5 -O - http://localhost:3000 2>/dev/null | head -c 100)
    if [ -n "$HOST_TEST" ]; then
        echo "✓ Can reach http://localhost:3000 from host"
        echo "   Response preview: ${HOST_TEST:0:50}..."
    else
        echo "✗ Cannot reach http://localhost:3000 from host"
    fi
else
    echo "⚠ Neither curl nor wget available, skipping localhost test"
fi

echo ""
echo "6. Checking what's listening on port 3000..."
if command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "   Nothing listening on port 3000 (according to ss)"
elif command -v netstat >/dev/null 2>&1; then
    netstat -tlnp 2>/dev/null | grep :3000 || echo "   Nothing listening on port 3000 (according to netstat)"
else
    echo "⚠ Cannot check listening ports (ss/netstat not available)"
fi

echo ""
echo "7. Checking Docker network configuration..."
NETWORK_TYPE=$(docker inspect receipt-parser --format='{{.HostConfig.NetworkMode}}')
echo "   Network mode: $NETWORK_TYPE"
if [ "$NETWORK_TYPE" = "bridge" ]; then
    echo "   Bridge network means ports must be explicitly mapped with -p"
elif [ "$NETWORK_TYPE" = "host" ]; then
    echo "   Host network means container uses host's network stack directly"
fi

echo ""
echo "8. Checking for common Synology issues..."
if [ "$IS_SYNOLOGY" = true ]; then
    echo "   Synology DSM often has firewall rules blocking non-standard ports"
    echo "   Check: Control Panel → Security → Firewall → Edit Rules"
    echo "   Ensure port 3000 (TCP) is allowed or disable firewall temporarily to test"
    
    # Check if Docker is running with --net=host (common Synology fix)
    if [ "$NETWORK_TYPE" = "host" ]; then
        echo "   ✓ Using host network (good for Synology)"
    else
        echo "   ⚠ Consider switching to host network for Synology:"
        echo "     Change '--network bridge' to '--network host' in deploy.sh"
        echo "     And remove '-p 3000:3000' (not needed with host network)"
    fi
fi

echo ""
echo "=== TEST RESULTS ==="
echo ""

# Determine the issue based on tests
if docker ps | grep -q receipt-parser; then
    if [ -n "$HOST_TEST" ]; then
        echo "✅ SUCCESS: Container is running AND accessible at http://localhost:3000"
        echo "   The issue might be:"
        echo "   - Cloudflare tunnel configuration"
        echo "   - Router/firewall blocking external access"
        echo "   - Browser cache (try incognito mode)"
    else
        echo "❌ PROBLEM: Container is running but NOT accessible at http://localhost:3000"
        echo ""
        echo "Possible causes and solutions:"
        echo ""
        echo "A. Docker network issue:"
        echo "   1. Switch to host network (best for Synology):"
        echo "      Edit deploy.sh: change '--network bridge' to '--network host'"
        echo "      And remove '-p 3000:3000'"
        echo "   2. Or use different port: change '-p 3000:3000' to '-p 3001:3000'"
        echo "      Then access via http://localhost:3001"
        echo ""
        echo "B. Synology firewall blocking port 3000:"
        echo "   1. Go to Control Panel → Security → Firewall"
        echo "   2. Add rule to allow port 3000 (TCP)"
        echo "   3. Or disable firewall temporarily to test"
        echo ""
        echo "C. Application binding issue:"
        echo "   1. Next.js might be binding to 127.0.0.1 instead of 0.0.0.0"
        echo "   2. Check if .env.local has HOST=0.0.0.0"
        echo "   3. Add to deploy.sh: -e HOST=0.0.0.0"
        echo ""
        echo "D. Port conflict:"
        echo "   1. Check if another service uses port 3000:"
        echo "      sudo lsof -i :3000"
        echo "   2. Stop that service or change container port"
        echo ""
        echo "Quick fix:"
        echo "  Run: ./fix-nas.sh and choose option 2 (switch to host network)"
    fi
else
    echo "❌ Container is not running"
    echo "   Check logs: docker logs receipt-parser --tail 100"
fi

echo ""
echo "=== NEXT STEPS ==="
echo "1. Try switching to host network: ./fix-nas.sh (option 2)"
echo "2. Check Synology firewall: Control Panel → Security → Firewall"
echo "3. Test with different port: Edit deploy.sh to use -p 3001:3000"
echo "4. Check Cloudflare tunnel points to correct NAS IP and port"
echo ""
echo "After fixing, test with: curl http://localhost:3000"
echo "If successful locally, then check Cloudflare tunnel configuration."