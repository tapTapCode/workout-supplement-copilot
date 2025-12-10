-- Migration: Add password_hash column to users table
-- Run this in Supabase SQL Editor

-- Add password_hash column (nullable for existing users, required for new signups)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add comment
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for user authentication';

