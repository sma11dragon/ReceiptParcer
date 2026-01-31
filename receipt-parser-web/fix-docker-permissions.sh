#!/bin/bash

echo "=== Fixing Docker Permissions and Deployment ==="
echo ""

echo "1. Checking current user..."
echo "   User: $(whoami)"
echo ""

echo "2. Testing Docker access..."
if docker ps >/dev/null 2>&1; then
    echo "   ✓ Docker access OK"
    DOCKER_NEEDS_SUDO=false
else
    echo "   ⚠ Docker access denied - need sudo"
    DOCKER_NEEDS_SUDO=true
fi
echo ""

echo "3. Checking PostgreSQL container..."
if [ "$DOCKER_NEEDS_SUDO" = true ]; then
    POSTGRES_STATUS=$(sudo docker ps | grep postgres || echo "Not found")
else
    POSTGRES_STATUS=$(docker ps | grep postgres || echo "Not found")
fi
echo "   PostgreSQL container: $POSTGRES_STATUS"
echo ""

echo "4. Checking receipt-parser container..."
if [ "$DOCKER_NEEDS_SUDO" = true ]; then
    RECEIPT_PARSER_STATUS=$(sudo docker ps -a | grep receipt-parser || echo "Not found")
else
    RECEIPT_PARSER_STATUS=$(docker ps -a | grep receipt-parser || echo "Not found")
fi
echo "   Receipt-parser container: $RECEIPT_PARSER_STATUS"
echo ""

echo "5. Recommended actions:"
echo ""
if [ "$DOCKER_NEEDS_SUDO" = true ]; then
    echo "   A) Run deploy script with sudo:"
    echo "      sudo ./deploy.sh"
    echo ""
    echo "   B) Or add user to Docker group (permanent fix):"
    echo "      sudo usermod -aG docker $(whoami)"
    echo "      Then log out and back in"
else
    echo "   A) Run deploy script:"
    echo "      ./deploy.sh"
fi
echo ""
echo "   C) Check PostgreSQL port mapping:"
echo "      sudo docker ps | grep postgres"
echo "      Should show: 0.0.0.0:2665->5432/tcp"
echo ""
echo "   D) Test database connection:"
echo "      nc -z -w 3 localhost 2665 && echo 'Port 2665 open' || echo 'Port 2665 closed'"
echo ""

echo "=== Quick Fix Commands ==="
echo ""
echo "To fix everything in one go:"
echo "1. sudo ./deploy.sh"
echo "2. sudo docker logs receipt-parser --tail 50"
echo "3. curl http://localhost:3000"
echo ""

echo "If PostgreSQL port 2665 is not open, check:"
echo "  sudo docker ps | grep postgres"
echo "  If no port mapping, restart PostgreSQL with: -p 2665:5432"