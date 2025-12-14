-- =============================================
-- 004: Group Sessions
-- Real-time group planning with voting
-- =============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                           -- "Dinner with friends"
  planned_date DATE,
  planned_time TIME,
  status TEXT DEFAULT 'voting',                  -- voting, closed, confirmed
  invite_code TEXT UNIQUE,                       -- For sharing (6-char code)
  winning_venue_id UUID REFERENCES venues(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Session participants
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant',               -- host, participant
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, user_id)
);

-- Venues in a session (for voting)
CREATE TABLE IF NOT EXISTS session_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, venue_id)
);

-- Votes on venues
CREATE TABLE IF NOT EXISTS session_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, venue_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_host ON sessions (host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_invite_code ON sessions (invite_code);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants (session_id);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_votes ENABLE ROW LEVEL SECURITY;

-- Sessions: viewable by participants
CREATE POLICY "Session participants can view session"
  ON sessions FOR SELECT
  USING (
    host_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = sessions.id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Sessions: hosts can update
CREATE POLICY "Session hosts can update"
  ON sessions FOR UPDATE
  USING (host_id = auth.uid());

-- Sessions: anyone can create
CREATE POLICY "Users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Session participants: viewable by participants
CREATE POLICY "Participants can view session participants"
  ON session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_participants.session_id
      AND (
        sessions.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM session_participants sp
          WHERE sp.session_id = sessions.id
          AND sp.user_id = auth.uid()
        )
      )
    )
  );

-- Session participants: users can join (insert)
CREATE POLICY "Users can join sessions"
  ON session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Session venues: viewable by participants
CREATE POLICY "Participants can view session venues"
  ON session_venues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_venues.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Session venues: participants can add/remove
CREATE POLICY "Participants can manage session venues"
  ON session_venues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_venues.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Session votes: viewable by participants
CREATE POLICY "Participants can view votes"
  ON session_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_votes.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Session votes: users can manage their own
CREATE POLICY "Users can manage own votes"
  ON session_votes FOR ALL
  USING (auth.uid() = user_id);

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite code
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_invite_code
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Function to auto-add host as participant
CREATE OR REPLACE FUNCTION add_host_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO session_participants (session_id, user_id, role)
  VALUES (NEW.id, NEW.host_id, 'host');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_add_host
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION add_host_as_participant();

-- Enable Realtime for sessions tables
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE session_venues;
ALTER PUBLICATION supabase_realtime ADD TABLE session_votes;
