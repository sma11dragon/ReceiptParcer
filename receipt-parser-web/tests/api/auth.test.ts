import request from 'supertest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { testDb, testUsers } from '../setup';

describe('Authentication API Tests', () => {
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUsers.validUser.password, 10);
      await testDb.query(
        'INSERT INTO users (username, email, password_hash, location) VALUES ($1, $2, $3, $4)',
        [testUsers.validUser.username, testUsers.validUser.email, hashedPassword, testUsers.validUser.location]
      );
    });

    test('Happy Path - Valid credentials should login successfully', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(testUsers.validUser.email);
      expect(response.body.user.password_hash).toBeUndefined();
    });

    test('Fix Path - Invalid email should return 401', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUsers.validUser.password
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBeUndefined();
      expect(response.body.error).toBe('Invalid email or password');
    });

    test('Fix Path - Invalid password should return 401', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    test('Edge Path - Missing email should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          password: testUsers.validUser.password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    test('Edge Path - Missing password should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({
          email: testUsers.validUser.email
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    test('Edge Path - Empty request body should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('POST /api/auth/register', () => {
    test('Happy Path - Complete user registration should succeed', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        location: 'Singapore',
        telegram_bot_token: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        telegram_bot_username: 'new_bot'
      };

      // Mock Telegram API verification
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: { username: 'new_bot' } })
        })
      ));

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.password_hash).toBeUndefined();
    });

    test('Fix Path - Registration without bot should succeed', async () => {
      const newUser = {
        username: 'userbotless',
        email: 'botless@example.com',
        password: 'password123',
        location: 'Singapore'
      };

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(newUser.email);
    });

    test('Fix Path - Duplicate email should return error', async () => {
      // Create first user
      await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        ['firstuser', testUsers.validUser.email, await bcrypt.hash('password123', 10)]
      );

      const duplicateUser = {
        username: 'duplicate',
        email: testUsers.validUser.email,
        password: 'password123'
      };

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(response.status).toBe(500); // Assuming database constraint error
      expect(response.body.success).toBeUndefined();
    });

    test('Edge Path - Missing required fields should return 400', async () => {
      const incompleteUser = {
        username: 'incomplete',
        email: 'incomplete@example.com'
        // Missing password
      };

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(incompleteUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    test('Edge Path - Invalid bot token should return error', async () => {
      const invalidBotUser = {
        username: 'invalidbot',
        email: 'invalidbot@example.com',
        password: 'password123',
        telegram_bot_token: 'invalid_token',
        telegram_bot_username: 'invalid_bot'
      };

      // Mock failed Telegram API verification
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ ok: false, description: 'Invalid bot token' })
        })
      ));

      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(invalidBotUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid bot token');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUsers.validUser.password, 10);
      await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        [testUsers.validUser.username, testUsers.validUser.email, hashedPassword]
      );
    });

    test('Happy Path - Valid email should send reset code', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/forgot-password')
        .send({ email: testUsers.validUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verification code');
    });

    test('Fix Path - Non-existent email should still return success (security)', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Don't reveal if email exists or not
    });

    test('Edge Path - Missing email should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email is required');
    });

    test('Edge Path - Invalid email format should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Valid email');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let validToken: string;

    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUsers.validUser.password, 10);
      const userResult = await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [testUsers.validUser.username, testUsers.validUser.email, hashedPassword]
      );
      
      const userId = userResult.rows[0].id;
      validToken = 'test_token_12345';
      
      // Create verification token
      await testDb.query(
        'INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'1 hour\')',
        [userId, validToken, 'email']
      );
    });

    test('Happy Path - Valid token should reset password', async () => {
      const newPassword = 'newpassword123';
      
      const response = await request('http://localhost:3000')
        .post('/api/auth/reset-password')
        .send({
          token: validToken,
          newPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successful');

      // Verify password was changed
      const userResult = await testDb.query('SELECT password_hash FROM users WHERE email = $1', [testUsers.validUser.email]);
      const passwordMatch = await bcrypt.compare(newPassword, userResult.rows[0].password_hash);
      expect(passwordMatch).toBe(true);
    });

    test('Fix Path - Invalid token should return error', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid_token',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    test('Edge Path - Missing token should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/reset-password')
        .send({
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Token and new password are required');
    });

    test('Edge Path - Weak password should return error', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/reset-password')
        .send({
          token: validToken,
          newPassword: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least');
    });
  });
});