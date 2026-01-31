const { Pool } = require('pg');

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://root:postgres@localhost:5432/postgres'
  });

  try {
    console.log('=== DATABASE STATE CHECK ===\n');

    // Check users table structure
    console.log('1. Checking users table...');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    console.log('Users table columns:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check verification_tokens table structure
    console.log('\n2. Checking verification_tokens table...');
    const tokenColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'verification_tokens' 
      ORDER BY ordinal_position;
    `);
    console.log('Verification tokens table columns:');
    tokenColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check sample data
    console.log('\n3. Checking sample users (first 5)...');
    const users = await pool.query('SELECT id, username, email, telegram_chat_id, telegram_user_id, telegram_bot_token FROM users LIMIT 5;');
    console.log('Sample users:');
    users.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      console.log(`    Telegram Chat ID: ${user.telegram_chat_id}, Telegram User ID: ${user.telegram_user_id}`);
      console.log(`    Has Bot Token: ${!!user.telegram_bot_token}`);
    });

    // Check verification_tokens sample data
    console.log('\n4. Checking verification_tokens (first 5)...');
    const tokens = await pool.query(`
      SELECT id, user_id, token, type, expires_at, telegram_user_id, telegram_username, verified_at 
      FROM verification_tokens 
      WHERE type = 'telegram' 
      LIMIT 5;
    `);
    console.log('Telegram verification tokens:');
    tokens.rows.forEach(token => {
      console.log(`  - ID: ${token.id}, User ID: ${token.user_id}, Token: ${token.token}`);
      console.log(`    Type: ${token.type}, Expires: ${token.expires_at}`);
      console.log(`    Telegram User ID: ${token.telegram_user_id}, Verified: ${token.verified_at}`);
    });

    // Check user count with vs without telegram_chat_id
    console.log('\n5. User statistics:');
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN telegram_chat_id IS NOT NULL THEN 1 END) as users_with_chat_id,
        COUNT(CASE WHEN telegram_user_id IS NOT NULL THEN 1 END) as users_with_user_id,
        COUNT(CASE WHEN telegram_bot_token IS NOT NULL THEN 1 END) as users_with_bot_token
      FROM users;
    `);
    console.log(`  Total users: ${stats.rows[0].total_users}`);
    console.log(`  Users with telegram_chat_id: ${stats.rows[0].users_with_chat_id}`);
    console.log(`  Users with telegram_user_id: ${stats.rows[0].users_with_user_id}`);
    console.log(`  Users with telegram_bot_token: ${stats.rows[0].users_with_bot_token}`);

    // Check latest verification tokens
    console.log('\n6. Latest telegram verification tokens (last 10):');
    const latestTokens = await pool.query(`
      SELECT 
        vt.id, vt.user_id, vt.token, vt.expires_at, 
        vt.telegram_user_id, vt.telegram_username, vt.verified_at,
        u.username, u.telegram_chat_id, u.telegram_user_id as user_telegram_user_id
      FROM verification_tokens vt
      LEFT JOIN users u ON vt.user_id = u.id
      WHERE vt.type = 'telegram'
      ORDER BY vt.created_at DESC
      LIMIT 10;
    `);
    console.log('Latest telegram tokens and user associations:');
    latestTokens.rows.forEach(row => {
      console.log(`  - Token ID: ${row.id}, User: ${row.username} (ID: ${row.user_id})`);
      console.log(`    Token: ${row.token}, Expires: ${row.expires_at}`);
      console.log(`    Token Telegram User ID: ${row.telegram_user_id}, User Telegram User ID: ${row.user_telegram_user_id}`);
      console.log(`    User Telegram Chat ID: ${row.telegram_chat_id}, Verified At: ${row.verified_at}`);
    });

  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();