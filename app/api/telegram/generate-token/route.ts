import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Generate a unique 8-character token
        const token = randomBytes(4).toString('hex').toUpperCase();

        // Delete any existing tokens for this user
        await pool.query(
            'DELETE FROM verification_tokens WHERE user_id = $1',
            [userId]
        );

        // Insert new token (expires in 24 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await pool.query(
            'INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, token, 'telegram', expiresAt]
        );

        return NextResponse.json({
            success: true,
            token: token
        });

    } catch (error) {
        console.error('Token Generation Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}