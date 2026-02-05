import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// Helper function to set up Telegram webhook
async function setupTelegramWebhook(botToken: string): Promise<{ success: boolean; error?: string }> {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('N8N_WEBHOOK_URL not configured');
        return { success: false, error: 'Webhook URL not configured' };
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: `${webhookUrl}?bot_token=${botToken}` }),
        });

        const data = await response.json();

        if (data.ok) {
            return { success: true };
        } else {
            return { success: false, error: data.description || 'Failed to set webhook' };
        }
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return { success: false, error: 'Failed to connect to Telegram' };
    }
}

export async function POST(request: Request) {
    try {
        const { username, email, password, location, botUsername, botToken } = await request.json();

        // Basic Validation
        if (!username || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userCheck.rows.length > 0) {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 409 }
            );
        }

        // If bot token provided, validate and set up webhook
        // Make this optional - allow registration even if webhook setup fails
        let webhookSetupSuccess = false;
        let webhookError = null;
        let cleanBotUsername = botUsername;

        if (botToken) {
            // Verify token with Telegram first
            try {
                const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
                const telegramData = await telegramRes.json();

                if (telegramData.ok) {
                    // Use the actual username from Telegram (without @)
                    cleanBotUsername = telegramData.result.username;
                }
            } catch (error) {
                console.warn('Failed to verify bot token with Telegram:', error);
            }

            // Set up webhook
            const webhookResult = await setupTelegramWebhook(botToken);
            webhookSetupSuccess = webhookResult.success;
            webhookError = webhookResult.error;

            // Log the error but don't block registration
            if (!webhookResult.success) {
                console.warn('Webhook setup failed during registration:', webhookResult.error);
            }
        }

        // Clean bot username - remove @ prefix if present
        if (cleanBotUsername && cleanBotUsername.startsWith('@')) {
            cleanBotUsername = cleanBotUsername.substring(1);
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert User with bot credentials
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password_hash, location, telegram_bot_username, telegram_bot_token)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, username, email, telegram_bot_username`,
            [username, email, passwordHash, location || null, cleanBotUsername || null, botToken || null]
        );

        const userId = newUser.rows[0].id;

        // Also insert into user_telegram_bots table for multi-bot support
        if (botToken && cleanBotUsername) {
            try {
                await pool.query(
                    'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3)',
                    [userId, botToken, cleanBotUsername]
                );
            } catch (error) {
                // Ignore duplicate key errors - bot might already be registered
                if (error instanceof Error && 'code' in error && (error as { code: string }).code !== '23505') {
                    console.warn('Failed to insert into user_telegram_bots:', error);
                }
            }
        }

        return NextResponse.json(
            {
                message: 'User registered successfully',
                user: newUser.rows[0],
                webhookSetup: {
                    attempted: !!botToken,
                    success: webhookSetupSuccess,
                    error: webhookError
                }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
