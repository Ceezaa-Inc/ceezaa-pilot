-- =============================================
-- 014: Google Places Enhancement
-- Add new Places API fields and cache table
-- =============================================

-- ===========================================
-- PART 1: New columns on venues table
-- ===========================================

-- Google Review Count (userRatingCount from Places API)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_review_count INT;

-- Direct link to Google Maps
ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_maps_uri TEXT;

-- Primary type from Places API (restaurant, cafe, bar, etc.)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS primary_type TEXT;

-- Atmosphere attributes from Places API
ALTER TABLE venues ADD COLUMN IF NOT EXISTS good_for_groups BOOLEAN;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS outdoor_seating BOOLEAN;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS reservable BOOLEAN;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS delivery BOOLEAN;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS takeout BOOLEAN;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS dine_in BOOLEAN;

-- AI summaries from Places API
ALTER TABLE venues ADD COLUMN IF NOT EXISTS editorial_summary TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS generative_summary TEXT;

-- Source tracking: 'discover' (text search) or 'transaction' (vault match)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'discover';

-- Website URI from Places API
ALTER TABLE venues ADD COLUMN IF NOT EXISTS website_uri TEXT;

-- Index for filtering by primary_type
CREATE INDEX IF NOT EXISTS idx_venues_primary_type ON venues (primary_type);

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_venues_source ON venues (source);

-- ===========================================
-- PART 2: Places lookup cache table
-- Prevents duplicate API calls for merchant matching
-- ===========================================

CREATE TABLE IF NOT EXISTS places_lookup_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Search parameters
  merchant_name_normalized TEXT NOT NULL,  -- lowercase, trimmed
  merchant_name_original TEXT NOT NULL,    -- original from Plaid
  search_lat DECIMAL(10, 8),               -- location bias center
  search_lng DECIMAL(11, 8),

  -- Result (NULL means no match found)
  google_place_id TEXT,
  matched_name TEXT,
  formatted_address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on normalized name + location (grid cell)
  UNIQUE(merchant_name_normalized, search_lat, search_lng)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_places_cache_merchant
  ON places_lookup_cache (merchant_name_normalized);

-- Index for finding cached results by place_id
CREATE INDEX IF NOT EXISTS idx_places_cache_place_id
  ON places_lookup_cache (google_place_id) WHERE google_place_id IS NOT NULL;

-- Enable RLS
ALTER TABLE places_lookup_cache ENABLE ROW LEVEL SECURITY;

-- Service role can manage cache (no user access needed)
DROP POLICY IF EXISTS "Service role can manage places cache" ON places_lookup_cache;
CREATE POLICY "Service role can manage places cache"
  ON places_lookup_cache FOR ALL
  USING (true);

-- ===========================================
-- PART 3: Add location to transactions
-- For location-biased merchant matching
-- ===========================================

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- Index for finding transactions with location data
CREATE INDEX IF NOT EXISTS idx_transactions_location
  ON transactions (location_lat, location_lng)
  WHERE location_lat IS NOT NULL;
