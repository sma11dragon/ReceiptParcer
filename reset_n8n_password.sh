#!/bin/bash
# Script to reset n8n admin password
# Run on your NAS: ssh -p 25 sma11dragon@100.90.68.68

echo "🔧 Resetting n8n admin password..."

# Check if sqlite3 is installed
if ! command -v sqlite3 &> /dev/null; then
    echo "📦 Installing sqlite3..."
    sudo apt-get update && sudo apt-get install -y sqlite3
fi

DB_PATH="/volume1/docker/n8n/data/database.sqlite"

echo "📊 Checking n8n database..."

# Check what tables exist
echo "📋 Database tables:"
sudo sqlite3 "$DB_PATH" ".tables" 2>/dev/null || echo "❌ Cannot access database"

echo ""
echo "👥 Checking users table..."

# Check user table structure
echo "📝 User table schema:"
sudo sqlite3 "$DB_PATH" ".schema user" 2>/dev/null || echo "❌ No user table found"

echo ""
echo "🔍 Existing users:"
sudo sqlite3 "$DB_PATH" "SELECT id, email, firstName, lastName, createdAt FROM user;" 2>/dev/null || echo "❌ Cannot query users"

echo ""
echo "🔑 Password reset options:"
echo ""
echo "Option 1: Update existing user password"
echo "----------------------------------------"
echo "sudo sqlite3 \"$DB_PATH\" \"UPDATE user SET password = '\$2b\$10\$4XORyQJWv8pQxlpRHN.8.eHv6eL9pJGd.TZR2cW2cD6cCwJQ8z8W.' WHERE email = 'your-email@example.com';\""
echo "# This sets password to: password"
echo ""
echo "Option 2: Create new admin user"
echo "--------------------------------"
cat << 'EOF'
sudo sqlite3 "$DB_PATH" "INSERT INTO user (email, password, firstName, lastName, role, createdAt, updatedAt) VALUES ('admin@example.com', '\$2b\$10\$4XORyQJWv8pQxlpRHN.8.eHv6eL9pJGd.TZR2cW2cD6cCwJQ8z8W.', 'Admin', 'User', 'global:admin', datetime('now'), datetime('now'));"
EOF
echo ""
echo "Option 3: Check for encrypted passwords"
echo "----------------------------------------"
echo "sudo sqlite3 \"$DB_PATH\" \"SELECT email, substr(password, 1, 30) as password_prefix FROM user LIMIT 5;\""

echo ""
echo "📋 Instructions:"
echo "1. First check what users exist (run the query above)"
echo "2. If you see your email, use Option 1 to reset password to 'password'"
echo "3. If no users exist, use Option 2 to create new admin"
echo "4. After reset, login with email and password 'password'"
echo ""
echo "⚠️  IMPORTANT: Restart n8n after database changes"
echo "   sudo docker restart n8n"