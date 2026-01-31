import request from 'supertest';
import { testDb, testUsers, testExpenses, testBots } from '../setup';
import bcrypt from 'bcryptjs';

describe('Expenses API Tests', () => {
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
  });

  describe('GET /api/expenses', () => {
    beforeEach(async () => {
      // Insert test expenses
      await testDb.query(
        `INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category, location, comment) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          testUserId,
          testBotId,
          testExpenses.completeExpense.expense_date,
          testExpenses.completeExpense.vendor,
          testExpenses.completeExpense.amount_sgd,
          testExpenses.completeExpense.category,
          testExpenses.completeExpense.location,
          testExpenses.completeExpense.comment
        ]
      );
    });

    test('Happy Path - Get expenses with valid userId', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].vendor).toBe(testExpenses.completeExpense.vendor);
      expect(response.body.expenses[0].amount_sgd).toBe(testExpenses.completeExpense.amount_sgd);
    });

    test('Happy Path - Get expenses with date filtering', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({
          userId: testUserId.toString(),
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expenses).toHaveLength(1);
    });

    test('Happy Path - Get expenses with category filtering', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({
          userId: testUserId.toString(),
          category: testExpenses.completeExpense.category
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expenses).toHaveLength(1);
    });

    test('Happy Path - Get expenses with search', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({
          userId: testUserId.toString(),
          search: 'Starbucks'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expenses).toHaveLength(1);
    });

    test('Happy Path - Get expenses with sorting', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({
          userId: testUserId.toString(),
          sortBy: 'amount_sgd',
          sortOrder: 'DESC'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Happy Path - Get expenses with pagination', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({
          userId: testUserId.toString(),
          limit: '10',
          offset: '0'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Fix Path - No expenses for user should return empty array', async () => {
      // Create another user with no expenses
      const newUserResult = await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['noexpense', 'noexpense@example.com', await bcrypt.hash('password', 10)]
      );

      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({ userId: newUserResult.rows[0].id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expenses).toHaveLength(0);
    });

    test('Edge Path - Missing userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    test('Edge Path - Invalid userId should return 400', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({ userId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    test('Edge Path - SQL injection attempt in sortBy', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({
          userId: testUserId.toString(),
          sortBy: 'amount_sgd; DROP TABLE expenses; --'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should default to safe sort column
    });

    test('Edge Path - Invalid date format should be handled gracefully', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/expenses')
        .query({
          userId: testUserId.toString(),
          startDate: 'invalid-date'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/expenses/[id]', () => {
    let expenseId: number;

    beforeEach(async () => {
      // Create test expense
      const expenseResult = await testDb.query(
        `INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [testUserId, testBotId, '2024-01-15', 'Test Vendor', 10.00, 'Others']
      );
      expenseId = expenseResult.rows[0].id;
    });

    test('Happy Path - Update expense with valid data', async () => {
      const updateData = {
        vendor: 'Updated Vendor',
        amount_sgd: 15.50,
        category: 'Food & Beverage',
        comment: 'Updated comment'
      };

      const response = await request('http://localhost:3000')
        .put(`/api/expenses/${expenseId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expense.vendor).toBe(updateData.vendor);
      expect(response.body.expense.amount_sgd).toBe(updateData.amount_sgd);
    });

    test('Fix Path - Partial update should succeed', async () => {
      const updateData = {
        vendor: 'Partially Updated Vendor'
      };

      const response = await request('http://localhost:3000')
        .put(`/api/expenses/${expenseId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.expense.vendor).toBe(updateData.vendor);
    });

    test('Edge Path - Non-existent expense should return 404', async () => {
      const response = await request('http://localhost:3000')
        .put('/api/expenses/99999')
        .send({ vendor: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Expense not found');
    });

    test('Edge Path - Invalid expense ID should return 400', async () => {
      const response = await request('http://localhost:3000')
        .put('/api/expenses/invalid')
        .send({ vendor: 'Updated' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid expense ID');
    });

    test('Edge Path - Empty update should succeed with no changes', async () => {
      const response = await request('http://localhost:3000')
        .put(`/api/expenses/${expenseId}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Edge Path - Invalid data types should be handled', async () => {
      const response = await request('http://localhost:3000')
        .put(`/api/expenses/${expenseId}`)
        .send({
          amount_sgd: 'invalid_amount',
          expense_date: 'invalid_date'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/expenses/[id]', () => {
    let expenseId: number;

    beforeEach(async () => {
      // Create test expense
      const expenseResult = await testDb.query(
        `INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [testUserId, testBotId, '2024-01-15', 'Test Vendor', 10.00, 'Others']
      );
      expenseId = expenseResult.rows[0].id;
    });

    test('Happy Path - Delete existing expense', async () => {
      const response = await request('http://localhost:3000')
        .delete(`/api/expenses/${expenseId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify expense is deleted
      const deletedExpense = await testDb.query('SELECT * FROM expenses WHERE id = $1', [expenseId]);
      expect(deletedExpense.rows).toHaveLength(0);
    });

    test('Edge Path - Delete non-existent expense should return 404', async () => {
      const response = await request('http://localhost:3000')
        .delete('/api/expenses/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Expense not found');
    });

    test('Edge Path - Invalid expense ID should return 400', async () => {
      const response = await request('http://localhost:3000')
        .delete('/api/expenses/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid expense ID');
    });
  });

  describe('POST /api/expenses (via Telegram webhook simulation)', () => {
    test('Happy Path - Create expense from OCR data', async () => {
      const ocrData = {
        user_id: testUserId,
        bot_id: testBotId,
        chat_id: 'test_chat_123',
        expense_date: '2024-01-15',
        expense_time: '09:30:00',
        vendor: 'Starbucks',
        amount_original: 5.40,
        currency: 'SGD',
        amount_sgd: 5.40,
        category: 'Food & Beverage',
        location: 'Orchard Road',
        payment_method: 'Visa',
        comment: 'Morning coffee',
        receipt_image_url: 'https://example.com/receipt.jpg'
      };

      const response = await request('http://localhost:3000')
        .post('/api/expenses')
        .send(ocrData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.expense.vendor).toBe(ocrData.vendor);
      expect(response.body.expense.amount_sgd).toBe(ocrData.amount_sgd);
    });

    test('Fix Path - Create expense with minimal required data', async () => {
      const minimalData = {
        user_id: testUserId,
        bot_id: testBotId,
        expense_date: '2024-01-15',
        vendor: 'Unknown Store',
        amount_sgd: 10.00,
        category: 'Others'
      };

      const response = await request('http://localhost:3000')
        .post('/api/expenses')
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.expense.needs_review).toBe(true);
    });

    test('Edge Path - Missing required fields should return 400', async () => {
      const incompleteData = {
        user_id: testUserId,
        // Missing bot_id, expense_date, vendor, amount_sgd, category
      };

      const response = await request('http://localhost:3000')
        .post('/api/expenses')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    test('Edge Path - Invalid user_id should return 400', async () => {
      const invalidData = {
        user_id: 99999,
        bot_id: testBotId,
        expense_date: '2024-01-15',
        vendor: 'Test',
        amount_sgd: 10.00,
        category: 'Others'
      };

      const response = await request('http://localhost:3000')
        .post('/api/expenses')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid user');
    });

    test('Edge Path - Duplicate expense detection', async () => {
      const duplicateData = {
        user_id: testUserId,
        bot_id: testBotId,
        chat_id: 'duplicate_chat',
        expense_date: '2024-01-15',
        expense_time: '09:30:00',
        vendor: 'Duplicate Test',
        amount_sgd: 10.00,
        category: 'Others'
      };

      // Create first expense
      await request('http://localhost:3000')
        .post('/api/expenses')
        .send(duplicateData);

      // Try to create duplicate
      const response = await request('http://localhost:3000')
        .post('/api/expenses')
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('duplicate');
    });
  });
});