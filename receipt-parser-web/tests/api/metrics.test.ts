import request from 'supertest';
import { testDb, testUsers, testExpenses, testBots } from '../setup';
import bcrypt from 'bcryptjs';

describe('Metrics API Tests', () => {
  let testUserId: number;
  let testBotId: number;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testUsers.validUser.password, 10);
    const userResult = await testDb.query(
      'INSERT INTO users (username, email, password_hash, location) VALUES ($1, $2, $3, $4) RETURNING id',
      [testUsers.validUser.username, testUsers.validUser.email, hashedPassword, testUsers.validUser.location]
    );
    testUserId = userResult.rows[0].id;

    // Create test bot
    const botResult = await testDb.query(
      'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3) RETURNING id',
      [testUserId, testBots.validBot.token, testBots.validBot.username]
    );
    testBotId = botResult.rows[0].id;

    // Insert test expenses for metrics
    const testExpensesData = [
      {
        date: '2024-01-15',
        vendor: 'Starbucks',
        amount: 5.40,
        category: 'Food & Beverage'
      },
      {
        date: '2024-01-16',
        vendor: 'Shell Station',
        amount: 45.00,
        category: 'Transportation'
      },
      {
        date: '2024-01-17',
        vendor: '7-Eleven',
        amount: 12.80,
        category: 'Food & Beverage'
      },
      {
        date: '2024-02-15',
        vendor: 'H&M',
        amount: 89.90,
        category: 'Shopping'
      },
      {
        date: '2024-02-16',
        vendor: 'McDonald\'s',
        amount: 8.50,
        category: 'Food & Beverage'
      }
    ];

    for (const expense of testExpensesData) {
      await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUserId, testBotId, expense.date, expense.vendor, expense.amount, expense.category]
      );
    }
  });

  describe('GET /api/metrics', () => {
    test('Happy Path - Get comprehensive metrics for valid user', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify total spending
      expect(response.body.data.totalSpending).toBe(161.60); // Sum of all expenses
      
      // Verify category breakdown
      expect(response.body.data.categoryBreakdown['Food & Beverage']).toBe(26.70); // 5.40 + 12.80 + 8.50
      expect(response.body.data.categoryBreakdown['Transportation']).toBe(45.00);
      expect(response.body.data.categoryBreakdown['Shopping']).toBe(89.90);
      
      // Verify trends
      expect(response.body.data.trends.monthly).toBeDefined();
      expect(response.body.data.trends.category).toBeDefined();
      expect(response.body.data.trends.bot).toBeDefined();
      
      // Verify insights
      expect(response.body.data.insights).toBeDefined();
      expect(Array.isArray(response.body.data.insights)).toBe(true);
    });

    test('Happy Path - Get metrics with date filtering', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({
          userId: testUserId.toString(),
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should only include January expenses
      expect(response.body.data.totalSpending).toBe(63.20); // 5.40 + 45.00 + 12.80
    });

    test('Happy Path - Get metrics with category filtering', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({
          userId: testUserId.toString(),
          category: 'Food & Beverage'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should only include Food & Beverage expenses
      expect(response.body.data.totalSpending).toBe(26.70);
      expect(Object.keys(response.body.data.categoryBreakdown)).toHaveLength(1);
      expect(response.body.data.categoryBreakdown['Food & Beverage']).toBe(26.70);
    });

    test('Happy Path - Get metrics with bot filtering', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({
          userId: testUserId.toString(),
          botId: testBotId.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSpending).toBe(161.60);
    });

    test('Happy Path - Get metrics with different time periods', async () => {
      const periods = ['daily', 'weekly', 'monthly', 'yearly'];
      
      for (const period of periods) {
        const response = await request('http://localhost:3000')
          .get('/api/metrics')
          .query({
            userId: testUserId.toString(),
            period: period
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.trends).toBeDefined();
      }
    });

    test('Fix Path - Get metrics for user with no expenses', async () => {
      // Create another user with no expenses
      const newUserResult = await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['noexpenses', 'noexpenses@example.com', await bcrypt.hash('password', 10)]
      );

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: newUserResult.rows[0].id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSpending).toBe(0);
      expect(Object.keys(response.body.data.categoryBreakdown)).toHaveLength(0);
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.insights).toBeDefined();
    });

    test('Fix Path - Get metrics with single category', async () => {
      // Add expenses only in one category
      await testDb.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
      
      await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUserId, testBotId, '2024-01-15', 'Single Vendor', 25.00, 'Single Category']
      );

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSpending).toBe(25.00);
      expect(Object.keys(response.body.data.categoryBreakdown)).toHaveLength(1);
      expect(response.body.data.categoryBreakdown['Single Category']).toBe(25.00);
    });

    test('Edge Path - Missing userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    test('Edge Path - Invalid userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    test('Edge Path - Non-existent user should return empty metrics', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: '99999' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSpending).toBe(0);
    });

    test('Edge Path - Invalid date format should be handled gracefully', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({
          userId: testUserId.toString(),
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should default to all-time metrics
    });

    test('Edge Path - Invalid period should default to monthly', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({
          userId: testUserId.toString(),
          period: 'invalid-period'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should default to monthly trends
    });

    test('Edge Path - SQL injection attempts should be handled safely', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({
          userId: testUserId.toString(),
          category: 'Food & Beverage; DROP TABLE expenses; --'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should handle injection attempt safely
    });
  });

  describe('Metrics Calculation Accuracy', () => {
    test('Happy Path - Verify total spending calculation accuracy', async () => {
      // Clear and add precise test data
      await testDb.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
      
      const preciseExpenses = [
        { date: '2024-01-15', vendor: 'Test1', amount: 10.01, category: 'A' },
        { date: '2024-01-16', vendor: 'Test2', amount: 20.02, category: 'B' },
        { date: '2024-01-17', vendor: 'Test3', amount: 30.03, category: 'A' }
      ];

      for (const expense of preciseExpenses) {
        await testDb.query(
          'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
          [testUserId, testBotId, expense.date, expense.vendor, expense.amount, expense.category]
        );
      }

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.totalSpending).toBe(60.06); // 10.01 + 20.02 + 30.03
      expect(response.body.data.categoryBreakdown['A']).toBe(40.04); // 10.01 + 30.03
      expect(response.body.data.categoryBreakdown['B']).toBe(20.02);
    });

    test('Happy Path - Verify trend calculation accuracy', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({
          userId: testUserId.toString(),
          period: 'monthly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const monthlyTrends = response.body.data.trends.monthly;
      expect(monthlyTrends).toBeDefined();
      
      // Verify January and February totals
      const januaryTotal = monthlyTrends.find((trend: any) => trend.period === '2024-01')?.total || 0;
      const februaryTotal = monthlyTrends.find((trend: any) => trend.period === '2024-02')?.total || 0;
      
      expect(januaryTotal).toBe(63.20); // January expenses
      expect(februaryTotal).toBe(98.40); // February expenses
    });

    test('Fix Path - Handle zero values correctly', async () => {
      // Clear expenses and add a zero amount expense
      await testDb.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
      
      await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUserId, testBotId, '2024-01-15', 'Free Item', 0.00, 'Others']
      );

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.totalSpending).toBe(0.00);
      expect(response.body.data.categoryBreakdown['Others']).toBe(0.00);
    });

    test('Fix Path - Handle negative values gracefully', async () => {
      // Clear expenses and add a negative amount (refund)
      await testDb.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
      
      await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUserId, testBotId, '2024-01-15', 'Refund', -15.50, 'Others']
      );

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      // Should handle negative values appropriately
      expect(typeof response.body.data.totalSpending).toBe('number');
    });

    test('Edge Path - Large number calculation accuracy', async () => {
      // Clear and add large amounts
      await testDb.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
      
      const largeAmounts = [
        { date: '2024-01-15', vendor: 'Luxury1', amount: 999999.99, category: 'Luxury' },
        { date: '2024-01-16', vendor: 'Luxury2', amount: 888888.88, category: 'Luxury' }
      ];

      for (const expense of largeAmounts) {
        await testDb.query(
          'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
          [testUserId, testBotId, expense.date, expense.vendor, expense.amount, expense.category]
        );
      }

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.totalSpending).toBe(1888888.87); // 999999.99 + 888888.88
    });
  });

  describe('Insights Generation', () => {
    test('Happy Path - Generate meaningful insights', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.insights).toBeDefined();
      expect(Array.isArray(response.body.data.insights)).toBe(true);
      expect(response.body.data.insights.length).toBeGreaterThan(0);
      
      // Verify insights contain expected patterns
      const insights = response.body.data.insights.join(' ').toLowerCase();
      expect(insights).toMatch(/(spending|category|highest|lowest|average)/);
    });

    test('Fix Path - Generate insights for single category', async () => {
      // Clear and add expenses in only one category
      await testDb.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
      
      for (let i = 1; i <= 5; i++) {
        await testDb.query(
          'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
          [testUserId, testBotId, `2024-01-${i.toString().padStart(2, '0')}`, `Vendor${i}`, i * 10.00, 'Only Category']
        );
      }

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.insights).toBeDefined();
      expect(response.body.data.insights.length).toBeGreaterThan(0);
    });

    test('Edge Path - Generate insights for no expenses', async () => {
      // Create user with no expenses
      const newUserResult = await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['noinsights', 'noinsights@example.com', await bcrypt.hash('password', 10)]
      );

      const response = await request('http://localhost:3000')
        .get('/api/metrics')
        .query({ userId: newUserResult.rows[0].id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.insights).toBeDefined();
      // Should provide meaningful insights even for no data
    });
  });
});