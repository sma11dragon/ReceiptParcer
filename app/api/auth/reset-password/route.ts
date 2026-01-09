import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, otp, newPassword } = body;

        // Validate input
        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { error: 'Email, OTP, and new password are required' },
                { status: 400 }
            );
        }

        // Validate password length
        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Find user by email
        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Invalid email or OTP' },
                { status: 400 }
            );
        }

        const user = userResult.rows[0];

        // Find valid OTP
        const otpResult = await pool.query(
            `SELECT * FROM password_resets
             WHERE user_id = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()`,
            [user.id, otp]
        );

        if (otpResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP. Please request a new one.' },
                { status: 400 }
            );
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update user password
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [passwordHash, user.id]
        );

        // Mark OTP as used
        await pool.query(
            'UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND otp = $2',
            [user.id, otp]
        );

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
