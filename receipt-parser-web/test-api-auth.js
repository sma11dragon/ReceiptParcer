#!/usr/bin/env node

/**
 * Test API Authentication
 * Run: node test-api-auth.js
 */

const https = require('https');

const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL.replace('https://', '').replace('http://', '').split(':')[0],
            port: BASE_URL.includes('https') ? 443 : 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch {
                    resolve({
                        status: res.statusCode,
                        data
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAuthentication() {
    console.log('🔐 Testing API Authentication');
    console.log('=============================\n');

    // Test 1: Try to access protected route without token
    console.log('1. Testing protected route without token...');
    try {
        const result = await makeRequest('GET', '/api/expenses?userId=test');
        console.log(`   Status: ${result.status}`);
        if (result.status === 401) {
            console.log('   ✅ PASS: API correctly requires authentication\n');
        } else {
            console.log(`   ⚠️  WARNING: Expected 401, got ${result.status}\n`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
    }

    // Test 2: Register a test user
    console.log('2. Registering test user...');
    try {
        const registerData = {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            username: `testuser${Date.now()}`
        };
        
        const result = await makeRequest('POST', '/api/auth/register', registerData);
        console.log(`   Status: ${result.status}`);
        
        if (result.status === 200 || result.status === 201) {
            console.log('   ✅ PASS: User registration successful');
            console.log(`   Token: ${result.data.token ? 'Received' : 'Not received'}\n`);
            return result.data.token;
        } else {
            console.log(`   ❌ FAIL: Registration failed: ${JSON.stringify(result.data)}\n`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
        return null;
    }
}

async function testWithToken(token) {
    if (!token) {
        console.log('Skipping token tests - no token received');
        return;
    }

    // Test 3: Access protected route with token
    console.log('3. Testing protected route WITH token...');
    try {
        const result = await makeRequest('GET', '/api/expenses?userId=test', null, token);
        console.log(`   Status: ${result.status}`);
        
        if (result.status === 200) {
            console.log('   ✅ PASS: Successfully accessed protected route\n');
        } else if (result.status === 400) {
            console.log('   ⚠️  NOTE: Got 400 (user not found) - authentication worked!\n');
        } else {
            console.log(`   ❌ FAIL: Expected 200/400, got ${result.status}: ${JSON.stringify(result.data)}\n`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
    }

    // Test 4: Test upload-receipt endpoint
    console.log('4. Testing upload-receipt endpoint structure...');
    try {
        const result = await makeRequest('POST', '/api/upload-receipt?userId=test&filename=test.jpg', null, token);
        console.log(`   Status: ${result.status}`);
        
        if (result.status === 400) {
            console.log('   ✅ PASS: Endpoint requires binary data (got 400 for missing file)\n');
        } else {
            console.log(`   ⚠️  NOTE: Got ${result.status}\n`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
    }
}

async function main() {
    console.log(`Testing against: ${BASE_URL}\n`);
    
    const token = await testAuthentication();
    await testWithToken(token);
    
    console.log('📊 TEST SUMMARY');
    console.log('===============');
    console.log('Next steps:');
    console.log('1. Deploy to Vercel: git push or vercel --prod');
    console.log('2. Update n8n workflows to include authentication');
    console.log('3. Test frontend login/register flow');
    console.log('4. Monitor logs for any authentication issues\n');
    
    if (token) {
        console.log('🔑 Sample cURL command for testing:');
        console.log(`curl -H "Authorization: Bearer ${token.substring(0, 50)}..." \\`);
        console.log(`  "${BASE_URL}/api/expenses?userId=test"`);
    }
}

// Run tests
main().catch(console.error);