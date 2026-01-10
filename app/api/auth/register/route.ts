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
            body: JSON.stringify({ url: webhookUrl }),
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
        if (botToken) {
            const webhookResult = await setupTelegramWebhook(botToken);
            if (!webhookResult.success) {
                return NextResponse.json(
                    { message: `Invalid bot token: ${webhookResult.error}` },
                    { status: 400 }
                );
            }
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert User with bot credentials
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password_hash, location, telegram_bot_username, telegram_bot_token)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, username, email, telegram_bot_username`,
            [username, email, passwordHash, location || null, botUsername || null, botToken || null]
        );

        return NextResponse.json(
            { message: 'User registered successfully', user: newUser.rows[0] },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
