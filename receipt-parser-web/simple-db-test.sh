#!/bin/bash

echo "=== Simple PostgreSQL Connection Test ==="
echo ""

echo "1. Testing port 2665 with timeout..."
# Try to connect to port 2665 with a 3-second timeout
if (timeout 3 bash -c "exec 3<>/dev/tcp/localhost/2665" 2>/dev/null); then
    echo "   ✓ Success: Port 2665 is open and accepting connections"
    exec 3<&-  # Close the file descriptor
    exec 3>&-  # Close the file descriptor
else
    echo "   ✗ Failed: Cannot connect to port 2665"
    echo "   This could mean:"
    echo "   - PostgreSQL is not listening on port 2665"
    echo "   - Firewall is blocking port 2665"
    echo "   - PostgreSQL service is down"
fi
echo ""

echo "2. Checking receipt-parser container environment..."
echo "   DATABASE_URL variable:"
sudo docker exec receipt-parser printenv DATABASE_URL 2>/dev/null || echo "   Not found in container"
echo ""

echo "3. Testing database connection from inside container..."
echo "   Running simple connection test..."
sudo docker exec receipt-parser sh -c "
if command -v node >/dev/null 2>&1; then
    node -e \"
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://root:112233_root@localhost:2665/sma11dragon_DB'
});
pool.query('SELECT 1 as test')
    .then(() => console.log('   ✓ Database connection successful from container'))
    .catch(err => console.log('   ✗ Database connection failed:', err.message))
    .finally(() => pool.end());
\" 2>&1
else
    echo '   ⚠ Node.js not available in container'
fi
" 2>/dev/null
echo ""

echo "4. Quick fix if connection fails..."
echo "   A) Update DATABASE_URL in running container:"
echo "      sudo docker stop receipt-parser"
echo "      sudo docker rm receipt-parser"
echo "      sudo ./deploy.sh"
echo ""
echo "   B) Or manually set environment variable:"
echo "      sudo docker run -d --name receipt-parser --network host --restart unless-stopped \\"
echo "        -e DATABASE_URL='postgresql://root:112233_root@localhost:2665/sma11dragon_DB' \\"
echo "        -e RESEND_API_KEY='re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w' \\"
echo "        -e EMAIL_FROM='onboarding@resend.dev' \\"
echo "        -e N8N_WEBHOOK_URL='https://n8ntest.daeit.com.sg/webhook/telegram-receipts' \\"
echo "        -e NODE_ENV=production \\"
echo "        -e HOST='0.0.0.0' \\"
echo "        receipt-parser"
echo ""
echo "   C) Test the application:"
echo "      curl -v http://localhost:3000"