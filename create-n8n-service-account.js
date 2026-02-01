// Create n8n service account
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://root:112233_root@localhost:2665/sma11dragon_DB',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function createServiceAccount() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating n8n service account...');
    
    // Check if service account already exists
    const checkResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['n8n-service@receiptai.com']
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`Service account already exists with ID: ${checkResult.rows[0].id}`);
      return checkResult.rows[0];
    }
    
    // Generate secure password
    const password = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create service account user
    const insertResult = await client.query(
      `INSERT INTO users (username, email, password_hash, is_verified, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email`,
      ['n8n-service', 'n8n-service@receiptai.com', passwordHash, true, 'Automation']
    );
    
    const user = insertResult.rows[0];
    
    console.log('\n✅ Service account created successfully!');
    console.log(`User ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Generated password: ${password}`);
    console.log('\n⚠️  Save this password securely! It will not be shown again.');
    
    await client.query('COMMIT');
    return user;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating service account:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Generate JWT token for the service account
function generateServiceAccountToken(userId) {
  // This is a simplified version - in production, use the actual auth library
  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret || jwtSecret === 'your_jwt_secret_key_here_minimum_32_chars') {
    throw new Error('JWT_SECRET not set or using default value. Set a secure JWT_SECRET in environment variables.');
  }
  
  const token = jwt.sign(
    {
      id: userId,
      email: 'n8n-service@receiptai.com',
      role: 'service',
      iss: 'receiptai-n8n-service'
    },
    jwtSecret,
    { expiresIn: '365d' } // Long-lived token for automation
  );
  
  return token;
}

async function main() {
  try {
    console.log('=== n8n Service Account Setup ===\n');
    
    // Create service account
    const user = await createServiceAccount();
    
    // Generate JWT token
    console.log('\n=== Generating JWT Token ===');
    try {
      const token = generateServiceAccountToken(user.id);
      console.log(`✅ JWT Token generated successfully!`);
      console.log(`Token: ${token}`);
      console.log(`\nAdd this token to n8n workflow as Authorization header:`);
      console.log(`Authorization: Bearer ${token}`);
    } catch (tokenError) {
      console.log(`⚠️  Could not generate JWT token: ${tokenError.message}`);
      console.log(`Please set JWT_SECRET environment variable with a secure value.`);
    }
    
    console.log('\n=== Next Steps ===');
    console.log('1. Update n8n workflow to include Authorization header');
    console.log('2. Test the API with the new token');
    console.log('3. Update all n8n workflows that call the API');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createServiceAccount, generateServiceAccountToken };