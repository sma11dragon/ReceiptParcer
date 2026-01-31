const { Pool } = require('pg');

async function checkRachelBot() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('=== Checking RachelTBot (user_id = 4) ===\n');
    
    // Check users table
    const userResult = await pool.query(`
      SELECT id, username, email, telegram_chat_id, telegram_user_id, 
             telegram_bot_token, telegram_bot_username, is_verified
      FROM users 
      WHERE id = 4 OR username = 'RachelTBot';
    `);
    
    console.log('User record:');
    userResult.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      console.log(`  Telegram Chat ID: ${user.telegram_chat_id}, Telegram User ID: ${user.telegram_user_id}`);
      console.log(`  Bot Token: ${user.telegram_bot_token ? 'EXISTS' : 'MISSING'}`);
      console.log(`  Bot Username: ${user.telegram_bot_username}`);
      console.log(`  Is Verified: ${user.is_verified}`);
    });
    
    // Check user_telegram_bots table
    console.log('\n=== Checking user_telegram_bots table ===');
    const botsResult = await pool.query(`
      SELECT id, bot_username, bot_token, created_at
      FROM user_telegram_bots 
      WHERE bot_token IS NOT NULL;
    `);
    
    console.log(`Found ${botsResult.rows.length} bots in user_telegram_bots table:`);
    botsResult.rows.forEach(bot => {
      console.log(`  - ${bot.bot_username} (Token: ${bot.bot_token.substring(0, 10)}...)`);
    });
    
    // Check if RachelTBot's token exists in user_telegram_bots
    const userToken = userResult.rows[0]?.telegram_bot_token;
    if (userToken) {
      const matchingBot = await pool.query(`
        SELECT * FROM user_telegram_bots WHERE bot_token = $1;
      `, [userToken]);
      
      if (matchingBot.rows.length > 0) {
        console.log(`\n✅ RachelTBot's bot token found in user_telegram_bots table`);
      } else {
        console.log(`\n⚠️ RachelTBot's bot token NOT found in user_telegram_bots table`);
        console.log(`   This means fix_webhook.js won't set webhook for this bot.`);
      }
    }
    
    // Check verification_tokens for RachelTBot
    console.log('\n=== Checking verification_tokens for RachelTBot ===');
    const tokensResult = await pool.query(`
      SELECT id, user_id, token, type, expires_at, telegram_user_id, verified_at
      FROM verification_tokens 
      WHERE user_id = 4 AND type = 'telegram'
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    console.log(`Found ${tokensResult.rows.length} telegram verification tokens:`);
    tokensResult.rows.forEach(token => {
      console.log(`  - Token: ${token.token}, Expires: ${token.expires_at}, Verified: ${token.verified_at}`);
    });
    
    // Check webhook configuration for RachelTBot's bot
    if (userToken) {
      console.log('\n=== Webhook Configuration ===');
      console.log(`Bot Token: ${userToken.substring(0, 10)}...`);
      console.log(`Expected webhook URL: https://n8ntest.daeit.com.sg/webhook/telegram-receipts?bot_token=${userToken}`);
      console.log(`\nTo fix: Run fix_webhook.js after ensuring token is in user_telegram_bots table.`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkRachelBot();