-- Migration: Add telegram_user_id column to users table
-- This field stores the Telegram user ID to link web app users with their Telegram accounts
-- It will be populated when users first interact with their bot (e.g., send /start)

-- Add the telegram_user_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT UNIQUE;

-- Create indexes for faster lookups by Telegram identifiers
CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id ON users(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('telegram_user_id', 'telegram_chat_id', 'telegram_bot_username', 'telegram_bot_token')
ORDER BY ordinal_position;
