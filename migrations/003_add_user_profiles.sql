-- Migration: Add user_profiles table
-- Created: 2025-10-24

CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  
  -- Basic info
  age INTEGER,
  gender TEXT,
  occupation TEXT,
  
  -- Sleep schedule
  current_wake_time TEXT,
  ideal_wake_time TEXT,
  current_bedtime TEXT,
  ideal_bedtime TEXT,
  
  -- General context for AI
  bio TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
