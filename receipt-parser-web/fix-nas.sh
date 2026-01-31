#!/bin/bash

echo "=== ReceiptAI NAS Quick Fix Script ==="
echo "This script will help fix common deployment issues."
echo "Run this in /volume1/docker/ReceiptParcer on your NAS."
echo ""

# Check if we're in the right directory
if [ ! -f "deploy.sh" ]; then
    echo "ERROR: deploy.sh not found in current directory."
    echo "Please run this script from /volume1/docker/ReceiptParcer"
    exit 1
fi

# Backup original deploy.sh
BACKUP_FILE="deploy.sh.backup.$(date +%Y%m%d_%H%M%S)"
cp deploy.sh "$BACKUP_FILE"
echo "✓ Backed up deploy.sh to $BACKUP_FILE"

# Function to test PostgreSQL connectivity
test_postgresql() {
    echo "Testing PostgreSQL connectivity..."
    if command -v nc >/dev/null 2>&1; then
        # Try both possible PostgreSQL locations
        if nc -z -w 3 100.90.68.68 2665; then
            echo "✓ PostgreSQL is reachable at 100.90.68.68:2665 (host)"
            echo "DATABASE_URL=\"postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB?sslmode=disable\""
            return 0
        elif nc -z -w 3 172.19.0.2 5432; then
            echo "✓ PostgreSQL is reachable at 172.19.0.2:5432 (Docker bridge)"
            echo "DATABASE_URL=\"postgresql://root:112233_root@172.19.0.2:5432/sma11dragon_DB?sslmode=disable\""
            return 0
        else
            echo "✗ Cannot reach PostgreSQL at either location"
            echo "   Make sure PostgreSQL is running:"
            echo "   - If on host: sudo systemctl status postgresql"
            echo "   - If in Docker: docker ps | grep postgres"
            return 1
        fi
    else
        echo "⚠ netcat not available, skipping connectivity test"
        return 2
    fi
}

# Function to update DATABASE_URL in deploy.sh
update_database_url() {
    local new_url="$1"
    echo "Updating DATABASE_URL in deploy.sh to:"
    echo "  $new_url"
    
    # Find and replace DATABASE_URL line
    if grep -q "DATABASE_URL=" deploy.sh; then
        # Escape special characters for sed
        escaped_url=$(echo "$new_url" | sed 's/[\/&]/\\&/g')
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$escaped_url\"|" deploy.sh
        echo "✓ Updated DATABASE_URL"
    else
        echo "✗ Could not find DATABASE_URL in deploy.sh"
        return 1
    fi
    return 0
}

# Function to switch network mode
switch_network_mode() {
    local mode="$1"  # "bridge" or "host"
    echo "Switching network to $mode mode..."
    
    if [ "$mode" = "host" ]; then
        sed -i 's/--network bridge/--network host/' deploy.sh
        # Remove port mapping for host network (not needed)
        sed -i 's/-p 3000:3000 //' deploy.sh
        echo "✓ Changed to host network (port mapping removed)"
    else
        sed -i 's/--network host/--network bridge/' deploy.sh
        # Add port mapping back if missing
        if ! grep -q "-p 3000:3000" deploy.sh; then
            sed -i '/docker run -d \\/a\  -p 3000:3000 \\' deploy.sh
        fi
        echo "✓ Changed to bridge network with port mapping"
    fi
}

# Function for quick Synology fix
quick_synology_fix() {
    echo "=== Quick Fix for Synology NAS ==="
    echo "This will:"
    echo "1. Switch to host network (fixes bridge network issues on Synology)"
    echo "2. Add HOST=0.0.0.0 environment variable"
    echo "3. Remove port mapping (not needed with host network)"
    echo "4. Ensure all required environment variables are set"
    echo ""
    
    # Check if already on host network
    if grep -q "--network host" deploy.sh; then
        echo "Already using host network."
    else
        sed -i 's/--network bridge/--network host/' deploy.sh
        echo "✓ Switched to host network"
    fi
    
    # Remove port mapping if present (not needed with host network)
    sed -i 's/-p 3000:3000 //' deploy.sh
    sed -i 's/-p 3000:3000//' deploy.sh
    echo "✓ Removed port mapping (not needed with host network)"
    
    # Add HOST=0.0.0.0 if not present
    if ! grep -q "HOST=" deploy.sh; then
        # Add HOST=0.0.0.0 before the receipt-parser image
        sed -i 's|receipt-parser|-e HOST="0.0.0.0" \\\n  receipt-parser|' deploy.sh
        echo "✓ Added HOST=0.0.0.0 environment variable"
    else
        echo "✓ HOST=0.0.0.0 already set"
    fi
    
    # Ensure DATABASE_URL uses host IP (not Docker bridge)
    if grep -q "172.19.0.2" deploy.sh; then
        sed -i 's|172.19.0.2|100.90.68.68|' deploy.sh
        sed -i 's|:5432|:2665|' deploy.sh
        sed -i 's|?sslmode=disable||' deploy.sh
        echo "✓ Updated DATABASE_URL to use host IP (100.90.68.68:2665)"
    fi
    
    echo ""
    echo "Quick fix complete! Now restarting container..."
    echo ""
    sudo ./deploy.sh
}

# Function to test current accessibility
test_accessibility() {
    echo "=== Testing Current Setup ==="
    echo "1. Testing from inside container..."
    docker exec receipt-parser sh -c "wget -q --tries=1 --timeout=3 -O - http://localhost:3000 2>/dev/null | head -c 50 || echo '✗ Not accessible inside container'" 2>/dev/null
    
    echo "2. Testing from host to localhost:3000..."
    curl -s --connect-timeout 3 http://localhost:3000 2>/dev/null | head -c 50 || echo "✗ Not accessible from host (localhost:3000)"
    
    echo "3. Checking network mode..."
    NETWORK_MODE=$(docker inspect receipt-parser --format='{{.HostConfig.NetworkMode}}' 2>/dev/null || echo "Container not found")
    echo "   Current network mode: $NETWORK_MODE"
    
    echo "4. Checking port mapping..."
    docker port receipt-parser 3000 2>/dev/null || echo "   No port mapping found"
    
    echo "=== Test Complete ==="
}

# Main menu
echo ""
echo "Select an option:"
echo "1) Quick fix for Synology (container running but localhost:3000 not working)"
echo "2) Test PostgreSQL connectivity and auto-fix DATABASE_URL"
echo "3) Switch to host network (if bridge network has connectivity issues)"
echo "4) Switch to bridge network (default)"
echo "5) Update Google Client ID (required for login)"
echo "6) Test current accessibility (why isn't localhost:3000 working?)"
echo "7) Restart container with current configuration"
echo "8) View container logs"
echo "9) Restore backup"
echo "10) Exit"
echo ""
read -p "Enter choice (1-10): " choice

case $choice in
    1)
        quick_synology_fix
        ;;
    2)
        echo ""
        test_postgresql
        if [ $? -eq 0 ]; then
            read -p "Use this DATABASE_URL? (y/n): " confirm
            if [ "$confirm" = "y" ]; then
                # Extract URL from test output (last line)
                new_url=$(test_postgresql | tail -1 | cut -d' ' -f2-)
                update_database_url "$new_url"
                echo ""
                echo "Now restart the container with: sudo ./deploy.sh"
            fi
        else
            echo "Please fix PostgreSQL connectivity first."
        fi
        ;;
    3)
        switch_network_mode "host"
        echo ""
        echo "Now restart the container with: sudo ./deploy.sh"
        echo "Note: Host network means container uses host's network stack."
        echo "This can help with database connectivity if PostgreSQL is on host."
        ;;
    4)
        switch_network_mode "bridge"
        echo ""
        echo "Now restart the container with: sudo ./deploy.sh"
        ;;
    5)
        echo ""
        echo "Enter your Google OAuth Client ID (from Google Cloud Console):"
        echo "Format: XXXXXX-XXXXXXXXXXXX.apps.googleusercontent.com"
        read -p "Client ID: " client_id
        if [ -n "$client_id" ]; then
            sed -i "s/NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*/NEXT_PUBLIC_GOOGLE_CLIENT_ID=\"$client_id\"/" deploy.sh
            echo "✓ Updated Google Client ID"
            echo "Now restart the container with: sudo ./deploy.sh"
        else
            echo "No Client ID provided, keeping existing value."
        fi
        ;;
    6)
        test_accessibility
        ;;
    7)
        echo ""
        echo "Stopping and restarting container..."
        sudo ./deploy.sh
        ;;
    8)
        echo ""
        echo "Container logs (last 50 lines):"
        docker logs receipt-parser --tail 50 2>/dev/null || echo "Container not found or no logs"
        ;;
    9)
        echo ""
        echo "Available backups:"
        ls -la deploy.sh.backup.* 2>/dev/null || echo "No backups found"
        echo ""
        read -p "Enter backup filename to restore: " backup_file
        if [ -f "$backup_file" ]; then
            cp "$backup_file" deploy.sh
            chmod +x deploy.sh
            echo "✓ Restored $backup_file to deploy.sh"
        else
            echo "✗ Backup file not found"
        fi
        ;;
    10)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=== Quick Fix Complete ==="
echo "Next steps:"
echo "1. Check container status: docker ps | grep receipt-parser"
echo "2. View logs: docker logs receipt-parser --tail 100"
echo "3. Test locally: curl http://localhost:3000"
echo "4. If still having issues, run the diagnostic script: ./diagnose-nas.sh"
echo ""
echo "Remember to update Cloudflare tunnel if you changed the port or network mode."