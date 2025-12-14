-- =============================================
-- 003: Venue Catalog
-- Curated venues with Google Places data + tags
-- =============================================

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,

  -- Google Places data
  name TEXT NOT NULL,
  formatted_address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  city TEXT NOT NULL,                            -- For geo-filtering
  google_rating DECIMAL(2, 1),
  google_price_level INT,                        -- 0-4
  opening_hours JSONB,
  photo_references JSONB DEFAULT '[]',

  -- Primary tags (CEO assigned)
  taste_cluster TEXT NOT NULL,                   -- coffee, dining, nightlife, etc.
  cuisine_type TEXT,                             -- japanese, mexican, etc. (if dining)
  price_tier TEXT,                               -- $, $$, $$$, $$$$

  -- Secondary tags (GPT generated)
  energy TEXT,                                   -- chill, buzzy, lively
  date_friendly BOOLEAN DEFAULT false,
  group_friendly BOOLEAN DEFAULT false,
  cozy BOOLEAN DEFAULT false,
  vibe_tags JSONB DEFAULT '[]',                  -- [romantic, trendy, hidden_gem]

  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues (city);
CREATE INDEX IF NOT EXISTS idx_venues_cluster ON venues (taste_cluster);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues (is_active) WHERE is_active = true;

-- Bookmarks (saved venues)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, venue_id)
);

-- User playlists (collections)
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist venues (many-to-many)
CREATE TABLE IF NOT EXISTS playlist_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  position INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(playlist_id, venue_id)
);

-- Enable Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_venues ENABLE ROW LEVEL SECURITY;

-- Venues are publicly readable (curated list)
CREATE POLICY "Venues are publicly readable"
  ON venues FOR SELECT
  USING (is_active = true);

-- Service role can manage venues
CREATE POLICY "Service role can manage venues"
  ON venues FOR ALL
  USING (true);

-- Bookmarks RLS
CREATE POLICY "Users can manage own bookmarks"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- Playlists RLS
CREATE POLICY "Users can manage own playlists"
  ON playlists FOR ALL
  USING (auth.uid() = user_id);

-- Playlist venues - users can manage venues in their playlists
CREATE POLICY "Users can manage own playlist venues"
  ON playlist_venues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_venues.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Update triggers
CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
