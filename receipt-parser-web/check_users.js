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

async function checkUsers() {
    const databaseUrl = await getDatabaseUrl();
    if (!databaseUrl) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: databaseUrl });

    try {
        console.log('--- CHECKING USERS ---');
        const users = await pool.query("SELECT id, username, email, telegram_chat_id, telegram_user_id, telegram_bot_username FROM users");
        console.log(users.rows);

        console.log('\n--- CHECKING BOTS ---');
        const bots = await pool.query("SELECT * FROM user_telegram_bots");
        console.log(bots.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkUsers();
