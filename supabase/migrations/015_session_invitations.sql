-- =============================================
-- 015: Session Invitations
-- Track pending invitations separately from participants
-- Sessions only appear in "Active" after invitation is accepted
-- =============================================

-- Session invitations table
CREATE TABLE IF NOT EXISTS session_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL for non-app users
  invitee_phone TEXT,                                          -- For non-app user invites (E.164 format)
  status TEXT DEFAULT 'pending',                               -- pending, accepted, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined')),
  CONSTRAINT unique_user_invite UNIQUE(session_id, invitee_id),
  CONSTRAINT unique_phone_invite UNIQUE(session_id, invitee_phone),
  CONSTRAINT has_invitee CHECK (invitee_id IS NOT NULL OR invitee_phone IS NOT NULL)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_invitations_invitee ON session_invitations (invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_session_invitations_session ON session_invitations (session_id);
CREATE INDEX IF NOT EXISTS idx_session_invitations_phone ON session_invitations (invitee_phone) WHERE invitee_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_session_invitations_pending ON session_invitations (invitee_id) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE session_invitations ENABLE ROW LEVEL SECURITY;

-- Invitees can view their own invitations
DROP POLICY IF EXISTS "Users can view own invitations" ON session_invitations;
CREATE POLICY "Users can view own invitations"
  ON session_invitations FOR SELECT
  USING (
    auth.uid() = invitee_id
    OR auth.uid() = inviter_id
  );

-- Session participants can invite others
DROP POLICY IF EXISTS "Session participants can invite" ON session_invitations;
CREATE POLICY "Session participants can invite"
  ON session_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id
    AND EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_invitations.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Invitees can respond to (update) their own invitations
DROP POLICY IF EXISTS "Invitees can respond to invitations" ON session_invitations;
CREATE POLICY "Invitees can respond to invitations"
  ON session_invitations FOR UPDATE
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

-- Inviters can delete/cancel their invitations
DROP POLICY IF EXISTS "Inviters can cancel invitations" ON session_invitations;
CREATE POLICY "Inviters can cancel invitations"
  ON session_invitations FOR DELETE
  USING (auth.uid() = inviter_id);

-- Enable Realtime for live invitation updates
ALTER PUBLICATION supabase_realtime ADD TABLE session_invitations;

-- Add index to profiles for user search (case-insensitive username search)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON profiles (LOWER(display_name));
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles (phone) WHERE phone IS NOT NULL;
