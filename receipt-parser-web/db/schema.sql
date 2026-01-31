-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  location VARCHAR(100),
  telegram_chat_id BIGINT UNIQUE,
  telegram_user_id BIGINT UNIQUE,
  telegram_bot_username VARCHAR(100),
  telegram_bot_token VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Telegram Bots Table (for multi-bot support)
CREATE TABLE IF NOT EXISTS user_telegram_bots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bot_token TEXT UNIQUE NOT NULL,
  bot_username TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Add bot columns to existing users table
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_bot_username VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_bot_token VARCHAR(100);

-- Verification Tokens (for email or bot linking)
CREATE TABLE IF NOT EXISTS verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'email' or 'telegram_link'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table (managed by n8n workflow)
-- Note: user_id links to users.id for multi-user support
-- chat_id is kept for backward compatibility with Telegram
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),  -- Database user ID (for multi-user queries)
  bot_id INTEGER REFERENCES user_telegram_bots(id), -- Specific bot ID
  chat_id VARCHAR(50),                    -- Telegram chat ID (for backward compatibility)
  expense_date DATE,
  expense_time TIME,
  submitted_at TIMESTAMP WITH TIME ZONE,
  vendor VARCHAR(255),
  amount_original DECIMAL(12,2),
  currency VARCHAR(10),
  amount_sgd DECIMAL(12,2),
  exchange_rate DECIMAL(10,6),
  category VARCHAR(100),
  location VARCHAR(255),
  payment_method VARCHAR(50),
  comment TEXT,
  parsed_by VARCHAR(100),
  parsing_time DECIMAL(6,2),
  provider_tier VARCHAR(20),
  confidence_score INTEGER,
  receipt_image_url TEXT,
  drive_file_id VARCHAR(100),
  needs_review BOOLEAN DEFAULT FALSE,
  review_fields JSONB DEFAULT '{}',
  current_fix_index INTEGER DEFAULT 0,
  conversation_state VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Query Logs Table (for AI query feedback loop and self-learning)
CREATE TABLE IF NOT EXISTS query_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  chat_id BIGINT,
  message_text TEXT,
  classification_json JSONB,
  sql_query TEXT,
  result_count INTEGER,
  outcome_type VARCHAR(20), -- "invalid", "ambiguous", "empty", "success", "error"
  error_message TEXT,
  filters_applied JSONB,
  session_id UUID
);

-- Performance indexes for multi-user queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_chat_id ON expenses(chat_id);

-- Performance indexes for query logs analysis
CREATE INDEX IF NOT EXISTS idx_query_logs_timestamp ON query_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_query_logs_chat_id ON query_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_outcome_type ON query_logs(outcome_type);
CREATE INDEX IF NOT EXISTS idx_query_logs_result_count ON query_logs(result_count);
CREATE INDEX IF NOT EXISTS idx_query_logs_classification_json ON query_logs USING GIN (classification_json);
CREATE INDEX IF NOT EXISTS idx_query_logs_filters_applied ON query_logs USING GIN (filters_applied);
