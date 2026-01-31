const { Pool } = require('pg');
const fs = require('fs').promises;

async function applyFix() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Applying Telegram Chat ID fix functions...\n');
    
    // Read the SQL file
    const sql = await fs.readFile('fix_telegram_chat_id.sql', 'utf8');
    
    // Extract function definitions (simplified approach)
    // We'll execute the entire file since it's PL/pgSQL with dollar quoting
    // But we need to split carefully
    
    console.log('Creating update_user_telegram_ids function...');
    const func1 = `
CREATE OR REPLACE FUNCTION update_user_telegram_ids(
    p_token VARCHAR(64),
    p_telegram_user_id BIGINT,
    p_telegram_username VARCHAR(255),
    p_telegram_chat_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Get user_id from token
    SELECT vt.user_id INTO v_user_id
    FROM verification_tokens vt
    WHERE vt.token = p_token 
      AND vt.type = 'telegram'
      AND vt.expires_at > NOW();
    
    IF v_user_id IS NULL THEN
        RETURN 0; -- Token not found or expired
    END IF;
    
    -- Update verification_tokens
    UPDATE verification_tokens
    SET 
        telegram_user_id = p_telegram_user_id,
        telegram_username = p_telegram_username,
        verified_at = NOW()
    WHERE token = p_token;
    
    -- Update users table
    UPDATE users
    SET 
        telegram_user_id = p_telegram_user_id,
        telegram_chat_id = p_telegram_chat_id,
        is_verified = true
    WHERE id = v_user_id;
    
    RETURN 1; -- Success
END;
$$ LANGUAGE plpgsql;
    `;
    
    await pool.query(func1);
    console.log('✓ update_user_telegram_ids function created\n');
    
    console.log('Creating get_user_by_bot_token_or_chat_id function...');
    const func2 = `
CREATE OR REPLACE FUNCTION get_user_by_bot_token_or_chat_id(
    p_bot_token VARCHAR(100),
    p_chat_id BIGINT
) RETURNS TABLE(
    user_id INTEGER,
    telegram_bot_token VARCHAR(100),
    telegram_bot_username VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.telegram_bot_token,
        u.telegram_bot_username
    FROM users u
    WHERE (u.telegram_chat_id = p_chat_id OR u.telegram_bot_token = p_bot_token)
      AND u.telegram_bot_token IS NOT NULL
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
    `;
    
    await pool.query(func2);
    console.log('✓ get_user_by_bot_token_or_chat_id function created\n');
    
    // Test the functions
    console.log('Testing functions...');
    
    // Test get_user_by_bot_token_or_chat_id
    const testUsers = await pool.query(`
      SELECT * FROM users WHERE telegram_bot_token IS NOT NULL LIMIT 3;
    `);
    
    for (const user of testUsers.rows) {
      console.log(`\nTesting with user: ${user.username} (ID: ${user.id})`);
      const funcResult = await pool.query(
        `SELECT * FROM get_user_by_bot_token_or_chat_id($1, $2)`,
        [user.telegram_bot_token, user.telegram_chat_id]
      );
      
      if (funcResult.rows.length > 0) {
        console.log(`  ✓ Function returned user ID: ${funcResult.rows[0].user_id}`);
      } else {
        console.log(`  ✗ Function returned no results`);
      }
    }
    
    // Show current state
    console.log('\n=== Current Database State ===');
    const usersWithoutChatId = await pool.query(`
      SELECT id, username, email, telegram_chat_id, telegram_user_id 
      FROM users 
      WHERE telegram_chat_id IS NULL AND telegram_bot_token IS NOT NULL;
    `);
    
    console.log('\nUsers with bot token but no telegram_chat_id:');
    usersWithoutChatId.rows.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user.id}, Email: ${user.email})`);
    });
    
    console.log('\n✅ SQL functions applied successfully!');
    
  } catch (error) {
    console.error('Error applying fix:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

applyFix().catch(console.error);