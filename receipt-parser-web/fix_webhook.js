const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const https = require('https');

// 1. Get Environment Variables
function getEnvVars() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');

    const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
    const webhookMatch = envContent.match(/N8N_WEBHOOK_URL=(.+)/);

    return {
        databaseUrl: dbMatch ? dbMatch[1].trim().replace(/^["'](.+)["']$/, '$1') : process.env.DATABASE_URL,
        webhookUrl: webhookMatch ? webhookMatch[1].trim().replace(/^["'](.+)["']$/, '$1') : process.env.N8N_WEBHOOK_URL
    };
}

async function setWebhook(token, url) {
    return new Promise((resolve, reject) => {
        const req = https.request(`https://api.telegram.org/bot${token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
        // Include bot_token as query parameter
        req.write(JSON.stringify({ url: `${url}?bot_token=${token}` }));
        req.end();
    });
}

async function fixWebhook() {
    const { databaseUrl, webhookUrl } = getEnvVars();

    if (!databaseUrl || !webhookUrl) {
        console.error('Missing configuration:', { databaseUrl: !!databaseUrl, webhookUrl });
        process.exit(1);
    }

    console.log(`Target Webhook URL: ${webhookUrl}`);

    const pool = new Pool({ connectionString: databaseUrl });

    try {
        // Get ALL bots from user_telegram_bots table
        const res = await pool.query(
            "SELECT id, bot_username, bot_token FROM user_telegram_bots WHERE bot_token IS NOT NULL"
        );

        if (res.rows.length === 0) {
            console.error('No bots found in database.');
            return;
        }

        console.log(`Found ${res.rows.length} bots. Updating webhooks...`);

        for (const bot of res.rows) {
            const token = bot.bot_token;
            console.log(`\nProcessing bot: ${bot.bot_username} (${token.substring(0, 10)}...)`);

            try {
                // Set Webhook with bot_token query parameter
                const result = await setWebhook(token, webhookUrl);

                if (result.ok) {
                    console.log(`✅ Webhook updated successfully for ${bot.bot_username}`);
                } else {
                    console.error(`❌ Failed to set webhook for ${bot.bot_username}:`, result.description);
                }
            } catch (err) {
                console.error(`❌ Error setting webhook for ${bot.bot_username}:`, err.message);
            }
        }

        console.log('\n✅ All webhooks processed!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fixWebhook();
