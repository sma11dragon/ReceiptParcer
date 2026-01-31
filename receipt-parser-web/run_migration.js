const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
    host: '172.19.0.2',
    port: 5432,
    user: 'root',
    password: '112233_root',
    database: 'sma11dragon_DB',
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Running database migration...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'db', 'migration_add_telegram_user_id.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!\n');

        // Verify the changes
        console.log('📋 Verifying schema changes...\n');
        const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name IN ('telegram_user_id', 'telegram_chat_id', 'telegram_bot_username', 'telegram_bot_token')
      ORDER BY ordinal_position;
    `);

        console.log('User table Telegram columns:');
        console.table(verifyResult.rows);

        // Check indexes
        const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
        AND indexname LIKE '%telegram%';
    `);

        console.log('\nTelegram-related indexes:');
        console.table(indexResult.rows);

        // Check RachelTan's record
        console.log('\n🔍 Checking RachelTan\'s record...\n');
        const rachelResult = await client.query(`
      SELECT id, username, telegram_chat_id, telegram_user_id, telegram_bot_username, telegram_bot_token
      FROM users
      WHERE username = 'RachelTan';
    `);

        if (rachelResult.rows.length > 0) {
            console.log('RachelTan\'s record:');
            console.table(rachelResult.rows);
        } else {
            console.log('❌ RachelTan not found in database');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
