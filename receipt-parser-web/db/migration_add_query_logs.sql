-- Migration: Create query_logs table for AI query feedback loop
-- This table stores logs of user queries to enable self-learning and improvement
-- of the AI query classification system

-- Create the query_logs table
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

-- Create indexes for efficient querying and analysis
CREATE INDEX IF NOT EXISTS idx_query_logs_timestamp ON query_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_query_logs_chat_id ON query_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_outcome_type ON query_logs(outcome_type);
CREATE INDEX IF NOT EXISTS idx_query_logs_result_count ON query_logs(result_count);

-- Create GIN index for JSONB columns to enable efficient filtering
CREATE INDEX IF NOT EXISTS idx_query_logs_classification_json ON query_logs USING GIN (classification_json);
CREATE INDEX IF NOT EXISTS idx_query_logs_filters_applied ON query_logs USING GIN (filters_applied);

-- Verify the table creation
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
    (SELECT count(*) FROM query_logs) as row_count
FROM information_schema.tables 
WHERE table_name = 'query_logs';

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'query_logs'
ORDER BY ordinal_position;