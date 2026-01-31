#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_status() {
    if [ "$1" = "OK" ]; then
        echo -e "${GREEN}✓ $2${NC}"
    elif [ "$1" = "WARN" ]; then
        echo -e "${YELLOW}⚠ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ReceiptAI NAS Diagnostic Script     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Run this on your NAS in /volume1/docker/ReceiptParcer"
echo ""

print_section "1. SYSTEM INFORMATION"
echo "Hostname: $(hostname)"
echo "Date: $(date)"
echo "Docker version: $(docker --version 2>/dev/null || echo "Docker not found")"

print_section "2. DOCKER CONTAINER STATUS"
CONTAINER_EXISTS=$(docker ps -a --filter "name=receipt-parser" --format "{{.Names}}" | wc -l)
if [ "$CONTAINER_EXISTS" -eq 0 ]; then
    print_status "FAIL" "Container 'receipt-parser' does not exist"
    echo "This means the deploy.sh script failed to create the container."
    echo "Check deploy.sh output for errors during docker run command."
else
    CONTAINER_STATUS=$(docker inspect receipt-parser --format='{{.State.Status}}' 2>/dev/null)
    CONTAINER_RESTART_COUNT=$(docker inspect receipt-parser --format='{{.RestartCount}}' 2>/dev/null)
    CONTAINER_EXIT_CODE=$(docker inspect receipt-parser --format='{{.State.ExitCode}}' 2>/dev/null)
    CONTAINER_STARTED_AT=$(docker inspect receipt-parser --format='{{.State.StartedAt}}' 2>/dev/null)
    
    echo "Status: $CONTAINER_STATUS"
    echo "Restart count: $CONTAINER_RESTART_COUNT"
    echo "Exit code: $CONTAINER_EXIT_CODE"
    echo "Started at: $CONTAINER_STARTED_AT"
    
    if [ "$CONTAINER_STATUS" = "running" ]; then
        print_status "OK" "Container is running"
    elif [ "$CONTAINER_STATUS" = "exited" ]; then
        print_status "FAIL" "Container is stopped (exit code: $CONTAINER_EXIT_CODE)"
    elif [ "$CONTAINER_STATUS" = "restarting" ]; then
        print_status "WARN" "Container is in restart loop (restart count: $CONTAINER_RESTART_COUNT)"
    fi
    
    # Check port mapping
    PORT_MAPPING=$(docker port receipt-parser 2>/dev/null || echo "No port mapping")
    echo "Port mapping: $PORT_MAPPING"
fi

print_section "3. CONTAINER LOGS (last 100 lines)"
if [ "$CONTAINER_EXISTS" -eq 1 ]; then
    docker logs receipt-parser --tail 100 2>&1 | head -100
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        print_status "WARN" "Could not fetch logs (container may be created but not started)"
    fi
else
    echo "Container does not exist, no logs available"
fi

print_section "4. CONTAINER INTERNAL CHECK (if running)"
if [ "$CONTAINER_EXISTS" -eq 1 ] && [ "$CONTAINER_STATUS" = "running" ]; then
    # Check if process is running inside container
    print_info "Checking processes inside container..."
    docker exec receipt-parser ps aux 2>/dev/null | grep -E "node|next" | head -5 || print_status "WARN" "No node/next processes found"
    
    # Check if port 3000 is listening inside container
    print_info "Checking if port 3000 is listening inside container..."
    docker exec receipt-parser sh -c "ss -tlnp 2>/dev/null | grep :3000 || netstat -tlnp 2>/dev/null | grep :3000 || echo 'Port 3000 not listening'" 2>/dev/null
    
    # Check environment variables
    print_info "Checking environment variables..."
    docker exec receipt-parser sh -c "echo 'DATABASE_URL: '; printenv DATABASE_URL | head -c 50; echo ''" 2>/dev/null
    docker exec receipt-parser sh -c "echo 'NODE_ENV: '; printenv NODE_ENV" 2>/dev/null
    
    # Try to access the web server from inside container
    print_info "Testing web server from inside container..."
    docker exec receipt-parser sh -c "wget -q --tries=1 --timeout=3 -O - http://localhost:3000 2>/dev/null | head -c 100 || curl -s --connect-timeout 3 http://localhost:3000 | head -c 100 || echo 'Cannot connect to localhost:3000'" 2>/dev/null
    
    # Check disk space in container
    print_info "Checking disk space in container..."
    docker exec receipt-parser df -h /app 2>/dev/null || echo "Cannot check disk space"
else
    echo "Container is not running, skipping internal checks"
fi

print_section "5. NETWORK CHECKS"
# Check port 3000 on host
print_info "Checking port 3000 on host..."
if command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "Port 3000 not listening on host"
elif command -v netstat >/dev/null 2>&1; then
    netstat -tlnp 2>/dev/null | grep :3000 || echo "Port 3000 not listening on host"
else
    echo "Cannot check port 3000 (ss/netstat not available)"
fi

# Check bridge network
print_info "Checking Docker bridge network..."
docker network inspect bridge --format='{{range .Containers}}{{.Name}} {{.IPv4Address}}{{println}}{{end}}' 2>/dev/null | grep -v "^$" || echo "No containers on bridge network"

print_section "6. DATABASE CONNECTIVITY"
# Check PostgreSQL container
print_info "Looking for PostgreSQL containers..."
docker ps --filter "name=postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No PostgreSQL container found"

# Test database connection from host
print_info "Testing database connection from host..."
if command -v nc >/dev/null 2>&1; then
    nc -z -w 3 172.19.0.2 5432 2>/dev/null && print_status "OK" "Port 5432 is open at 172.19.0.2" || print_status "WARN" "Port 5432 is closed at 172.19.0.2"
    nc -z -w 3 100.90.68.68 2665 2>/dev/null && print_status "OK" "Port 2665 is open at 100.90.68.68" || print_status "WARN" "Port 2665 is closed at 100.90.68.68"
else
    echo "Netcat not available, skipping port tests"
fi

print_section "7. DOCKER IMAGE AND BUILD"
# Check if image exists
print_info "Checking Docker images..."
docker images receipt-parser --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" || echo "Image 'receipt-parser' not found"

# Check .env file in current directory
print_info "Checking environment files..."
if [ -f ".env.local" ]; then
    echo ".env.local exists"
    grep DATABASE_URL .env.local | head -1 | cut -c1-50
else
    print_status "WARN" ".env.local not found in current directory"
fi

print_section "8. QUICK FIX ATTEMPTS"
echo "Based on the diagnostics above, try these fixes:"
echo ""
echo "1. If container is stopped or in restart loop:"
echo "   - Check full logs: docker logs receipt-parser --tail 200"
echo "   - Remove and recreate: docker rm -f receipt-parser && sudo ./deploy.sh"
echo ""
echo "2. If database connection fails:"
echo "   - Update DATABASE_URL in deploy.sh:"
echo "     Option A (if PostgreSQL is Docker container):"
echo "       -e DATABASE_URL=\"postgresql://root:112233_root@172.19.0.2:5432/sma11dragon_DB?sslmode=disable\""
echo "     Option B (if PostgreSQL is on host NAS):"
echo "       -e DATABASE_URL=\"postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB\""
echo ""
echo "3. If port 3000 is already in use:"
echo "   - Change port in deploy.sh: -p 3001:3000"
echo "   - Update Cloudflare tunnel to point to new port"
echo ""
echo "4. If container starts but app crashes:"
echo "   - Check Node.js version compatibility (should be 20)"
echo "   - Rebuild with clean cache: docker build --no-cache -t receipt-parser ."
echo ""
echo "5. Emergency restore:"
echo "   - Revert to previous commit: git checkout HEAD~1"
echo "   - Then run: sudo ./deploy.sh"

print_section "SUMMARY"
if [ "$CONTAINER_STATUS" = "running" ]; then
    print_status "OK" "Container is running"
    echo "Next steps:"
    echo "1. Check if port 3000 is accessible: curl http://localhost:3000"
    echo "2. Check Cloudflare tunnel configuration"
    echo "3. Verify firewall rules allow port 3000"
elif [ "$CONTAINER_STATUS" = "exited" ]; then
    print_status "FAIL" "Container is stopped"
    echo "Next steps:"
    echo "1. Check container logs for crash reason"
    echo "2. Fix DATABASE_URL if database connection fails"
    echo "3. Check for missing environment variables"
else
    print_status "WARN" "Container status: $CONTAINER_STATUS"
    echo "Next steps:"
    echo "1. Run detailed diagnostics above"
    echo "2. Check deploy.sh script for errors"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   Diagnostic complete                 ${NC}"
echo -e "${BLUE}========================================${NC}"