-- Add usage tracking table
CREATE TABLE IF NOT EXISTS usage (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  total_requests INTEGER NOT NULL DEFAULT 0,
  extract_requests INTEGER NOT NULL DEFAULT 0,
  query_requests INTEGER NOT NULL DEFAULT 0,
  anthropic_requests INTEGER NOT NULL DEFAULT 0,
  openai_requests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);
