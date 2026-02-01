#!/usr/bin/env node

/**
 * Simple JWT token generator using the existing auth library
 */

// Load environment variables
require('dotenv').config({ path: './receipt-parser-web/.env.local' });

// Set the JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || "n5GAEYsWKGdfpnlH4hJe8LeXbcGvWBVLwJm+BcUvOq8=";

// Import the auth library
const auth = require('./receipt-parser-web/lib/auth.ts');

// Get user ID from command line
const userId = process.argv[2];
if (!userId) {
    console.log('Usage: node generate-token-simple.js <user_id>');
    console.log('Example: node generate-token-simple.js 8');
    process.exit(1);
}

// Generate token using the auth library
const user = {
    id: parseInt(userId),
    email: 'n8n-service@receiptai.com',
    role: 'service'
};

try {
    const token = auth.generateToken(user);
    console.log('✅ JWT Token generated successfully!\n');
    
    console.log('🔑 Token:');
    console.log(token);
    
    console.log('\n📋 How to use in n8n:');
    console.log('1. Copy the token above');
    console.log('2. In n8n HTTP Request node, add header:');
    console.log('   Name: Authorization');
    console.log(`   Value: Bearer ${token}`);
    
    console.log('\n🧪 Test with curl:');
    console.log(`curl -H "Authorization: Bearer ${token.substring(0, 50)}..." \\`);
    console.log('  "https://receipt-parcer.vercel.app/api/upload-receipt?userId=1&filename=test.jpg"');
    
} catch (error) {
    console.error('❌ Error generating token:', error.message);
    process.exit(1);
}