#!/bin/bash

echo "=== Testing PostgreSQL Connection ==="
echo ""

echo "1. Checking if PostgreSQL port 2665 is accessible..."
echo "   Using different methods since nc/telnet not available"
echo ""

echo "2. Method 1: Using /dev/tcp (bash built-in)"
if timeout 3 bash -c "cat < /dev/null > /dev/tcp/localhost/2665" 2>/dev/null; then
    echo "   ✓ Port 2665 is open via /dev/tcp"
else
    echo "   ✗ Port 2665 is closed via /dev/tcp"
fi
echo ""

echo "3. Method 2: Using psql client (if available)"
if command -v psql >/dev/null 2>&1; then
    echo "   Testing with psql..."
    if PGPASSWORD="112233_root" timeout 3 psql -h localhost -p 2665 -U root -d sma11dragon_DB -c "SELECT 1;" 2>/dev/null; then
        echo "   ✓ PostgreSQL connection successful via psql"
    else
        echo "   ✗ PostgreSQL connection failed via psql"
    fi
else
    echo "   ⚠ psql not available"
fi
echo ""

echo "4. Method 3: Using Python (if available)"
if command -v python3 >/dev/null 2>&1; then
    echo "   Testing with Python..."
    python3 -c "
import socket
import sys
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(3)
    result = sock.connect_ex(('localhost', 2665))
    if result == 0:
        print('   ✓ Port 2665 is open via Python')
    else:
        print('   ✗ Port 2665 is closed via Python (error:', result, ')')
    sock.close()
except Exception as e:
    print('   ✗ Error:', str(e))
" 2>/dev/null
else
    echo "   ⚠ Python not available"
fi
echo ""

echo "5. Method 4: Check from inside receipt-parser container"
echo "   Running: sudo docker exec receipt-parser nc -z -w 3 localhost 2665"
if sudo docker exec receipt-parser sh -c "command -v nc >/dev/null 2>&1 && nc -z -w 3 localhost 2665" 2>/dev/null; then
    echo "   ✓ Port 2665 is open from inside container"
else
    echo "   ✗ Cannot test from container (nc not available or port closed)"
fi
echo ""

echo "6. Checking receipt-parser logs for database errors..."
echo "   Last 20 lines of logs:"
sudo docker logs receipt-parser --tail 20 2>/dev/null | grep -i "error\|fail\|timeout\|database\|postgres\|connection" || echo "   No relevant errors found in last 20 lines"
echo ""

echo "=== Summary ==="
echo "PostgreSQL container: RUNNING with port 2665:5432"
echo "Receipt-parser container: RUNNING"
echo ""
echo "If port 2665 tests fail but container shows healthy, try:"
echo "1. Check firewall: sudo iptables -L -n | grep 2665"
echo "2. Test from different container: sudo docker run --rm -it alpine nc -z -w 3 host.docker.internal 2665"
echo "3. Check application logs for specific database errors"