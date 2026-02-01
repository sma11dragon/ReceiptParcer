-- ============================================
-- Create n8n Service Account for ReceiptAI API
-- ============================================
-- Run this in your PostgreSQL database client (pgAdmin, DBeaver, etc.)
-- Make sure you're connected to the 'sma11dragon_DB' database

-- Step 1: Check if service account already exists
SELECT id, username, email, is_verified 
FROM users 
WHERE email = 'n8n-service@receiptai.com';

-- If the query returns a row, note the user ID and skip to Step 3
-- If no rows returned, proceed to Step 2

-- Step 2: Create the service account
-- Note: You need to generate a bcrypt hash for the password
-- You can use an online bcrypt generator or run: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourSecurePassword123!', 12).then(console.log)"
-- Replace 'YourSecurePassword123!' with a strong password

INSERT INTO users (
  username, 
  email, 
  password_hash, 
  is_verified, 
  location,
  created_at
) VALUES (
  'n8n-service',
  'n8n-service@receiptai.com',
  -- REPLACE THIS WITH YOUR GENERATED BCRYPT HASH
  -- Example: '$2a$12$X8xX8xX8xX8xX8xX8xX8x.X8xX8xX8xX8xX8xX8xX8xX8xX8xX8x',
  '$2a$12$YourGeneratedBcryptHashHere',
  true,
  'Automation',
  NOW()
) RETURNING id, username, email;

-- Step 3: Verify the account was created
SELECT id, username, email, is_verified 
FROM users 
WHERE email = 'n8n-service@receiptai.com';

-- Step 4: Note the user ID for token generation
-- The user ID will be shown in the results (e.g., 3, 4, 5, etc.)
-- You'll need this ID to generate the JWT token

-- ============================================
-- Optional: Create a dedicated bot for n8n service
-- ============================================

-- If you want to track n8n activities separately in user_telegram_bots table:
/*
INSERT INTO user_telegram_bots (
  user_id,
  bot_token,
  bot_username,
  is_active
) VALUES (
  (SELECT id FROM users WHERE email = 'n8n-service@receiptai.com'),
  'n8n-service-bot',
  'n8n_service_bot',
  true
);
*/

-- ============================================
-- Troubleshooting
-- ============================================

-- If you get an error about duplicate email:
-- DELETE FROM users WHERE email = 'n8n-service@receiptai.com';
-- Then run the INSERT again

-- To check all users:
-- SELECT id, username, email, is_verified FROM users ORDER BY id;

-- To delete the service account if needed:
-- DELETE FROM users WHERE email = 'n8n-service@receiptai.com';