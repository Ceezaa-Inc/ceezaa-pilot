-- =============================================
-- 006: Linked Accounts - Plaid Bank Account Connections
-- Ceezaa MVP Database Migration
-- =============================================

-- Stores linked bank accounts via Plaid
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Using TEXT for now, will link to profiles later
  plaid_item_id TEXT NOT NULL,
  plaid_access_token TEXT NOT NULL,  -- Encrypted at rest by Supabase
  institution_id TEXT,
  institution_name TEXT,
  sync_cursor TEXT,  -- For incremental transaction sync
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, plaid_item_id)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON linked_accounts(user_id);

-- Index for sync operations
CREATE INDEX IF NOT EXISTS idx_linked_accounts_last_synced ON linked_accounts(last_synced_at);

-- Enable Row Level Security
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (will tighten with auth later)
-- Service role (used by backend) has full access
CREATE POLICY "Service role full access"
  ON linked_accounts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamp function (if not exists)
CREATE OR REPLACE FUNCTION update_linked_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS linked_accounts_updated_at ON linked_accounts;
CREATE TRIGGER linked_accounts_updated_at
  BEFORE UPDATE ON linked_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_linked_accounts_timestamp();
