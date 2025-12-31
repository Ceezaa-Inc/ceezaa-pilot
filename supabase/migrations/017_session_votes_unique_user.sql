-- =============================================
-- 017: Session Votes - One Vote Per User Per Session
-- Change unique constraint to enforce single vote per user per session
-- This enables atomic upsert for vote changes
-- =============================================

-- First, delete any duplicate votes (keep only the latest per user per session)
DELETE FROM session_votes a
USING session_votes b
WHERE a.session_id = b.session_id
  AND a.user_id = b.user_id
  AND a.created_at < b.created_at;

-- Drop the old constraint (allows multiple venues per user per session)
ALTER TABLE session_votes
DROP CONSTRAINT IF EXISTS session_votes_session_id_venue_id_user_id_key;

-- Add new constraint (one vote per user per session)
ALTER TABLE session_votes
ADD CONSTRAINT unique_user_vote_per_session UNIQUE (session_id, user_id);
