#!/usr/bin/env node

/**
 * Generate bcrypt hash for n8n service account password
 * 
 * Usage:
 *   node generate-password-hash.js [password]
 * 
 * If no password provided, generates a random secure password
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function generateHash(password = null) {
  console.log('🔐 Generating Password Hash for n8n Service Account\n');
  
  // Generate or use provided password
  let actualPassword;
  if (password) {
    actualPassword = password;
    console.log(`Using provided password: ${password}`);
  } else {
    actualPassword = crypto.randomBytes(16).toString('hex');
    console.log(`Generated secure password: ${actualPassword}`);
    console.log('⚠️  Save this password securely! It will not be shown again.\n');
  }
  
  // Generate bcrypt hash with cost 12 (recommended)
  console.log('Generating bcrypt hash (cost: 12)...');
  const hash = await bcrypt.hash(actualPassword, 12);
  
  console.log('\n✅ Hash generated successfully!\n');
  console.log('📋 Copy this hash to your SQL:');
  console.log('='.repeat(50));
  console.log(hash);
  console.log('='.repeat(50));
  
  console.log('\n📝 SQL INSERT command (replace YOUR_HASH with above):');
  console.log(`
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  is_verified, 
  location
) VALUES (
  'n8n-service',
  'n8n-service@receiptai.com',
  '${hash}',
  true,
  'Automation'
) RETURNING id;
  `);
  
  console.log('\n💡 Next steps:');
  console.log('1. Run the SQL in your database client (pgAdmin/DBeaver)');
  console.log('2. Note the returned user ID');
  console.log('3. Use that ID to generate JWT token');
  
  if (!password) {
    console.log('\n🔒 Generated password (save this):');
    console.log(actualPassword);
  }
}

// Run if called directly
if (require.main === module) {
  const password = process.argv[2];
  generateHash(password).catch(console.error);
}

module.exports = { generateHash };