import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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
            console.log(`Webhook set successfully for bot token: ${botToken.substring(0, 10)}...`);
            return { success: true };
        } else {
            return { success: false, error: data.description || 'Failed to set webhook' };
        }
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return { success: false, error: 'Failed to connect to Telegram' };
    }
}

// GET /api/bots?userId=...
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const botsResult = await pool.query(
            'SELECT id, bot_username, is_active, created_at FROM user_telegram_bots WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return NextResponse.json({
            success: true,
            bots: botsResult.rows
        });
    } catch (error) {
        console.error('Get Bots Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/bots
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, token } = body;

        if (!userId || !token) {
            return NextResponse.json({ error: 'User ID and Token are required' }, { status: 400 });
        }

        // 1. Verify token with Telegram
        const telegramRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const telegramData = await telegramRes.json();

        if (!telegramData.ok) {
            return NextResponse.json({ error: 'Invalid Telegram Bot Token' }, { status: 400 });
        }

        // Bot username without @ prefix for consistency
        const botUsername = telegramData.result.username;

        // 2. Set up Telegram webhook to receive messages
        const webhookResult = await setupTelegramWebhook(token);

        if (!webhookResult.success) {
            console.warn('Webhook setup failed:', webhookResult.error);
            // Continue with registration but warn the user
        }

        // 3. Save to user_telegram_bots table
        const insertResult = await pool.query(
            'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3) RETURNING id',
            [userId, token, botUsername]
        );

        // 4. Also update the users table with primary bot info if not set
        await pool.query(
            `UPDATE users
             SET telegram_bot_token = COALESCE(telegram_bot_token, $1),
                 telegram_bot_username = COALESCE(telegram_bot_username, $2)
             WHERE id = $3`,
            [token, botUsername, userId]
        );

        return NextResponse.json({
            success: true,
            bot: {
                id: insertResult.rows[0].id,
                bot_username: botUsername
            },
            webhookSetup: {
                success: webhookResult.success,
                error: webhookResult.error
            }
        });
    } catch (error) {
        console.error('Add Bot Error:', error);
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') { // Unique violation
            return NextResponse.json({ error: 'This bot token is already registered' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
