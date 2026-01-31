
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function getDatabaseUrl() {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        if (match) return match[1].trim().replace(/^["'](.+)["']$/, '$1');
    }
    return process.env.DATABASE_URL;
}

async function runDiagnostics() {
    const databaseUrl = await getDatabaseUrl();
    if (!databaseUrl) {
        console.error('DATABASE_URL not found in .env.local or process.env');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: databaseUrl });

    try {
        console.log('--- DATABASE DIAGNOSTICS ---');

        // 1. Check Tables
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tableNames = tables.rows.map(r => r.table_name);
        console.log('Existing Tables:', tableNames);

        // 2. Check user_telegram_bots
        if (tableNames.includes('user_telegram_bots')) {
            console.log('✅ user_telegram_bots exists.');
            const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_telegram_bots'");
            console.log('Columns:', cols.rows);
        } else {
            console.log('❌ user_telegram_bots DOES NOT EXIST. Creating...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_telegram_bots (
                  id SERIAL PRIMARY KEY,
                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                  bot_token TEXT UNIQUE NOT NULL,
                  bot_username TEXT,
                  is_active BOOLEAN DEFAULT TRUE,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Table created.');
        }

        // 3. Check expenses
        if (tableNames.includes('expenses')) {
            const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'expenses'");
            const hasBotId = cols.rows.some(r => r.column_name === 'bot_id');
            if (!hasBotId) {
                console.log('Attempting to add bot_id to expenses...');
                await pool.query('ALTER TABLE expenses ADD COLUMN bot_id INTEGER REFERENCES user_telegram_bots(id)');
                console.log('✅ bot_id added.');
            } else {
                console.log('✅ bot_id column exists in expenses.');
            }
        }

    } catch (err) {
        console.error('Diagnostics Error:', err);
    } finally {
        await pool.end();
    }
}

runDiagnostics();
