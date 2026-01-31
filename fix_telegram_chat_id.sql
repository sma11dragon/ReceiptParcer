-- Fix for Telegram Chat ID capture issue
-- This script creates a function to update both verification_tokens and users tables

-- Function to update user's telegram IDs after token verification
CREATE OR REPLACE FUNCTION update_user_telegram_ids(
    p_token VARCHAR(64),
    p_telegram_user_id BIGINT,
    p_telegram_username VARCHAR(255),
    p_telegram_chat_id BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Get user_id from token
    SELECT vt.user_id INTO v_user_id
    FROM verification_tokens vt
    WHERE vt.token = p_token 
      AND vt.type = 'telegram'
      AND vt.expires_at > NOW();
    
    IF v_user_id IS NULL THEN
        RETURN 0; -- Token not found or expired
    END IF;
    
    -- Update verification_tokens
    UPDATE verification_tokens
    SET 
        telegram_user_id = p_telegram_user_id,
        telegram_username = p_telegram_username,
        verified_at = NOW()
    WHERE token = p_token;
    
    -- Update users table
    UPDATE users
    SET 
        telegram_user_id = p_telegram_user_id,
        telegram_chat_id = p_telegram_chat_id,
        is_verified = true
    WHERE id = v_user_id;
    
    RETURN 1; -- Success
END;
$$ LANGUAGE plpgsql;

-- Test the function (commented out)
-- SELECT update_user_telegram_ids('TEST_TOKEN', 123456789, 'testuser', 123456789);

-- Also create a function to lookup user by bot token (for wrapper workflow)
CREATE OR REPLACE FUNCTION get_user_by_bot_token_or_chat_id(
    p_bot_token VARCHAR(100),
    p_chat_id BIGINT
) RETURNS TABLE(
    user_id INTEGER,
    telegram_bot_token VARCHAR(100),
    telegram_bot_username VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.telegram_bot_token,
        u.telegram_bot_username
    FROM users u
    WHERE (u.telegram_chat_id = p_chat_id OR u.telegram_bot_token = p_bot_token)
      AND u.telegram_bot_token IS NOT NULL
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update wrapper workflow SQL to use this function:
-- Original: SELECT u.id as user_id, u.telegram_bot_token, u.telegram_bot_username FROM users u WHERE u.telegram_chat_id = {{ $json.chat_id }} LIMIT 1
-- New: SELECT * FROM get_user_by_bot_token_or_chat_id('{{ $json.bot_token_from_webhook }}', {{ $json.chat_id }})

-- Check current state
SELECT 'Current users without telegram_chat_id:' as status;
SELECT id, username, email, telegram_chat_id, telegram_user_id 
FROM users 
WHERE telegram_chat_id IS NULL AND telegram_bot_token IS NOT NULL;

SELECT 'Current verification_tokens:' as status;
SELECT id, user_id, token, type, expires_at, telegram_user_id, telegram_username, verified_at
FROM verification_tokens 
WHERE type = 'telegram' 
ORDER BY created_at DESC;