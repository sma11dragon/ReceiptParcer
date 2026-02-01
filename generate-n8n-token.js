#!/usr/bin/env node

/**
 * Generate JWT token for n8n service account
 * 
 * Usage:
 *   node generate-n8n-token.js <user_id> [jwt_secret]
 * 
 * Example:
 *   node generate-n8n-token.js 3 "your-jwt-secret-here"
 * 
 * Or set JWT_SECRET environment variable:
 *   JWT_SECRET="your-secret" node generate-n8n-token.js 3
 */

const jwt = require('jsonwebtoken');

function generateToken(userId, jwtSecret) {
  if (!jwtSecret || jwtSecret === 'your_jwt_secret_key_here_minimum_32_chars') {
    throw new Error('Invalid JWT secret. Please provide a secure JWT_SECRET.');
  }

  if (jwtSecret.length < 32) {
    console.warn('⚠️  Warning: JWT secret should be at least 32 characters for security');
  }

  const payload = {
    id: parseInt(userId),
    email: 'n8n-service@receiptai.com',
    role: 'service',
    iss: 'receiptai-n8n-service'
  };

  const token = jwt.sign(payload, jwtSecret, { expiresIn: '365d' });
  
  return token;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node generate-n8n-token.js <user_id> [jwt_secret]');
    console.log('');
    console.log('Arguments:');
    console.log('  user_id    : Database user ID for n8n service account');
    console.log('  jwt_secret : (Optional) JWT secret from Vercel environment variables');
    console.log('');
    console.log('Examples:');
    console.log('  node generate-n8n-token.js 3 "your-actual-jwt-secret"');
    console.log('  JWT_SECRET="your-secret" node generate-n8n-token.js 3');
    console.log('');
    console.log('To get the user ID:');
    console.log('  1. Check your database for user with email: n8n-service@receiptai.com');
    console.log('  2. Or create one using: INSERT INTO users (username, email, password_hash) VALUES (...)');
    console.log('');
    console.log('To get JWT_SECRET:');
    console.log('  1. Go to Vercel dashboard → Project → Settings → Environment Variables');
    console.log('  2. Copy the value of JWT_SECRET');
    process.exit(1);
  }

  const userId = args[0];
  const jwtSecret = args[1] || process.env.JWT_SECRET;

  console.log('🔐 Generating JWT Token for n8n Service Account');
  console.log('===============================================\n');
  
  console.log(`User ID: ${userId}`);
  console.log(`JWT Secret provided: ${jwtSecret ? 'Yes' : 'No'}`);
  
  if (!jwtSecret) {
    console.log('\n❌ Error: JWT secret is required.');
    console.log('Set it as:');
    console.log('  1. Command line argument: node generate-n8n-token.js 3 "your-secret"');
    console.log('  2. Environment variable: JWT_SECRET="your-secret" node generate-n8n-token.js 3');
    console.log('  3. In .env file (for local testing)');
    process.exit(1);
  }

  try {
    const token = generateToken(userId, jwtSecret);
    
    console.log('\n✅ Token generated successfully!\n');
    
    // Decode to show payload
    const decoded = jwt.decode(token);
    console.log('Token Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n🔑 Full Token:');
    console.log(token);
    
    console.log('\n📋 How to use in n8n:');
    console.log('1. Copy the token above');
    console.log('2. In n8n HTTP Request node, add header:');
    console.log('   Name: Authorization');
    console.log(`   Value: Bearer ${token}`);
    console.log('\n3. Test with curl:');
    console.log(`curl -H "Authorization: Bearer ${token.substring(0, 50)}..." \\`);
    console.log('  "https://receipt-parcer.vercel.app/api/upload-receipt?userId=1&filename=test.jpg"');
    
    console.log('\n⚠️  Security Notes:');
    console.log('- Store this token securely in n8n credentials');
    console.log('- Do NOT commit to version control');
    console.log('- Token expires in 365 days');
    console.log('- Regenerate if compromised');
    
  } catch (error) {
    console.error(`\n❌ Error generating token: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateToken };