import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, name, sub: _googleId } = payload;

        // Check if user exists
        const userResult = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        let user;

        if (userResult.rows.length > 0) {
            // User exists
            user = userResult.rows[0];

            // Optional: Update google_id if not set (linking accounts)
            // if (!user.google_id) { ... }
        } else {
            // Create new user (Auto-registration)
            // Generate a random password for security (user can reset later if they want to use password login)
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            const passwordHash = await bcrypt.hash(randomPassword, 10);

            // Default location
            const location = 'Unknown';

            const newUserResult = await pool.query(
                'INSERT INTO users (username, email, password_hash, location, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
                [name || email.split('@')[0], email, passwordHash, location]
            );

            user = newUserResult.rows[0];
        }

        // Remove password hash before sending back
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
