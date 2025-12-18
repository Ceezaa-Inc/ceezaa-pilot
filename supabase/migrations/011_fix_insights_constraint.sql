-- Fix daily_insights constraint to allow multiple insights per user per day
-- The old constraint only allowed 1 insight per user per day, but we need 2-3

-- Drop the existing unique constraint
ALTER TABLE daily_insights
DROP CONSTRAINT IF EXISTS daily_insights_user_id_shown_at_key;

-- Add new constraint that allows multiple insights per day (unique by user + date + type)
ALTER TABLE daily_insights
ADD CONSTRAINT daily_insights_user_date_type_key
UNIQUE (user_id, shown_at, insight_type);
