#!/usr/bin/env node

/**
 * Check database connection and list users
 */

const { Pool } = require('pg');

async function checkDatabase() {
  console.log('🔍 Checking Database Connection\n');
  
  // Try different connection strings
  const connectionStrings = [
    process.env.DATABASE_URL,
    'postgresql://root:112233_root@localhost:2665/sma11dragon_DB',
    'postgresql://root:112233_root@127.0.0.1:2665/sma11dragon_DB'
  ];
  
  let pool = null;
  let connected = false;
  
  for (const connectionString of connectionStrings) {
    if (!connectionString) continue;
    
    console.log(`Trying: ${connectionString.replace(/:[^:]*@/, ':*****@')}`);
    
    try {
      pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 5000
      });
      
      const client = await pool.connect();
      console.log('✅ Connected successfully!\n');
      
      // Check users table
      console.log('📋 Checking users table...');
      const usersResult = await client.query('SELECT id, username, email, is_verified FROM users ORDER BY id');
      
      console.log(`Found ${usersResult.rows.length} users:`);
      console.log('ID | Username | Email | Verified');
      console.log('---|----------|-------|---------');
      usersResult.rows.forEach(user => {
        console.log(`${user.id} | ${user.username || 'N/A'} | ${user.email} | ${user.is_verified}`);
      });
      
      // Check if n8n service account exists
      const n8nUser = usersResult.rows.find(u => u.email === 'n8n-service@receiptai.com');
      if (n8nUser) {
        console.log(`\n✅ n8n service account found: ID = ${n8nUser.id}`);
      } else {
        console.log('\n❌ n8n service account not found');
      }
      
      // Check expenses table (to verify data exists)
      console.log('\n📊 Checking expenses table...');
      const expensesResult = await client.query('SELECT COUNT(*) as count FROM expenses');
      console.log(`Total expenses: ${expensesResult.rows[0].count}`);
      
      client.release();
      connected = true;
      break;
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}\n`);
      if (pool) {
        await pool.end();
      }
    }
  }
  
  if (!connected) {
    console.log('💡 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check if port 2665 is correct');
    console.log('3. Verify username/password');
    console.log('4. Check firewall settings');
    console.log('5. Try connecting with psql: psql -h localhost -p 2665 -U root -d sma11dragon_DB');
  }
  
  if (pool) {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabase().catch(console.error);
}

module.exports = { checkDatabase };