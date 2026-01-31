import request from 'supertest';
import { testDb, testUsers, testBots } from '../setup';
import bcrypt from 'bcryptjs';

describe('Telegram Bot Management API Tests', () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testUsers.validUser.password, 10);
    const userResult = await testDb.query(
      'INSERT INTO users (username, email, password_hash, location) VALUES ($1, $2, $3, $4) RETURNING id',
      [testUsers.validUser.username, testUsers.validUser.email, hashedPassword, testUsers.validUser.location]
    );
    testUserId = userResult.rows[0].id;
  });

  describe('GET /api/bots', () => {
    beforeEach(async () => {
      // Create test bots for user
      await testDb.query(
        'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3)',
        [testUserId, testBots.validBot.token, testBots.validBot.username]
      );
    });

    test('Happy Path - Get bots for valid user', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/bots')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bots).toHaveLength(1);
      expect(response.body.bots[0].bot_username).toBe(testBots.validBot.username);
      expect(response.body.bots[0].bot_token).toBeUndefined(); // Token should not be returned
    });

    test('Happy Path - Get bots for user with no bots', async () => {
      // Create another user with no bots
      const newUserResult = await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['nobots', 'nobots@example.com', await bcrypt.hash('password', 10)]
      );

      const response = await request('http://localhost:3000')
        .get('/api/bots')
        .query({ userId: newUserResult.rows[0].id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bots).toHaveLength(0);
    });

    test('Edge Path - Missing userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/bots');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    test('Edge Path - Invalid userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/bots')
        .query({ userId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    test('Fix Path - Non-existent user should return empty array', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/bots')
        .query({ userId: '99999' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bots).toHaveLength(0);
    });
  });

  describe('POST /api/bots', () => {
    test('Happy Path - Add valid bot with successful webhook setup', async () => {
      // Mock successful Telegram API verification
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: { username: 'new_test_bot' } })
        })
      ));

      // Mock successful webhook setup
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: true })
        })
      ));

      const botData = {
        userId: testUserId.toString(),
        botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        botUsername: 'new_test_bot'
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(botData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.bot.bot_username).toBe(botData.botUsername);
      expect(response.body.webhookSet).toBe(true);
    });

    test('Fix Path - Add bot but webhook setup fails', async () => {
      // Mock successful Telegram API verification
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: { username: 'test_bot_webhook_fail' } })
        })
      ));

      // Mock failed webhook setup
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ ok: false, description: 'Webhook setup failed' })
        })
      ));

      const botData = {
        userId: testUserId.toString(),
        botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        botUsername: 'test_bot_webhook_fail'
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(botData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.bot.bot_username).toBe(botData.botUsername);
      expect(response.body.webhookSet).toBe(false);
      expect(response.body.warning).toContain('Webhook setup failed');
    });

    test('Fix Path - Add bot but user already has a bot', async () => {
      // Create existing bot for user
      await testDb.query(
        'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3)',
        [testUserId, testBots.validBot.token, testBots.validBot.username]
      );

      // Mock successful verification
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: { username: 'second_bot' } })
        })
      ));

      const botData = {
        userId: testUserId.toString(),
        botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        botUsername: 'second_bot'
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(botData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.bot.bot_username).toBe(botData.botUsername);
      // Should allow multiple bots per user
    });

    test('Edge Path - Invalid bot token should return 400', async () => {
      // Mock failed Telegram API verification
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ ok: false, description: 'Invalid bot token' })
        })
      ));

      const botData = {
        userId: testUserId.toString(),
        botToken: 'invalid_token',
        botUsername: 'invalid_bot'
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(botData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid bot token');
    });

    test('Edge Path - Missing required fields should return 400', async () => {
      const incompleteData = {
        userId: testUserId.toString(),
        // Missing botToken and botUsername
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    test('Edge Path - Invalid userId should return 400', async () => {
      const botData = {
        userId: 'invalid',
        botToken: testBots.validBot.token,
        botUsername: testBots.validBot.username
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(botData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid user ID');
    });

    test('Edge Path - Non-existent user should return 400', async () => {
      const botData = {
        userId: '99999',
        botToken: testBots.validBot.token,
        botUsername: testBots.validBot.username
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(botData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('User not found');
    });

    test('Edge Path - Duplicate bot token should return error', async () => {
      // Add first bot
      await testDb.query(
        'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3)',
        [testUserId, testBots.validBot.token, testBots.validBot.username]
      );

      // Mock successful verification
      jest.mock('node-fetch', () => jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: { username: 'duplicate_bot' } })
        })
      ));

      const botData = {
        userId: testUserId.toString(),
        botToken: testBots.validBot.token, // Same token
        botUsername: 'duplicate_bot'
      };

      const response = await request('http://localhost:3000')
        .post('/api/bots')
        .send(botData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('duplicate');
    });
  });

  describe('DELETE /api/bots/[id]', () => {
    let botId: number;

    beforeEach(async () => {
      // Create test bot
      const botResult = await testDb.query(
        'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3) RETURNING id',
        [testUserId, testBots.validBot.token, testBots.validBot.username]
      );
      botId = botResult.rows[0].id;
    });

    test('Happy Path - Delete existing bot', async () => {
      const response = await request('http://localhost:3000')
        .delete(`/api/bots/${botId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify bot is deleted
      const deletedBot = await testDb.query('SELECT * FROM user_telegram_bots WHERE id = $1', [botId]);
      expect(deletedBot.rows).toHaveLength(0);
    });

    test('Edge Path - Delete non-existent bot should return 404', async () => {
      const response = await request('http://localhost:3000')
        .delete('/api/bots/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Bot not found');
    });

    test('Edge Path - Invalid bot ID should return 400', async () => {
      const response = await request('http://localhost:3000')
        .delete('/api/bots/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid bot ID');
    });

    test('Fix Path - Delete bot with associated expenses', async () => {
      // Create associated expenses
      await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUserId, botId, '2024-01-15', 'Test Vendor', 10.00, 'Others']
      );

      const response = await request('http://localhost:3000')
        .delete(`/api/bots/${botId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should succeed due to CASCADE delete
    });
  });

  describe('POST /api/telegram/generate-token', () => {
    test('Happy Path - Generate valid verification token', async () => {
      const tokenData = {
        userId: testUserId.toString(),
        type: 'telegram_link'
      };

      const response = await request('http://localhost:3000')
        .post('/api/telegram/generate-token')
        .send(tokenData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();

      // Verify token is stored in database
      const storedToken = await testDb.query(
        'SELECT * FROM verification_tokens WHERE user_id = $1 AND type = $2',
        [testUserId, 'telegram_link']
      );
      expect(storedToken.rows).toHaveLength(1);
      expect(storedToken.rows[0].token).toBe(response.body.token);
    });

    test('Edge Path - Missing userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/telegram/generate-token')
        .send({ type: 'telegram_link' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('User ID is required');
    });

    test('Edge Path - Invalid userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/telegram/generate-token')
        .send({ userId: 'invalid', type: 'telegram_link' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid user ID');
    });

    test('Edge Path - Non-existent user should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/telegram/generate-token')
        .send({ userId: '99999', type: 'telegram_link' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('User not found');
    });

    test('Fix Path - Multiple token requests should invalidate old tokens', async () => {
      // Generate first token
      await request('http://localhost:3000')
        .post('/api/telegram/generate-token')
        .send({ userId: testUserId.toString(), type: 'telegram_link' });

      // Generate second token
      const response = await request('http://localhost:3000')
        .post('/api/telegram/generate-token')
        .send({ userId: testUserId.toString(), type: 'telegram_link' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify only one active token exists
      const activeTokens = await testDb.query(
        'SELECT COUNT(*) FROM verification_tokens WHERE user_id = $1 AND type = $2 AND expires_at > NOW()',
        [testUserId, 'telegram_link']
      );
      expect(parseInt(activeTokens.rows[0].count)).toBe(1);
    });

    test('Edge Path - Invalid token type should return 400', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/telegram/generate-token')
        .send({ userId: testUserId.toString(), type: 'invalid_type' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid token type');
    });
  });
});