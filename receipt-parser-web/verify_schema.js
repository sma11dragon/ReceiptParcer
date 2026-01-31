const { Pool } = require('pg');

const pool = new Pool({
    host: '172.19.0.2',
    port: 5432,
    user: 'root',
    password: '112233_root',
    database: 'sma11dragon_DB',
});

async function verify() {
    try {
        console.log('🔍 Verifying Database Schema...\n');

        // Check telegram columns
        const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name LIKE 'telegram%'
      ORDER BY ordinal_position;
    `);

        console.log('✅ Telegram columns in users table:');
        console.table(columns.rows);

        // Check RachelTan
        const rachel = await pool.query(`
      SELECT id, username, telegram_chat_id, telegram_user_id, telegram_bot_username
      FROM users
      WHERE username = 'RachelTan';
    `);

        console.log('\n📋 RachelTan\'s record:');
        if (rachel.rows.length > 0) {
            console.table(rachel.rows);

            const user = rachel.rows[0];
            if (user.telegram_chat_id === null && user.telegram_user_id === null) {
                console.log('\n⚠️  telegram_chat_id and telegram_user_id are NULL (expected before first bot interaction)');
            }
        } else {
            console.log('❌ RachelTan not found');
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verify();
