-- =============================================
-- 009: Add Cuisine Tracking Fields
-- Adds cuisine extraction support for richer taste profiles
-- =============================================

-- Add cuisine column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS cuisine TEXT;

-- Add cuisine tracking columns to user_analysis table
ALTER TABLE user_analysis
ADD COLUMN IF NOT EXISTS cuisines JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS top_cuisines JSONB NOT NULL DEFAULT '[]';

-- Create index for cuisine queries
CREATE INDEX IF NOT EXISTS idx_transactions_cuisine
  ON transactions (cuisine)
  WHERE cuisine IS NOT NULL;
