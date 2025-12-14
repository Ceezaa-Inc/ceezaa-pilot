-- =============================================
-- 005: Vault (Place Visits)
-- Track user visits with reactions and notes
-- =============================================

CREATE TABLE IF NOT EXISTS place_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id),           -- NULL if from transaction only
  transaction_id UUID REFERENCES transactions(id),

  -- Visit data
  visited_at TIMESTAMPTZ NOT NULL,
  merchant_name TEXT,                            -- From transaction or manual
  amount DECIMAL(12,2),                          -- From transaction

  -- User additions
  reaction TEXT,                                 -- love, good, meh, never_again
  notes TEXT,
  mood_tags JSONB DEFAULT '[]',                  -- User-selected mood tags

  -- Source tracking
  source TEXT DEFAULT 'transaction',             -- transaction, manual

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_place_visits_user_date
  ON place_visits (user_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_place_visits_user_venue
  ON place_visits (user_id, venue_id);

CREATE INDEX IF NOT EXISTS idx_place_visits_reaction
  ON place_visits (user_id, reaction);

-- Enable Row Level Security
ALTER TABLE place_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own place visits"
  ON place_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own place visits"
  ON place_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own place visits"
  ON place_visits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own place visits"
  ON place_visits FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert visits (for auto-creation from transactions)
CREATE POLICY "Service role can insert place visits"
  ON place_visits FOR INSERT
  WITH CHECK (true);

-- Update trigger
CREATE TRIGGER place_visits_updated_at
  BEFORE UPDATE ON place_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
