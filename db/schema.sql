-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  location VARCHAR(100),
  telegram_chat_id BIGINT UNIQUE,
  telegram_bot_username VARCHAR(100),
  telegram_bot_token VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
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
