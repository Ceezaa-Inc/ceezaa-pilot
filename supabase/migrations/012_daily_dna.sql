-- Daily DNA traits table for caching AI-generated taste DNA
-- Stores 4 personalized traits per user, refreshed daily

CREATE TABLE daily_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  shown_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, shown_at, trait_name)
);

-- Index for efficient lookups
CREATE INDEX idx_daily_dna_user_date ON daily_dna(user_id, shown_at);

-- Enable RLS
ALTER TABLE daily_dna ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own DNA traits
CREATE POLICY "Users can view own DNA" ON daily_dna
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: service role can manage all
CREATE POLICY "Service role full access" ON daily_dna
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
