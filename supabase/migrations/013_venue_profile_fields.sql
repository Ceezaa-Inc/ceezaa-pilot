-- =============================================
-- 013: Venue Profile Fields
-- Add AI-generated profile fields for taste matching
-- =============================================

-- Tagline: 8-12 word punchy description of the venue
ALTER TABLE venues ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Best for: max 3 occasions from predefined list
-- [date_night, group_celebration, solo_work, business_lunch, casual_hangout, late_night, family_outing, quick_bite]
ALTER TABLE venues ADD COLUMN IF NOT EXISTS best_for JSONB DEFAULT '[]';

-- Standout: max 2 qualities from predefined list
-- [hidden_gem, local_favorite, instagram_worthy, cult_following, cozy_vibes, upscale_feel]
ALTER TABLE venues ADD COLUMN IF NOT EXISTS standout JSONB DEFAULT '[]';

-- Index for filtering by best_for occasions (GIN for JSONB array containment)
CREATE INDEX IF NOT EXISTS idx_venues_best_for ON venues USING GIN (best_for);

-- Index for filtering by standout qualities
CREATE INDEX IF NOT EXISTS idx_venues_standout ON venues USING GIN (standout);
