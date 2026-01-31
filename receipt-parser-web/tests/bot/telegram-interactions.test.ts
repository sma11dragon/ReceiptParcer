import { testDb, testUsers, testBots, testExpenses } from '../setup';
import bcrypt from 'bcryptjs';

// Mock Telegram Bot API
const mockTelegramBot = {
  sendMessage: jest.fn(),
  sendPhoto: jest.fn(),
  editMessageText: jest.fn(),
  answerCallbackQuery: jest.fn(),
  getFile: jest.fn(),
  downloadFile: jest.fn()
};

// Mock N8N webhook service
const mockN8NService = {
  sendWebhook: jest.fn(),
  processMessage: jest.fn()
};

describe('Telegram Bot Interaction Tests', () => {
  let testUserId: number;
  let testBotId: number;
  let testChatId: number;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testUsers.validUser.password, 10);
    const userResult = await testDb.query(
      'INSERT INTO users (username, email, password_hash, location, telegram_user_id, telegram_chat_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [testUsers.validUser.username, testUsers.validUser.email, hashedPassword, testUsers.validUser.location, 12345, 12345]
    );
    testUserId = userResult.rows[0].id;
    testChatId = 12345;

    // Create test bot
    const botResult = await testDb.query(
      'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3) RETURNING id',
      [testUserId, testBots.validBot.token, testBots.validBot.username]
    );
    testBotId = botResult.rows[0].id;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Bot Command Processing Tests', () => {
    test('Happy Path - /start command', async () => {
      const startMessage = {
        message_id: 1,
        from: { id: testUserId, username: 'testuser', first_name: 'Test' },
        chat: { id: testChatId, type: 'private' },
        text: '/start'
      };

      const response = await processTelegramMessage(startMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Welcome to ReceiptAI'),
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            keyboard: expect.arrayContaining([
              expect.arrayContaining(['📸 Upload Receipt', '📊 View Expenses'])
            ])
          })
        })
      );
    });

    test('Happy Path - /help command', async () => {
      const helpMessage = {
        message_id: 2,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/help'
      };

      const response = await processTelegramMessage(helpMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('How to use ReceiptAI'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Happy Path - /expenses command', async () => {
      // Insert test expenses
      await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUserId, testBotId, '2024-01-15', 'Starbucks', 5.40, 'Food & Beverage']
      );

      const expensesMessage = {
        message_id: 3,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/expenses'
      };

      const response = await processTelegramMessage(expensesMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Your Recent Expenses'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Happy Path - /summary command', async () => {
      // Insert multiple expenses for summary
      const expenses = [
        { date: '2024-01-15', vendor: 'Starbucks', amount: 5.40, category: 'Food & Beverage' },
        { date: '2024-01-16', vendor: 'Shell', amount: 45.00, category: 'Transportation' },
        { date: '2024-01-17', vendor: '7-Eleven', amount: 12.80, category: 'Food & Beverage' }
      ];

      for (const expense of expenses) {
        await testDb.query(
          'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
          [testUserId, testBotId, expense.date, expense.vendor, expense.amount, expense.category]
        );
      }

      const summaryMessage = {
        message_id: 4,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/summary'
      };

      const response = await processTelegramMessage(summaryMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Monthly Summary'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Fix Path - Unknown command', async () => {
      const unknownMessage = {
        message_id: 5,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/unknowncommand'
      };

      const response = await processTelegramMessage(unknownMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('I don\'t recognize that command'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Edge Path - Empty message', async () => {
      const emptyMessage = {
        message_id: 6,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: ''
      };

      const response = await processTelegramMessage(emptyMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Please send a receipt or use a command'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Edge Path - Message without chat context', async () => {
      const messageWithoutChat = {
        message_id: 7,
        from: { id: testUserId, username: 'testuser' },
        text: '/start'
        // Missing chat object
      };

      const response = await processTelegramMessage(messageWithoutChat, testBots.validBot.token);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Chat context required');
    });
  });

  describe('Receipt Upload and Processing Tests', () => {
    test('Happy Path - Single receipt upload', async () => {
      const photoMessage = {
        message_id: 8,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        photo: [{
          file_id: 'receipt_photo_123',
          file_size: 1024000,
          width: 1080,
          height: 1920
        }]
      };

      // Mock successful file download and OCR processing
      mockTelegramBot.getFile.mockResolvedValue({
        ok: true,
        result: {
          file_path: 'photos/receipt_photo_123.jpg'
        }
      });

      mockTelegramBot.downloadFile.mockResolvedValue(Buffer.from('fake image data'));

      mockN8NService.sendWebhook.mockResolvedValue({
        success: true,
        expense: {
          vendor: 'Starbucks',
          amount_sgd: 5.40,
          category: 'Food & Beverage',
          needs_review: false
        }
      });

      const response = await processTelegramMessage(photoMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Processing your receipt...'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );

      // Verify processing completion message
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Receipt processed successfully'),
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: '✅ Correct' }),
                expect.objectContaining({ text: '✏️ Edit' })
              ])
            ])
          })
        })
      );
    });

    test('Fix Path - Blurry receipt upload', async () => {
      const blurryPhotoMessage = {
        message_id: 9,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        photo: [{
          file_id: 'blurry_receipt_124',
          file_size: 800000,
          width: 1080,
          height: 1920
        }]
      };

      mockTelegramBot.getFile.mockResolvedValue({
        ok: true,
        result: {
          file_path: 'photos/blurry_receipt_124.jpg'
        }
      });

      mockTelegramBot.downloadFile.mockResolvedValue(Buffer.from('blurry image data'));

      mockN8NService.sendWebhook.mockResolvedValue({
        success: true,
        expense: {
          vendor: 'Unknown Vendor',
          amount_sgd: 25.50,
          category: 'Others',
          needs_review: true
        },
        warnings: ['Low image quality detected']
      });

      const response = await processTelegramMessage(blurryPhotoMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Receipt processed but needs review'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Edge Path - Corrupted image upload', async () => {
      const corruptedPhotoMessage = {
        message_id: 10,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        photo: [{
          file_id: 'corrupted_receipt_125',
          file_size: 500000,
          width: 1080,
          height: 1920
        }]
      };

      mockTelegramBot.getFile.mockResolvedValue({
        ok: true,
        result: {
          file_path: 'photos/corrupted_receipt_125.jpg'
        }
      });

      mockTelegramBot.downloadFile.mockRejectedValue(new Error('Corrupted image file'));

      const response = await processTelegramMessage(corruptedPhotoMessage, testBots.validBot.token);

      expect(response.success).toBe(false);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Failed to process receipt'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Edge Path - Multiple photos in single message', async () => {
      const multiplePhotosMessage = {
        message_id: 11,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        photo: [
          {
            file_id: 'receipt_photo_126',
            file_size: 800000,
            width: 1080,
            height: 1920
          },
          {
            file_id: 'receipt_photo_127',
            file_size: 900000,
            width: 1080,
            height: 1920
          }
        ]
      };

      const response = await processTelegramMessage(multiplePhotosMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Please send one receipt at a time'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Edge Path - User cancels processing', async () => {
      const cancelMessage = {
        message_id: 12,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/cancel'
      };

      const response = await processTelegramMessage(cancelMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Processing cancelled'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });
  });

  describe('User Query Processing Tests', () => {
    beforeEach(async () => {
      // Insert test expenses for query tests
      const expenses = [
        { date: '2024-01-15', vendor: 'Starbucks', amount: 5.40, category: 'Food & Beverage' },
        { date: '2024-01-16', vendor: 'Shell Station', amount: 45.00, category: 'Transportation' },
        { date: '2024-01-17', vendor: '7-Eleven', amount: 12.80, category: 'Food & Beverage' }
      ];

      for (const expense of expenses) {
        await testDb.query(
          'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
          [testUserId, testBotId, expense.date, expense.vendor, expense.amount, expense.category]
        );
      }
    });

    test('Happy Path - Natural language query: "How much did I spend on Starbucks?"', async () => {
      const queryMessage = {
        message_id: 13,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: 'How much did I spend on Starbucks?'
      };

      const response = await processTelegramMessage(queryMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('You spent $5.40 on Starbucks'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Happy Path - Natural language query: "What is my total spending?"', async () => {
      const queryMessage = {
        message_id: 14,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: 'What is my total spending?'
      };

      const response = await processTelegramMessage(queryMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Your total spending is $63.20'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Happy Path - Natural language query: "Show me my food expenses"', async () => {
      const queryMessage = {
        message_id: 15,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: 'Show me my food expenses'
      };

      const response = await processTelegramMessage(queryMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Food & Beverage expenses: $18.20'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Happy Path - Natural language query: "Expenses this week"', async () => {
      const queryMessage = {
        message_id: 16,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: 'Expenses this week'
      };

      const response = await processTelegramMessage(queryMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Your expenses this week'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Fix Path - Ambiguous query: "How much?"', async () => {
      const ambiguousMessage = {
        message_id: 17,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: 'How much?'
      };

      const response = await processTelegramMessage(ambiguousMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Could you be more specific?'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Fix Path - Query with no results: "How much did I spend on Amazon?"', async () => {
      const noResultsMessage = {
        message_id: 18,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: 'How much did I spend on Amazon?'
      };

      const response = await processTelegramMessage(noResultsMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('No expenses found for Amazon'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Edge Path - Unrecognizable query: "xyz abc 123"', async () => {
      const unrecognizableMessage = {
        message_id: 19,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: 'xyz abc 123'
      };

      const response = await processTelegramMessage(unrecognizableMessage, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('I didn\'t understand that query'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });
  });

  describe('Interactive Button Tests', () => {
    test('Happy Path - Expense confirmation button', async () => {
      // First insert an expense that needs confirmation
      const expenseResult = await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category, needs_review) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [testUserId, testBotId, '2024-01-15', 'Test Store', 25.00, 'Others', true]
      );
      const expenseId = expenseResult.rows[0].id;

      const callbackQuery = {
        id: 'callback_123',
        from: { id: testUserId, username: 'testuser' },
        message: {
          message_id: 20,
          chat: { id: testChatId, type: 'private' }
        },
        data: `confirm_${expenseId}`
      };

      const response = await processCallbackQuery(callbackQuery, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_123',
        { text: 'Expense confirmed! ✅' }
      );
      expect(mockTelegramBot.editMessageText).toHaveBeenCalledWith(
        testChatId,
        20,
        expect.stringContaining('Expense confirmed and saved'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );

      // Verify expense is no longer flagged for review
      const updatedExpense = await testDb.query('SELECT needs_review FROM expenses WHERE id = $1', [expenseId]);
      expect(updatedExpense.rows[0].needs_review).toBe(false);
    });

    test('Happy Path - Expense edit button', async () => {
      const expenseResult = await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category, needs_review) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [testUserId, testBotId, '2024-01-15', 'Test Store', 25.00, 'Others', true]
      );
      const expenseId = expenseResult.rows[0].id;

      const callbackQuery = {
        id: 'callback_124',
        from: { id: testUserId, username: 'testuser' },
        message: {
          message_id: 21,
          chat: { id: testChatId, type: 'private' }
        },
        data: `edit_${expenseId}`
      };

      const response = await processCallbackQuery(callbackQuery, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_124',
        { text: 'Please send the corrected details' }
      );
      expect(mockTelegramBot.editMessageText).toHaveBeenCalledWith(
        testChatId,
        21,
        expect.stringContaining('Send me the updated expense details'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Fix Path - Expense delete button', async () => {
      const expenseResult = await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [testUserId, testBotId, '2024-01-15', 'Test Store', 25.00, 'Others']
      );
      const expenseId = expenseResult.rows[0].id;

      const callbackQuery = {
        id: 'callback_125',
        from: { id: testUserId, username: 'testuser' },
        message: {
          message_id: 22,
          chat: { id: testChatId, type: 'private' }
        },
        data: `delete_${expenseId}`
      };

      const response = await processCallbackQuery(callbackQuery, testBots.validBot.token);

      expect(response.success).toBe(true);
      expect(mockTelegramBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_125',
        { text: 'Expense deleted' }
      );

      // Verify expense is deleted
      const deletedExpense = await testDb.query('SELECT * FROM expenses WHERE id = $1', [expenseId]);
      expect(deletedExpense.rows).toHaveLength(0);
    });

    test('Edge Path - Invalid callback data', async () => {
      const invalidCallbackQuery = {
        id: 'callback_126',
        from: { id: testUserId, username: 'testuser' },
        message: {
          message_id: 23,
          chat: { id: testChatId, type: 'private' }
        },
        data: 'invalid_data'
      };

      const response = await processCallbackQuery(invalidCallbackQuery, testBots.validBot.token);

      expect(response.success).toBe(false);
      expect(mockTelegramBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_126',
        { text: 'Invalid action', show_alert: true }
      );
    });

    test('Edge Path - Callback for non-existent expense', async () => {
      const nonExistentCallbackQuery = {
        id: 'callback_127',
        from: { id: testUserId, username: 'testuser' },
        message: {
          message_id: 24,
          chat: { id: testChatId, type: 'private' }
        },
        data: 'confirm_99999'
      };

      const response = await processCallbackQuery(nonExistentCallbackQuery, testBots.validBot.token);

      expect(response.success).toBe(false);
      expect(mockTelegramBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_127',
        { text: 'Expense not found', show_alert: true }
      );
    });
  });

  describe('Bot Error Handling Tests', () => {
    test('Bot token invalid/expired', async () => {
      const message = {
        message_id: 25,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/start'
      };

      const response = await processTelegramMessage(message, 'invalid_token');

      expect(response.success).toBe(false);
      expect(response.error).toContain('Bot authentication failed');
    });

    test('User not registered with bot', async () => {
      // Create a user without telegram integration
      const unregisteredUserResult = await testDb.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['unregistered', 'unregistered@example.com', await bcrypt.hash('password', 10)]
      );
      const unregisteredUserId = unregisteredUserResult.rows[0].id;

      const message = {
        message_id: 26,
        from: { id: unregisteredUserId, username: 'unregistered' },
        chat: { id: 67890, type: 'private' },
        text: '/start'
      };

      const response = await processTelegramMessage(message, testBots.validBot.token);

      expect(response.success).toBe(false);
      expect(response.error).toContain('User not registered');
    });

    test('Database connection failure', async () => {
      // Mock database failure
      const originalQuery = testDb.query;
      testDb.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const message = {
        message_id: 27,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/expenses'
      };

      const response = await processTelegramMessage(message, testBots.validBot.token);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Database error');

      // Restore original query
      testDb.query = originalQuery;
    });

    test('Rate limiting', async () => {
      const message = {
        message_id: 28,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/expenses'
      };

      // Mock rate limiting
      const rateLimiter = new Map();
      rateLimiter.set(testUserId, 5); // User has exceeded rate limit

      const response = await processTelegramMessageWithRateLimit(message, testBots.validBot.token, rateLimiter);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Rate limit exceeded');
    });
  });

  describe('Multi-Bot Support Tests', () => {
    test('Message routing to correct bot', async () => {
      // Create second bot for same user
      const secondBotResult = await testDb.query(
        'INSERT INTO user_telegram_bots (user_id, bot_token, bot_username) VALUES ($1, $2, $3) RETURNING id',
        [testUserId, 'second_bot_token', 'second_expense_bot']
      );
      const secondBotId = secondBotResult.rows[0].id;

      // Insert expense with second bot
      await testDb.query(
        'INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUserId, secondBotId, '2024-01-15', 'Second Bot Store', 15.00, 'Others']
      );

      const message = {
        message_id: 29,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testChatId, type: 'private' },
        text: '/expenses'
      };

      const response = await processTelegramMessage(message, 'second_bot_token');

      expect(response.success).toBe(true);
      expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith(
        testChatId,
        expect.stringContaining('Your Recent Expenses'),
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    test('Bot ownership verification', async () => {
      const otherUserResult = await testDb.query(
        'INSERT INTO users (username, email, password_hash, telegram_user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['otheruser', 'other@example.com', await bcrypt.hash('password', 10), 99999]
      );
      const otherUserId = otherUserResult.rows[0].id;

      // Try to use bot with different user
      const message = {
        message_id: 30,
        from: { id: otherUserId, username: 'otheruser' },
        chat: { id: 99999, type: 'private' },
        text: '/start'
      };

      const response = await processTelegramMessage(message, testBots.validBot.token);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Bot ownership verification failed');
    });
  });
});

// Helper functions to simulate Telegram bot processing
async function processTelegramMessage(message: any, botToken: string): Promise<any> {
  try {
    // Verify bot token and user ownership
    const botResult = await testDb.query(
      'SELECT b.*, u.telegram_user_id FROM user_telegram_bots b JOIN users u ON b.user_id = u.id WHERE b.bot_token = $1',
      [botToken]
    );

    if (botResult.rows.length === 0) {
      return { success: false, error: 'Bot authentication failed' };
    }

    const bot = botResult.rows[0];
    if (bot.telegram_user_id !== message.from.id) {
      return { success: false, error: 'Bot ownership verification failed' };
    }

    // Process message based on content
    if (message.text && message.text.startsWith('/')) {
      return await processCommand(message, bot);
    } else if (message.photo) {
      return await processPhoto(message, bot);
    } else if (message.text && !message.text.startsWith('/')) {
      return await processQuery(message, bot);
    } else {
      return await processUnknownMessage(message, bot);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processCommand(message: any, bot: any): Promise<any> {
  const command = message.text;
  const chatId = message.chat.id;

  switch (command) {
    case '/start':
      mockTelegramBot.sendMessage(chatId, 'Welcome to ReceiptAI! 📊\n\nI can help you track expenses by simply sending me receipts. Here\'s what I can do:\n\n📸 Send receipt photos for automatic processing\n📊 View your expense summaries\n💬 Ask questions about your spending\n\nGetting started:\n1. Send me a clear photo of your receipt\n2. I\'ll extract the details automatically\n3. Confirm or edit the information\n\nTry sending a receipt now!', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            ['📸 Upload Receipt', '📊 View Expenses'],
            ['❓ Help', '📈 Summary']
          ],
          resize_keyboard: true
        }
      });
      return { success: true };

    case '/help':
      mockTelegramBot.sendMessage(chatId, '<b>🤖 ReceiptAI Help</b>\n\n<b>Commands:</b>\n/start - Start using the bot\n/expenses - View recent expenses\n/summary - Get monthly summary\n/help - Show this help message\n\n<b>How to use:</b>\n1. Send a clear photo of your receipt\n2. Wait for processing\n3. Confirm the extracted details\n4. Ask questions like:\n   • "How much did I spend on Starbucks?"\n   • "What\'s my total spending this month?"\n   • "Show me food expenses"\n\n<b>Tips:</b>\n• Ensure good lighting when taking photos\n• Include the merchant name and total amount\n• Send one receipt at a time', {
        parse_mode: 'HTML'
      });
      return { success: true };

    case '/expenses':
      return await showExpenses(chatId, bot.user_id);

    case '/summary':
      return await showSummary(chatId, bot.user_id);

    default:
      mockTelegramBot.sendMessage(chatId, 'I don\'t recognize that command. Use /help to see available commands.', {
        parse_mode: 'HTML'
      });
      return { success: true };
  }
}

async function processPhoto(message: any, bot: any): Promise<any> {
  const chatId = message.chat.id;
  const photo = message.photo[message.photo.length - 1]; // Get highest resolution

  if (message.photo.length > 1) {
    mockTelegramBot.sendMessage(chatId, 'Please send one receipt at a time for best results.', {
      parse_mode: 'HTML'
    });
    return { success: true };
  }

  try {
    // Send processing message
    mockTelegramBot.sendMessage(chatId, '🔄 Processing your receipt...', {
      parse_mode: 'HTML'
    });

    // Download file
    const file = await mockTelegramBot.getFile(photo.file_id);
    const imageData = await mockTelegramBot.downloadFile(file.result.file_path);

    // Send to N8N for OCR processing
    const webhookResult = await mockN8NService.sendWebhook({
      image: imageData.toString('base64'),
      userId: bot.user_id,
      botId: bot.id,
      chatId: chatId
    });

    if (webhookResult.success) {
      const expense = webhookResult.expense;
      let messageText = `✅ <b>Receipt processed successfully!</b>\n\n`;
      messageText += `🏪 <b>Merchant:</b> ${expense.vendor}\n`;
      messageText += `💰 <b>Amount:</b> $${expense.amount_sgd} ${expense.currency || ''}\n`;
      messageText += `📂 <b>Category:</b> ${expense.category}\n`;
      messageText += `📅 <b>Date:</b> ${expense.expense_date}\n`;

      if (expense.needs_review) {
        messageText += `\n⚠️ <i>This receipt needs review due to unclear text</i>`;
      }

      const keyboard = {
        inline_keyboard: [[
          { text: '✅ Correct', callback_data: `confirm_${expense.id}` },
          { text: '✏️ Edit', callback_data: `edit_${expense.id}` },
          { text: '🗑️ Delete', callback_data: `delete_${expense.id}` }
        ]]
      };

      mockTelegramBot.sendMessage(chatId, messageText, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });

      return { success: true, expense };
    } else {
      throw new Error(webhookResult.error);
    }
  } catch (error) {
    mockTelegramBot.sendMessage(chatId, `❌ Failed to process receipt: ${error.message}\n\nPlease try again with a clearer photo.`, {
      parse_mode: 'HTML'
    });
    return { success: false, error: error.message };
  }
}

async function processQuery(message: any, bot: any): Promise<any> {
  const chatId = message.chat.id;
  const query = message.text.toLowerCase();

  try {
    // Parse natural language query
    const queryResult = await parseNaturalLanguageQuery(query, bot.user_id);
    
    if (queryResult.success) {
      mockTelegramBot.sendMessage(chatId, queryResult.response, {
        parse_mode: 'HTML'
      });
    } else {
      mockTelegramBot.sendMessage(chatId, 'I didn\'t understand that query. Try asking about your spending, like:\n\n• "How much did I spend on Starbucks?"\n• "What\'s my total spending?"\n• "Show me food expenses"\n• "Expenses this week"', {
        parse_mode: 'HTML'
      });
    }

    return { success: true };
  } catch (error) {
    mockTelegramBot.sendMessage(chatId, 'Sorry, I had trouble processing your request. Please try again.', {
      parse_mode: 'HTML'
    });
    return { success: false, error: error.message };
  }
}

async function processUnknownMessage(message: any, bot: any): Promise<any> {
  const chatId = message.chat.id;
  
  mockTelegramBot.sendMessage(chatId, 'Please send a receipt photo or use a command. Type /help for assistance.', {
    parse_mode: 'HTML'
  });
  
  return { success: true };
}

async function processCallbackQuery(callbackQuery: any, botToken: string): Promise<any> {
  try {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    if (data.startsWith('confirm_')) {
      const expenseId = parseInt(data.replace('confirm_', ''));
      
      await testDb.query(
        'UPDATE expenses SET needs_review = false WHERE id = $1',
        [expenseId]
      );

      mockTelegramBot.answerCallbackQuery(callbackQuery.id, { text: 'Expense confirmed! ✅' });
      mockTelegramBot.editMessageText(chatId, messageId, '✅ Expense confirmed and saved successfully!', {
        parse_mode: 'HTML'
      });

      return { success: true };
    } else if (data.startsWith('edit_')) {
      mockTelegramBot.answerCallbackQuery(callbackQuery.id, { text: 'Please send the corrected details' });
      mockTelegramBot.editMessageText(chatId, messageId, '✏️ Send me the updated expense details in this format:\n\nVendor: [Store Name]\nAmount: [Amount]\nCategory: [Category]\nDate: [YYYY-MM-DD]', {
        parse_mode: 'HTML'
      });

      return { success: true };
    } else if (data.startsWith('delete_')) {
      const expenseId = parseInt(data.replace('delete_', ''));
      
      await testDb.query('DELETE FROM expenses WHERE id = $1', [expenseId]);

      mockTelegramBot.answerCallbackQuery(callbackQuery.id, { text: 'Expense deleted' });
      mockTelegramBot.editMessageText(chatId, messageId, '🗑️ Expense deleted successfully.', {
        parse_mode: 'HTML'
      });

      return { success: true };
    } else {
      mockTelegramBot.answerCallbackQuery(callbackQuery.id, { 
        text: 'Invalid action', 
        show_alert: true 
      });
      return { success: false };
    }
  } catch (error) {
    mockTelegramBot.answerCallbackQuery(callbackQuery.id, { 
      text: 'Error processing action', 
      show_alert: true 
    });
    return { success: false, error: error.message };
  }
}

async function showExpenses(chatId: number, userId: number): Promise<any> {
  const result = await testDb.query(
    'SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
    [userId]
  );

  if (result.rows.length === 0) {
    mockTelegramBot.sendMessage(chatId, '📊 <b>Your Recent Expenses</b>\n\nNo expenses found. Send me a receipt to get started!', {
      parse_mode: 'HTML'
    });
  } else {
    let message = '📊 <b>Your Recent Expenses</b>\n\n';
    let total = 0;
    
    result.rows.forEach((expense, index) => {
      message += `${index + 1}. ${expense.vendor} - $${expense.amount_sgd}\n`;
      message += `   ${expense.category} • ${expense.expense_date}\n\n`;
      total += parseFloat(expense.amount_sgd);
    });
    
    message += `<b>Total: $${total.toFixed(2)}</b>`;
    
    mockTelegramBot.sendMessage(chatId, message, {
      parse_mode: 'HTML'
    });
  }

  return { success: true };
}

async function showSummary(chatId: number, userId: number): Promise<any> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const result = await testDb.query(
    'SELECT category, SUM(amount_sgd) as total FROM expenses WHERE user_id = $1 AND expense_date LIKE $2 GROUP BY category',
    [userId, `${currentMonth}%`]
  );

  const totalResult = await testDb.query(
    'SELECT SUM(amount_sgd) as total FROM expenses WHERE user_id = $1 AND expense_date LIKE $2',
    [userId, `${currentMonth}%`]
  );

  let message = `📈 <b>Monthly Summary - ${currentMonth}</b>\n\n`;
  
  if (result.rows.length === 0) {
    message += 'No expenses this month yet.';
  } else {
    result.rows.forEach(row => {
      message += `📂 ${row.category}: $${parseFloat(row.total).toFixed(2)}\n`;
    });
    message += `\n<b>Total: $${parseFloat(totalResult.rows[0].total || 0).toFixed(2)}</b>`;
  }

  mockTelegramBot.sendMessage(chatId, message, {
    parse_mode: 'HTML'
  });

  return { success: true };
}

async function parseNaturalLanguageQuery(query: string, userId: number): Promise<any> {
  // Simplified NLP for demo purposes
  const lowercaseQuery = query.toLowerCase();
  
  if (lowercaseQuery.includes('starbucks')) {
    const result = await testDb.query(
      'SELECT SUM(amount_sgd) as total FROM expenses WHERE user_id = $1 AND vendor ILIKE $2',
      [userId, '%starbucks%']
    );
    
    return {
      success: true,
      response: `You spent $${parseFloat(result.rows[0].total || 0).toFixed(2)} on Starbucks.`
    };
  } else if (lowercaseQuery.includes('total spending') || lowercaseQuery.includes('how much')) {
    const result = await testDb.query(
      'SELECT SUM(amount_sgd) as total FROM expenses WHERE user_id = $1',
      [userId]
    );
    
    return {
      success: true,
      response: `Your total spending is $${parseFloat(result.rows[0].total || 0).toFixed(2)}.`
    };
  } else if (lowercaseQuery.includes('food') || lowercaseQuery.includes('beverage')) {
    const result = await testDb.query(
      'SELECT SUM(amount_sgd) as total FROM expenses WHERE user_id = $1 AND category ILIKE $2',
      [userId, '%food%']
    );
    
    return {
      success: true,
      response: `Food & Beverage expenses: $${parseFloat(result.rows[0].total || 0).toFixed(2)}.`
    };
  } else if (lowercaseQuery.includes('this week')) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const result = await testDb.query(
      'SELECT SUM(amount_sgd) as total, COUNT(*) as count FROM expenses WHERE user_id = $1 AND created_at >= $2',
      [userId, weekStart]
    );
    
    return {
      success: true,
      response: `Your expenses this week: $${parseFloat(result.rows[0].total || 0).toFixed(2)} (${result.rows[0].count} transactions).`
    };
  }
  
  return { success: false };
}

async function processTelegramMessageWithRateLimit(message: any, botToken: string, rateLimiter: Map<number, number>): Promise<any> {
  const userId = message.from.id;
  const currentCount = rateLimiter.get(userId) || 0;
  
  if (currentCount > 10) { // 10 messages per minute limit
    return { success: false, error: 'Rate limit exceeded. Please wait before sending more messages.' };
  }
  
  rateLimiter.set(userId, currentCount + 1);
  
  // Reset counter after 1 minute
  setTimeout(() => {
    rateLimiter.set(userId, Math.max(0, (rateLimiter.get(userId) || 0) - 1));
  }, 60000);
  
  return await processTelegramMessage(message, botToken);
}