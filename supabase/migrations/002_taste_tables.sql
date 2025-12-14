-- =============================================
-- 002: Taste Intelligence Tables
-- Quiz, Transactions, Analysis, Fused Taste
-- =============================================

-- Quiz answers (declared taste)
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,        -- 'ideal_saturday', 'coffee_routine', etc.
  answer_key TEXT NOT NULL,          -- 'cozy_dinner', 'third_wave', etc.
  answer_value JSONB,                -- Additional structured data
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, question_key)
);

-- Declared taste (processed quiz)
CREATE TABLE IF NOT EXISTS declared_taste (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vibe_preferences JSONB DEFAULT '[]',       -- ['chill', 'social']
  cuisine_preferences JSONB DEFAULT '[]',    -- ['japanese', 'mexican']
  dietary_restrictions JSONB DEFAULT '[]',   -- ['vegetarian']
  exploration_style TEXT,                    -- 'adventurous', 'routine'
  social_preference TEXT,                    -- 'solo', 'small_group', 'big_group'
  coffee_preference TEXT,                    -- 'third_wave', 'any', 'none'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid linked accounts
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL,
  plaid_access_token TEXT NOT NULL,
  institution_name TEXT,
  institution_id TEXT,
  account_mask TEXT,
  status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  cursor TEXT,                               -- Plaid sync cursor
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw transactions from Plaid
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  linked_account_id UUID REFERENCES linked_accounts(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT UNIQUE,
  amount DECIMAL(12,2),
  date DATE,
  datetime TIMESTAMPTZ,
  merchant_name TEXT,
  merchant_id TEXT,
  plaid_category_primary TEXT,
  plaid_category_detailed TEXT,
  taste_category TEXT,                       -- Our mapped category
  time_bucket TEXT,                          -- morning/afternoon/evening/night
  day_type TEXT,                             -- weekday/weekend
  location_city TEXT,
  location_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, date DESC);

-- User analysis (observed taste - TIL aggregates)
CREATE TABLE IF NOT EXISTS user_analysis (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Category aggregates
  categories JSONB NOT NULL DEFAULT '{}',        -- {coffee: {count: 43, spend: 215.50, merchants: [...]}}

  -- Time patterns
  time_buckets JSONB NOT NULL DEFAULT '{}',      -- {morning: 127, afternoon: 296, ...}
  day_types JSONB NOT NULL DEFAULT '{}',         -- {weekday: 524, weekend: 323}

  -- Merchant data
  merchant_visits JSONB NOT NULL DEFAULT '{}',   -- {merchant_id: visit_count}
  top_merchants JSONB NOT NULL DEFAULT '[]',     -- Cached top 10

  -- Behavioral patterns
  streaks JSONB NOT NULL DEFAULT '{}',           -- {coffee: {current: 5, longest: 12, last_date: ...}}
  exploration JSONB NOT NULL DEFAULT '{}',       -- {dining: {unique: 23, total: 67}}

  -- Meta
  total_transactions INT NOT NULL DEFAULT 0,
  first_transaction_at TIMESTAMPTZ,
  last_transaction_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INT NOT NULL DEFAULT 0                 -- Optimistic locking
);

-- Fused taste profile (declared + observed combined)
CREATE TABLE IF NOT EXISTS fused_taste (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  categories JSONB NOT NULL DEFAULT '{}',        -- Weighted category scores
  vibes JSONB NOT NULL DEFAULT '[]',             -- Combined vibe preferences
  exploration_ratio FLOAT,
  confidence FLOAT,                              -- Based on data volume
  mismatches JSONB DEFAULT '[]',                 -- Declared vs observed differences
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily insights
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT,                             -- streak, discovery, milestone
  title TEXT,
  body TEXT,
  source_data JSONB,
  shown_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, shown_at)
);

-- Enable Row Level Security
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE declared_taste ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE fused_taste ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own quiz responses"
  ON quiz_responses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own declared taste"
  ON declared_taste FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own linked accounts"
  ON linked_accounts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analysis"
  ON user_analysis FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own fused taste"
  ON fused_taste FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily insights"
  ON daily_insights FOR ALL
  USING (auth.uid() = user_id);

-- Service role can insert transactions (for backend sync)
CREATE POLICY "Service role can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- Update triggers
CREATE TRIGGER declared_taste_updated_at
  BEFORE UPDATE ON declared_taste
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fused_taste_updated_at
  BEFORE UPDATE ON fused_taste
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
