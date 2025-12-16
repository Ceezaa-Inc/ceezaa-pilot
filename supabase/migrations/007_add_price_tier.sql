-- =============================================
-- 007: Add price_tier to declared_taste
-- Tracks user's preferred price range from quiz
-- =============================================

ALTER TABLE declared_taste
ADD COLUMN IF NOT EXISTS price_tier TEXT;
-- Values: 'budget', 'moderate', 'premium', 'luxury'

COMMENT ON COLUMN declared_taste.price_tier IS 'User preferred price range: budget, moderate, premium, luxury';
