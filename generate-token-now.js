#!/usr/bin/env node

/**
 * Generate JWT token for n8n service account
 */

const jwt = require('jsonwebtoken');

// Configuration
const JWT_SECRET = "n5GAEYsWKGdfpnlH4hJe8LeXbcGvWBVLwJm+BcUvOq8=";
const JWT_EXPIRY = '365d'; // 1 year for service account
const USER_ID = "8"; // From your database
const USER_EMAIL = "n8n-service@receiptai.com";
const USER_ROLE = "service";

// Generate token
const payload = {
    userId: USER_ID,
    email: USER_EMAIL,
    role: USER_ROLE,
    iss: 'receiptai-n8n-service',
    iat: Math.floor(Date.now() / 1000)
};

try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    console.log('🔐 JWT Token Generated Successfully');
    console.log('====================================\n');
    
    console.log('📋 Token Details:');
    console.log(`User ID: ${USER_ID}`);
    console.log(`Email: ${USER_EMAIL}`);
    console.log(`Role: ${USER_ROLE}`);
    console.log(`Expires: ${JWT_EXPIRY}`);
    
    console.log('\n🔑 Full Token:');
    console.log('='.repeat(80));
    console.log(token);
    console.log('='.repeat(80));
    
    // Decode to show payload
    const decoded = jwt.decode(token);
    console.log('\n📄 Decoded Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n🚀 How to use in n8n:');
    console.log('1. Copy the token above');
    console.log('2. In n8n HTTP Request node:');
    console.log('   - Go to "Add Option" → "Headers"');
    console.log('   - Add header:');
    console.log('     Name: Authorization');
    console.log(`     Value: Bearer ${token}`);
    
    console.log('\n🧪 Test with curl:');
    console.log(`curl -H "Authorization: Bearer ${token.substring(0, 50)}..." \\`);
    console.log('  "https://receipt-parcer.vercel.app/api/upload-receipt?userId=1&filename=test.jpg"');
    
    console.log('\n✅ Quick test command:');
    console.log(`./quick-test.sh "${token}"`);
    
} catch (error) {
    console.error('❌ Error generating token:', error.message);
    process.exit(1);
}