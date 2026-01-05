import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { username, email, password, location } = await request.json();

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

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert User
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password_hash, location) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email`,
            [username, email, passwordHash, location || null]
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
