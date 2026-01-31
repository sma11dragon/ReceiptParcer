import { testDb, testUsers, testBots, testOCRResults } from '../setup';
import bcrypt from 'bcryptjs';

// Mock OCR service
const mockOCRService = {
  processReceipt: jest.fn(),
  validateImage: jest.fn(),
  extractText: jest.fn(),
  parseReceiptData: jest.fn()
};

// Mock N8N webhook endpoint
const mockN8NWebhook = jest.fn();

describe('OCR Processing Tests', () => {
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

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Happy Path OCR Tests', () => {
    test('Perfect receipt OCR - All fields extracted correctly', async () => {
      // Mock successful OCR processing
      mockOCRService.processReceipt.mockResolvedValue(testOCRResults.happyPath);
      
      const telegramMessage = {
        message_id: 123,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_123' }]
      };

      // Mock image download and processing
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.extractText.mockResolvedValue('Starbucks Coffee\nJan 15, 2024 09:30\nCappuccino $4.20\nCroissant $1.20\nTotal: $5.40\nVisa ending in 1234\nOrchard Road, Singapore');
      mockOCRService.parseReceiptData.mockReturnValue(testOCRResults.happyPath);

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.vendor).toBe('Starbucks Coffee');
      expect(processingResult.expense.amount_sgd).toBe(5.40);
      expect(processingResult.expense.category).toBe('Food & Beverage');
      expect(processingResult.expense.location).toBe('Orchard Road, Singapore');
      expect(processingResult.expense.needs_review).toBe(false);

      // Verify expense is stored in database
      const storedExpense = await testDb.query(
        'SELECT * FROM expenses WHERE user_id = $1 AND vendor = $2',
        [testUserId, 'Starbucks Coffee']
      );
      expect(storedExpense.rows).toHaveLength(1);
      expect(storedExpense.rows[0].amount_sgd).toBe(5.40);
      expect(storedExpense.rows[0].needs_review).toBe(false);
    });

    test('Clear receipt with multiple items - Line item extraction', async () => {
      const multiItemReceipt = {
        vendor: 'FairPrice Finest',
        date: '2024-01-15',
        time: '14:30:00',
        amount: 45.67,
        currency: 'SGD',
        items: [
          { name: 'Organic Milk', price: 6.50 },
          { name: 'Whole Wheat Bread', price: 3.20 },
          { name: 'Fresh Apples (1kg)', price: 8.90 },
          { name: 'Chicken Breast', price: 12.80 },
          { name: 'Pasta Sauce', price: 4.27 },
          { name: 'GST (9%)', price: 3.78 }
        ],
        location: 'Tampines Mall',
        payment_method: 'Nets'
      };

      mockOCRService.processReceipt.mockResolvedValue(multiItemReceipt);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(multiItemReceipt);

      const telegramMessage = {
        message_id: 124,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_124' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.vendor).toBe('FairPrice Finest');
      expect(processingResult.expense.amount_sgd).toBe(45.67);
      expect(processingResult.expense.category).toBe('Groceries');
      expect(processingResult.expense.needs_review).toBe(false);

      // Verify line items are stored or processed correctly
      expect(processingResult.expense.comment).toContain('Organic Milk');
      expect(processingResult.expense.comment).toContain('6 items');
    });

    test('Receipt with tax and service charges', async () => {
      const restaurantReceipt = {
        vendor: 'The Italian Restaurant',
        date: '2024-01-15',
        time: '19:45:00',
        amount: 68.85,
        currency: 'SGD',
        items: [
          { name: 'Margherita Pizza', price: 18.00 },
          { name: 'Caesar Salad', price: 12.00 },
          { name: 'Tiramisu', price: 8.00 },
          { name: 'Soft Drink', price: 4.00 },
          { name: 'Subtotal', price: 42.00 },
          { name: 'Service Charge (10%)', price: 4.20 },
          { name: 'GST (9%)', price: 4.16 },
          { name: 'Total', price: 50.36 }
        ],
        location: 'Clarke Quay',
        payment_method: 'Mastercard'
      };

      mockOCRService.processReceipt.mockResolvedValue(restaurantReceipt);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(restaurantReceipt);

      const telegramMessage = {
        message_id: 125,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_125' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.amount_sgd).toBe(50.36); // Final total
      expect(processingResult.expense.category).toBe('Food & Beverage');
      expect(processingResult.expense.needs_review).toBe(false);
    });

    test('Different currencies with auto-conversion', async () => {
      const foreignCurrencyReceipt = {
        vendor: 'Tokyu Hands',
        date: '2024-01-15',
        time: '11:20:00',
        amount: 1500.00,
        currency: 'JPY',
        amount_sgd: 13.50, // Converted amount
        items: [
          { name: 'Stationery Set', price: 1500.00 }
        ],
        location: 'Shibuya, Tokyo',
        payment_method: 'Credit Card'
      };

      mockOCRService.processReceipt.mockResolvedValue(foreignCurrencyReceipt);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(foreignCurrencyReceipt);

      const telegramMessage = {
        message_id: 126,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_126' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.amount_original).toBe(1500.00);
      expect(processingResult.expense.currency).toBe('JPY');
      expect(processingResult.expense.amount_sgd).toBe(13.50);
      expect(processingResult.expense.category).toBe('Shopping');
      expect(processingResult.expense.needs_review).toBe(false);
    });
  });

  describe('Fix Path OCR Tests', () => {
    test('Partially readable receipt - Some fields missing', async () => {
      mockOCRService.processReceipt.mockResolvedValue(testOCRResults.fixPath);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.extractText.mockResolvedValue(' blurry text... 25.50 SGD');
      mockOCRService.parseReceiptData.mockReturnValue(testOCRResults.fixPath);

      const telegramMessage = {
        message_id: 127,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_127' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true); // Still successful but needs review
      expect(processingResult.expense.amount_sgd).toBe(25.50);
      expect(processingResult.expense.vendor).toBe('Unknown Vendor');
      expect(processingResult.expense.category).toBe('Others');
      expect(processingResult.expense.needs_review).toBe(true);
      expect(processingResult.expense.comment).toContain('OCR partial extraction');

      // Verify expense is stored but flagged for review
      const storedExpense = await testDb.query(
        'SELECT * FROM expenses WHERE user_id = $1 AND needs_review = true',
        [testUserId]
      );
      expect(storedExpense.rows).toHaveLength(1);
    });

    test('Blurry or low-quality image - Limited text extraction', async () => {
      const blurryResult = {
        vendor: ' unclear text',
        date: null,
        amount: 18.75,
        currency: 'SGD',
        items: null,
        location: ' Partially readable',
        payment_method: null
      };

      mockOCRService.processReceipt.mockResolvedValue(blurryResult);
      mockOCRService.validateImage.mockReturnValue(true); // Still valid image
      mockOCRService.extractText.mockResolvedValue('Very blurry text... $18.75');
      mockOCRService.parseReceiptData.mockReturnValue(blurryResult);

      const telegramMessage = {
        message_id: 128,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_128' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.amount_sgd).toBe(18.75);
      expect(processingResult.expense.needs_review).toBe(true);
      expect(processingResult.expense.category).toBe('Others');
      expect(processingResult.warnings).toContain('Low image quality');
    });

    test('Receipt in foreign language with partial translation', async () => {
      const foreignLanguageResult = {
        vendor: '便利店', // Japanese for convenience store
        date: '2024-01-15',
        amount: 850.00,
        currency: 'JPY',
        amount_sgd: 7.65,
        items: [
          { name: '未翻訳商品1', price: 500.00 }, // Untranslated item 1
          { name: 'Translated Item', price: 350.00 }
        ],
        location: '日本', // Japan
        payment_method: null
      };

      mockOCRService.processReceipt.mockResolvedValue(foreignLanguageResult);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(foreignLanguageResult);

      const telegramMessage = {
        message_id: 129,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_129' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.amount_sgd).toBe(7.65);
      expect(processingResult.expense.needs_review).toBe(true); // Due to foreign language
      expect(processingResult.expense.category).toBe('Others'); // Can't categorize accurately
      expect(processingResult.warnings).toContain('Foreign language detected');
    });

    test('Receipt with handwritten annotations', async () => {
      const handwrittenResult = {
        vendor: 'Store Name',
        date: '2024-01-15',
        amount: 42.00,
        currency: 'SGD',
        items: [
          { name: 'Item 1', price: 20.00 },
          { name: 'Item 2', price: 15.00 },
          { name: 'handwritten note: split with John', price: 7.00 }
        ],
        location: 'Office Canteen',
        payment_method: 'Cash'
      };

      mockOCRService.processReceipt.mockResolvedValue(handwrittenResult);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(handwrittenResult);

      const telegramMessage = {
        message_id: 130,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_130' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.amount_sgd).toBe(42.00);
      expect(processingResult.expense.needs_review).toBe(true); // Due to handwritten notes
      expect(processingResult.expense.comment).toContain('handwritten');
    });

    test('Damaged or torn receipt', async () => {
      const damagedResult = {
        vendor: 'Supermar',
        date: '2024-01',
        amount: 23.40,
        currency: 'SGD',
        items: [
          { name: 'Product 1', price: 12.50 },
          { name: 'P', price: 10.90 } // Incomplete item name
        ],
        location: null,
        payment_method: null
      };

      mockOCRService.processReceipt.mockResolvedValue(damagedResult);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(damagedResult);

      const telegramMessage = {
        message_id: 131,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_131' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.vendor).toBe('Supermar'); // Truncated name
      expect(processingResult.expense.needs_review).toBe(true);
      expect(processingResult.warnings).toContain('Damaged receipt detected');
    });
  });

  describe('Edge Path OCR Tests', () => {
    test('No receipt detected in image', async () => {
      mockOCRService.processReceipt.mockResolvedValue(testOCRResults.edgePath);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.extractText.mockResolvedValue('No receipt content found');
      mockOCRService.parseReceiptData.mockReturnValue(testOCRResults.edgePath);

      const telegramMessage = {
        message_id: 132,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_132' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('No receipt detected');
      expect(processingResult.recommendation).toContain('Try again');
    });

    test('Corrupted or invalid image file', async () => {
      mockOCRService.validateImage.mockReturnValue(false);
      mockOCRService.processReceipt.mockRejectedValue(new Error('Invalid image format'));

      const telegramMessage = {
        message_id: 133,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'corrupted_image_133' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('Invalid image');
      expect(processingResult.recommendation).toContain('send a clear photo');
    });

    test('User cancels processing', async () => {
      const telegramMessage = {
        message_id: 134,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        text: '/cancel'
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('Processing cancelled');
      expect(processingResult.status).toBe('cancelled');
    });

    test('Multiple receipts in single image', async () => {
      mockOCRService.processReceipt.mockRejectedValue(new Error('Multiple receipts detected'));
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.extractText.mockResolvedValue('Multiple receipt templates detected');

      const telegramMessage = {
        message_id: 135,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'multiple_receipts_135' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('Multiple receipts');
      expect(processingResult.recommendation).toContain('one receipt at a time');
    });

    test('User doesn\'t respond to prompts', async () => {
      const telegramMessage = {
        message_id: 136,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_136' }]
      };

      // Mock timeout scenario
      mockOCRService.processReceipt.mockImplementation(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Processing timeout')), 1000);
        })
      );

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('timeout');
      expect(processingResult.recommendation).toContain('try again');
    });

    test('Empty or blank image', async () => {
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.extractText.mockResolvedValue('');
      mockOCRService.parseReceiptData.mockReturnValue(testOCRResults.edgePath);

      const telegramMessage = {
        message_id: 137,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'blank_image_137' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('No text extracted');
    });

    test('Image with text but no receipt structure', async () => {
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.extractText.mockResolvedValue('This is just a document with text, not a receipt');
      mockOCRService.parseReceiptData.mockReturnValue(testOCRResults.edgePath);

      const telegramMessage = {
        message_id: 138,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'document_not_receipt_138' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('Not a receipt');
    });
  });

  describe('OCR Performance and Reliability Tests', () => {
    test('Large file processing', async () => {
      const largeImageResult = {
        vendor: 'Mega Store',
        date: '2024-01-15',
        amount: 1250.00,
        currency: 'SGD',
        items: Array(50).fill(null).map((_, i) => ({ name: `Item ${i + 1}`, price: 25.00 })),
        location: 'Large Mall',
        payment_method: 'Credit Card'
      };

      mockOCRService.processReceipt.mockResolvedValue(largeImageResult);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(largeImageResult);

      const startTime = Date.now();
      
      const telegramMessage = {
        message_id: 139,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'large_receipt_139' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);
      
      const processingTime = Date.now() - startTime;

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.amount_sgd).toBe(1250.00);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('Concurrent receipt processing', async () => {
      const concurrentMessages = Array(5).fill(null).map((_, i) => ({
        message_id: 140 + i,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: `concurrent_receipt_${140 + i}` }]
      }));

      mockOCRService.processReceipt.mockResolvedValue({
        vendor: `Concurrent Store ${Date.now()}`,
        amount: 10.00 * Math.random(),
        currency: 'SGD'
      });
      mockOCRService.validateImage.mockReturnValue(true);

      const processingPromises = concurrentMessages.map(msg => 
        processReceiptImage(msg, testBotId)
      );

      const results = await Promise.all(processingPromises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.expense).toBeDefined();
      });
    });

    test('OCR service unavailable', async () => {
      mockOCRService.processReceipt.mockRejectedValue(new Error('OCR service unavailable'));
      mockOCRService.validateImage.mockReturnValue(true);

      const telegramMessage = {
        message_id: 145,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_145' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('OCR service');
      expect(processingResult.recommendation).toContain('try again later');
    });
  });

  describe('Data Validation and Sanitization Tests', () => {
    test('Invalid amount values', async () => {
      const invalidAmountResult = {
        vendor: 'Test Store',
        date: '2024-01-15',
        amount: 'invalid_amount',
        currency: 'SGD'
      };

      mockOCRService.processReceipt.mockResolvedValue(invalidAmountResult);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(invalidAmountResult);

      const telegramMessage = {
        message_id: 146,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_146' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(false);
      expect(processingResult.error).toContain('Invalid amount');
    });

    test('Extremely long vendor names', async () => {
      const longNameResult = {
        vendor: 'A'.repeat(300), // Very long name
        date: '2024-01-15',
        amount: 10.00,
        currency: 'SGD'
      };

      mockOCRService.processReceipt.mockResolvedValue(longNameResult);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(longNameResult);

      const telegramMessage = {
        message_id: 147,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_147' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.vendor.length).toBeLessThanOrEqual(255); // Database limit
      expect(processingResult.expense.needs_review).toBe(true);
    });

    test('SQL injection attempts in OCR results', async () => {
      const maliciousResult = {
        vendor: "'; DROP TABLE expenses; --",
        date: '2024-01-15',
        amount: 10.00,
        currency: 'SGD'
      };

      mockOCRService.processReceipt.mockResolvedValue(maliciousResult);
      mockOCRService.validateImage.mockReturnValue(true);
      mockOCRService.parseReceiptData.mockReturnValue(maliciousResult);

      const telegramMessage = {
        message_id: 148,
        from: { id: testUserId, username: 'testuser' },
        chat: { id: testUserId, type: 'private' },
        photo: [{ file_id: 'receipt_photo_148' }]
      };

      const processingResult = await processReceiptImage(telegramMessage, testBotId);

      expect(processingResult.success).toBe(true);
      expect(processingResult.expense.vendor).toContain("DROP TABLE expenses; --"); // Sanitized but stored
      expect(processingResult.expense.needs_review).toBe(true);
    });
  });
});

// Helper function to simulate receipt processing
async function processReceiptImage(telegramMessage: any, botId: number): Promise<any> {
  try {
    // Validate image
    if (!mockOCRService.validateImage()) {
      return {
        success: false,
        error: 'Invalid image format',
        recommendation: 'Please send a clear photo of your receipt'
      };
    }

    // Extract text
    const extractedText = await mockOCRService.extractText();
    if (!extractedText || extractedText.trim() === '') {
      return {
        success: false,
        error: 'No text extracted from image',
        recommendation: 'Please ensure the receipt is clearly visible'
      };
    }

    // Process with OCR
    const ocrResult = await mockOCRService.processReceipt();
    
    if (!ocrResult.vendor && !ocrResult.amount) {
      return {
        success: false,
        error: 'No receipt detected in image',
        recommendation: 'Please send a clear photo of a receipt'
      };
    }

    // Sanitize and validate data
    const sanitizedResult = sanitizeOCRResult(ocrResult);
    
    // Store in database (simplified)
    await testDb.query(
      `INSERT INTO expenses (user_id, bot_id, expense_date, vendor, amount_sgd, category, needs_review, comment) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        telegramMessage.from.id,
        botId,
        sanitizedResult.date || new Date().toISOString().split('T')[0],
        sanitizedResult.vendor || 'Unknown Vendor',
        sanitizedResult.amount || 0,
        sanitizedResult.category || 'Others',
        sanitizedResult.needs_review || false,
        sanitizedResult.comment || ''
      ]
    );

    return {
      success: true,
      expense: sanitizedResult,
      warnings: sanitizedResult.warnings || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      recommendation: 'Please try again or contact support'
    };
  }
}

function sanitizeOCRResult(result: any): any {
  const sanitized = {
    vendor: result.vendor || 'Unknown Vendor',
    amount_sgd: parseFloat(result.amount) || 0,
    currency: result.currency || 'SGD',
    date: result.date,
    category: categorizeExpense(result.vendor, result.items),
    needs_review: false,
    comment: '',
    warnings: []
  };

  // Truncate long vendor names
  if (sanitized.vendor.length > 255) {
    sanitized.vendor = sanitized.vendor.substring(0, 252) + '...';
    sanitized.needs_review = true;
    sanitized.warnings.push('Vendor name truncated');
  }

  // Check for partial data
  if (!result.vendor || !result.date || !result.payment_method) {
    sanitized.needs_review = true;
    sanitized.warnings.push('Incomplete OCR extraction');
  }

  // Check for foreign language
  if (/[^\x00-\x7F]/.test(sanitized.vendor)) {
    sanitized.needs_review = true;
    sanitized.warnings.push('Foreign language detected');
  }

  // Add items to comment if available
  if (result.items && Array.isArray(result.items)) {
    sanitized.comment = `${result.items.length} items extracted`;
  }

  return sanitized;
}

function categorizeExpense(vendor?: string, items?: any[]): string {
  if (!vendor) return 'Others';
  
  const vendorLower = vendor.toLowerCase();
  
  if (vendorLower.includes('starbucks') || vendorLower.includes('coffee') || vendorLower.includes('mcdonald')) {
    return 'Food & Beverage';
  } else if (vendorLower.includes('shell') || vendorLower.includes('petrol') || vendorLower.includes('taxi')) {
    return 'Transportation';
  } else if (vendorLower.includes('h&m') || vendorLower.includes('uniqlo') || vendorLower.includes('shop')) {
    return 'Shopping';
  } else if (items && items.some(item => item.name.toLowerCase().includes('milk') || item.name.toLowerCase().includes('bread'))) {
    return 'Groceries';
  }
  
  return 'Others';
}