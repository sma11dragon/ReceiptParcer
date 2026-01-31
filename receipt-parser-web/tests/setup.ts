import { Pool } from 'pg';

// Test database configuration
const testDb = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://root:112233_root@localhost:2665/sma11dragon_DB_test',
  ssl: false,
});

// Main database connection for cleanup
const mainDb = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://root:112233_root@localhost:2665/sma11dragon_DB',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

beforeAll(async () => {
  // Setup test database schema
  await setupTestDatabase();
});

afterAll(async () => {
  // Clean up test database
  await cleanupTestDatabase();
  await testDb.end();
  await mainDb.end();
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanupTestData();
});

async function setupTestDatabase() {
  try {
    // Create test schema if it doesn't exist
    await mainDb.query(`
      CREATE SCHEMA IF NOT EXISTS test_schema;
    `);

    // Create test tables
    await testDb.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        location VARCHAR(100),
        telegram_chat_id BIGINT UNIQUE,
        telegram_user_id BIGINT UNIQUE,
        telegram_bot_username VARCHAR(100),
        telegram_bot_token VARCHAR(100),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await testDb.query(`
      CREATE TABLE IF NOT EXISTS user_telegram_bots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bot_token TEXT UNIQUE NOT NULL,
        bot_username TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await testDb.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        bot_id INTEGER REFERENCES user_telegram_bots(id),
        chat_id VARCHAR(50),
        expense_date DATE NOT NULL,
        expense_time TIME,
        vendor VARCHAR(255),
        amount_original DECIMAL(12,2),
        currency VARCHAR(10),
        amount_sgd DECIMAL(12,2),
        category VARCHAR(100),
        location VARCHAR(255),
        payment_method VARCHAR(50),
        comment TEXT,
        receipt_image_url TEXT,
        receipt_session_id UUID DEFAULT gen_random_uuid(),
        queue_position INTEGER,
        row_version INTEGER DEFAULT 1,
        content_hash VARCHAR(64),
        needs_review BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await testDb.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        token VARCHAR(64) UNIQUE NOT NULL,
        type VARCHAR(20) CHECK (type IN ('email', 'telegram_link')),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    // Create indexes for performance
    await testDb.query('CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);');
    await testDb.query('CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);');
    await testDb.query('CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id ON users(telegram_user_id);');
    await testDb.query('CREATE INDEX IF NOT EXISTS idx_expenses_receipt_session_id ON expenses(receipt_session_id);');
    await testDb.query('CREATE INDEX IF NOT EXISTS idx_expenses_queue_position ON expenses(queue_position);');
    await testDb.query('CREATE INDEX IF NOT EXISTS idx_expenses_content_hash ON expenses(content_hash);');

    // Create functions
    await testDb.query(`
      CREATE OR REPLACE FUNCTION get_next_receipt_number()
      RETURNS INTEGER AS $$
      DECLARE
          next_pos INTEGER;
      BEGIN
          SELECT COALESCE(MAX(queue_position), 0) + 1 INTO next_pos FROM expenses;
          RETURN next_pos;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await testDb.query(`
      CREATE OR REPLACE FUNCTION update_pending_with_version(
          p_session_id UUID,
          p_current_version INTEGER
      )
      RETURNS BOOLEAN AS $$
      DECLARE
          updated_rows INTEGER;
      BEGIN
          UPDATE expenses
          SET 
              row_version = row_version + 1,
              updated_at = NOW()
          WHERE receipt_session_id = p_session_id
          AND row_version = p_current_version;
          
          GET DIAGNOSTICS updated_rows = ROW_COUNT;
          RETURN updated_rows > 0;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

async function cleanupTestDatabase() {
  try {
    // Drop all tables in reverse order of dependencies
    await testDb.query('DROP TABLE IF EXISTS verification_tokens CASCADE;');
    await testDb.query('DROP TABLE IF EXISTS expenses CASCADE;');
    await testDb.query('DROP TABLE IF EXISTS user_telegram_bots CASCADE;');
    await testDb.query('DROP TABLE IF EXISTS users CASCADE;');
    console.log('✅ Test database cleanup completed');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
  }
}

async function cleanupTestData() {
  try {
    // Clean up data between tests
    await testDb.query('DELETE FROM verification_tokens;');
    await testDb.query('DELETE FROM expenses;');
    await testDb.query('DELETE FROM user_telegram_bots;');
    await testDb.query('DELETE FROM users;');
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
  }
}

export { testDb, mainDb };

// Test data fixtures
export const testUsers = {
  validUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    location: 'Singapore'
  },
  incompleteUser: {
    username: 'incomplete',
    email: 'incomplete@example.com',
    password: 'password123'
  }
};

export const testBots = {
  validBot: {
    token: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    username: 'test_expense_bot'
  },
  invalidBot: {
    token: 'invalid_token',
    username: 'invalid_bot'
  }
};

export const testExpenses = {
  completeExpense: {
    expense_date: '2024-01-15',
    expense_time: '09:30:00',
    vendor: 'Starbucks',
    amount_original: 5.40,
    currency: 'SGD',
    amount_sgd: 5.40,
    category: 'Food & Beverage',
    location: 'Orchard Road',
    payment_method: 'Cash',
    comment: 'Morning coffee',
    receipt_image_url: 'https://example.com/receipt1.jpg'
  },
  partialExpense: {
    expense_date: '2024-01-15',
    vendor: 'Unknown Store',
    amount_sgd: 10.00,
    category: 'Others'
  }
};

export const testOCRResults = {
  happyPath: {
    vendor: 'Starbucks Coffee',
    date: '2024-01-15',
    time: '09:30:00',
    amount: 5.40,
    currency: 'SGD',
    items: [
      { name: 'Cappuccino', price: 4.20 },
      { name: 'Croissant', price: 1.20 }
    ],
    location: 'Orchard Road, Singapore',
    payment_method: 'Visa'
  },
  fixPath: {
    vendor: ' unclear text',
    date: null,
    amount: 25.50,
    currency: 'SGD',
    items: null,
    location: null,
    payment_method: null
  },
  edgePath: {
    vendor: null,
    date: null,
    amount: null,
    currency: null,
    items: null,
    location: null,
    payment_method: null
  }
};