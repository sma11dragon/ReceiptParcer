const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function getDatabaseUrl() {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        if (match) return match[1].trim().replace(/^["'](.+)["']$/, '$1');
    }
    return process.env.DATABASE_URL;
}

async function checkTokens() {
    const databaseUrl = await getDatabaseUrl();
    if (!databaseUrl) {
        console.error('DATABASE_URL not found');
        return;
    }
    
    const pool = new Pool({ connectionString: databaseUrl });
    
    try {
        console.log('--- VERIFICATION TOKENS FOR USER 6 ---');
        const result = await pool.query(`
            SELECT id, user_id, token, type, telegram_user_id, telegram_username, verified_at, expires_at
            FROM verification_tokens 
            WHERE user_id = 6
            ORDER BY created_at DESC
        `);
        
        if (result.rows.length === 0) {
            console.log('No verification tokens found for user 6');
            // Check if there are any tokens at all
            const all = await pool.query('SELECT COUNT(*) as count FROM verification_tokens');
            console.log(`Total verification tokens in DB: ${all.rows[0].count}`);
        } else {
            console.table(result.rows);
        }
        
        // Also check if there are any tokens with type 'telegram' that are not expired
        const activeTokens = await pool.query(`
            SELECT * FROM verification_tokens 
            WHERE type = 'telegram' 
              AND expires_at > NOW() 
              AND verified_at IS NULL
            ORDER BY expires_at DESC
        `);
        console.log('\n--- ACTIVE TELEGRAM TOKENS (unverified) ---');
        if (activeTokens.rows.length === 0) {
            console.log('No active unverified Telegram tokens');
        } else {
            console.table(activeTokens.rows);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTokens();