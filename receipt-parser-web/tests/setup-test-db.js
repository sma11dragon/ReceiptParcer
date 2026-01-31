# Test Database Setup Script

const { Pool } = require('pg');

async function setupTestDatabase() {
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_receiptai',
  });

  try {
    console.log('Setting up test database...');

    // Create test schema
    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_telegram_bots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bot_token TEXT UNIQUE NOT NULL,
        bot_username TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
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
        needs_review BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        token VARCHAR(64) UNIQUE NOT NULL,
        type VARCHAR(20) CHECK (type IN ('email', 'telegram_link')),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id ON users(telegram_user_id);');

    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupTestDatabase().catch(console.error);
}

module.exports = { setupTestDatabase };