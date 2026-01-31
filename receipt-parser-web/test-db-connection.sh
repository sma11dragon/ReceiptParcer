#!/bin/bash

echo "=== Testing Database Connection Options ==="
echo ""

echo "Option 1: PostgreSQL container IP (172.19.0.2:5432)"
echo "  This works if receipt-parser is on same Docker network as PostgreSQL"
echo "  Command: nc -z -w 3 172.19.0.2 5432"
echo ""

echo "Option 2: NAS host IP with mapped port (100.90.68.68:2665)"
echo "  This works if PostgreSQL container has port mapping 2665:5432"
echo "  Command: nc -z -w 3 100.90.68.68 2665"
echo ""

echo "Option 3: Localhost with mapped port (localhost:2665)"
echo "  This works from the NAS host itself"
echo "  Command: nc -z -w 3 localhost 2665"
echo ""

echo "=== Current Configuration ==="
echo "DATABASE_URL in .env.local:"
grep DATABASE_URL .env.local
echo ""

echo "DATABASE_URL in deploy.sh:"
grep "DATABASE_URL=" deploy.sh | head -1
echo ""

echo "=== Recommendation ==="
echo "Since receipt-parser uses 'host' network on Synology, it should use:"
echo "  DATABASE_URL=\"postgresql://root:112233_root@localhost:2665/sma11dragon_DB\""
echo "OR"
echo "  DATABASE_URL=\"postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB\""
echo ""
echo "The PostgreSQL container must have port mapping: 2665:5432"
echo "Check with: docker ps | grep postgres"