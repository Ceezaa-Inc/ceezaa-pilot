-- Add emoji column to daily_insights table for AI-generated insights
-- FS5: AI Insights

ALTER TABLE daily_insights ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Add index for faster lookups by user and date
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_shown
  ON daily_insights (user_id, shown_at);
