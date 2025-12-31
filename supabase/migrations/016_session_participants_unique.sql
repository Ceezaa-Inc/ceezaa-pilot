-- Add UNIQUE constraint to prevent duplicate session participants
-- This prevents maybe_single() from failing when duplicates exist

ALTER TABLE session_participants
ADD CONSTRAINT unique_session_participant UNIQUE (session_id, user_id);
