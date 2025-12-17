-- Team Management System Schema (Corrected Version)
-- For team/academy management features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Team Members (linking players to teams)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'removed')) DEFAULT 'pending',
  jersey_number INTEGER CHECK (jersey_number BETWEEN 0 AND 999),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'captain', 'vice_captain')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Team Invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CHECK (
    (status = 'pending' AND responded_at IS NULL) OR
    (status IN ('accepted', 'rejected', 'cancelled') AND responded_at IS NOT NULL)
  )
);

-- Create unique index for team_invitations (one invitation per player per team)
CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_team_player_idx ON team_invitations(team_id, player_id);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('training', 'match', 'meeting', 'other')),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injury Records
CREATE TABLE IF NOT EXISTS injury_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  injury_type TEXT NOT NULL,
  injury_date DATE NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  status TEXT NOT NULL CHECK (status IN ('active', 'recovering', 'recovered')) DEFAULT 'active',
  expected_recovery_date DATE,
  actual_recovery_date DATE,
  description TEXT,
  treatment_notes TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Records
CREATE TABLE IF NOT EXISTS match_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opponent_name TEXT NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  match_type TEXT NOT NULL CHECK (match_type IN ('friendly', 'league', 'cup', 'tournament')),
  result TEXT CHECK (result IN ('win', 'loss', 'draw', 'pending')),
  team_score INTEGER CHECK (team_score >= 0),
  opponent_score INTEGER CHECK (opponent_score >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Match Performance
CREATE TABLE IF NOT EXISTS player_match_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES match_records(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  minutes_played INTEGER CHECK (minutes_played >= 0 AND minutes_played <= 200),
  goals INTEGER DEFAULT 0 CHECK (goals >= 0),
  assists INTEGER DEFAULT 0 CHECK (assists >= 0),
  yellow_cards INTEGER DEFAULT 0 CHECK (yellow_cards >= 0),
  red_cards INTEGER DEFAULT 0 CHECK (red_cards >= 0),
  rating DECIMAL(3,1) CHECK (rating BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Training Sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  location TEXT,
  focus_areas TEXT[],
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Announcements
CREATE TABLE IF NOT EXISTS team_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;

CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT TO authenticated USING (
    team_id = (SELECT auth.uid()) OR 
    player_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('scout', 'coach'))
  );

CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT TO authenticated WITH CHECK (team_id = (SELECT auth.uid()));

CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE TO authenticated USING (team_id = (SELECT auth.uid()));

CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE TO authenticated USING (team_id = (SELECT auth.uid()));

-- RLS Policies for team_invitations
DROP POLICY IF EXISTS "team_invitations_select_policy" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_insert_policy" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_update_policy" ON team_invitations;

CREATE POLICY "team_invitations_select_policy" ON team_invitations
  FOR SELECT TO authenticated USING (
    player_id = (SELECT auth.uid()) OR 
    team_id = (SELECT auth.uid())
  );

CREATE POLICY "team_invitations_insert_policy" ON team_invitations
  FOR INSERT TO authenticated WITH CHECK (team_id = (SELECT auth.uid()));

CREATE POLICY "team_invitations_update_policy" ON team_invitations
  FOR UPDATE TO authenticated USING (
    team_id = (SELECT auth.uid()) OR 
    player_id = (SELECT auth.uid())
  );

-- RLS Policies for attendance_records
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_delete_policy" ON attendance_records;

CREATE POLICY "attendance_select_policy" ON attendance_records
  FOR SELECT TO authenticated USING (
    team_id = (SELECT auth.uid()) OR 
    player_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = attendance_records.team_id 
      AND player_id = (SELECT auth.uid()) 
      AND status = 'active'
    )
  );

CREATE POLICY "attendance_insert_policy" ON attendance_records
  FOR INSERT TO authenticated WITH CHECK (team_id = (SELECT auth.uid()));

CREATE POLICY "attendance_update_policy" ON attendance_records
  FOR UPDATE TO authenticated USING (team_id = (SELECT auth.uid()));

CREATE POLICY "attendance_delete_policy" ON attendance_records
  FOR DELETE TO authenticated USING (team_id = (SELECT auth.uid()));

-- RLS Policies for injury_records
DROP POLICY IF EXISTS "injury_select_policy" ON injury_records;
DROP POLICY IF EXISTS "injury_insert_policy" ON injury_records;
DROP POLICY IF EXISTS "injury_update_policy" ON injury_records;
DROP POLICY IF EXISTS "injury_delete_policy" ON injury_records;

CREATE POLICY "injury_select_policy" ON injury_records
  FOR SELECT TO authenticated USING (
    team_id = (SELECT auth.uid()) OR 
    player_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = injury_records.team_id 
      AND player_id = (SELECT auth.uid()) 
      AND status = 'active'
    )
  );

CREATE POLICY "injury_insert_policy" ON injury_records
  FOR INSERT TO authenticated WITH CHECK (team_id = (SELECT auth.uid()));

CREATE POLICY "injury_update_policy" ON injury_records
  FOR UPDATE TO authenticated USING (team_id = (SELECT auth.uid()));

CREATE POLICY "injury_delete_policy" ON injury_records
  FOR DELETE TO authenticated USING (team_id = (SELECT auth.uid()));

-- RLS Policies for match_records
DROP POLICY IF EXISTS "match_select_policy" ON match_records;
DROP POLICY IF EXISTS "match_insert_policy" ON match_records;
DROP POLICY IF EXISTS "match_update_policy" ON match_records;
DROP POLICY IF EXISTS "match_delete_policy" ON match_records;

CREATE POLICY "match_select_policy" ON match_records
  FOR SELECT TO authenticated USING (
    team_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = match_records.team_id 
      AND player_id = (SELECT auth.uid()) 
      AND status = 'active'
    )
  );

CREATE POLICY "match_insert_policy" ON match_records
  FOR INSERT TO authenticated WITH CHECK (team_id = (SELECT auth.uid()));

CREATE POLICY "match_update_policy" ON match_records
  FOR UPDATE TO authenticated USING (team_id = (SELECT auth.uid()));

CREATE POLICY "match_delete_policy" ON match_records
  FOR DELETE TO authenticated USING (team_id = (SELECT auth.uid()));

-- RLS Policies for player_match_performance
DROP POLICY IF EXISTS "performance_select_policy" ON player_match_performance;
DROP POLICY IF EXISTS "performance_insert_policy" ON player_match_performance;
DROP POLICY IF EXISTS "performance_update_policy" ON player_match_performance;
DROP POLICY IF EXISTS "performance_delete_policy" ON player_match_performance;

CREATE POLICY "performance_select_policy" ON player_match_performance
  FOR SELECT TO authenticated USING (
    player_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM match_records 
      WHERE id = player_match_performance.match_id 
      AND team_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "performance_insert_policy" ON player_match_performance
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM match_records 
      WHERE id = match_id 
      AND team_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "performance_update_policy" ON player_match_performance
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM match_records 
      WHERE id = player_match_performance.match_id 
      AND team_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "performance_delete_policy" ON player_match_performance
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM match_records 
      WHERE id = player_match_performance.match_id 
      AND team_id = (SELECT auth.uid())
    )
  );

-- RLS Policies for training_sessions
DROP POLICY IF EXISTS "training_select_policy" ON training_sessions;
DROP POLICY IF EXISTS "training_insert_policy" ON training_sessions;
DROP POLICY IF EXISTS "training_update_policy" ON training_sessions;
DROP POLICY IF EXISTS "training_delete_policy" ON training_sessions;

CREATE POLICY "training_select_policy" ON training_sessions
  FOR SELECT TO authenticated USING (
    team_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = training_sessions.team_id 
      AND player_id = (SELECT auth.uid()) 
      AND status = 'active'
    )
  );

CREATE POLICY "training_insert_policy" ON training_sessions
  FOR INSERT TO authenticated WITH CHECK (team_id = (SELECT auth.uid()));

CREATE POLICY "training_update_policy" ON training_sessions
  FOR UPDATE TO authenticated USING (team_id = (SELECT auth.uid()));

CREATE POLICY "training_delete_policy" ON training_sessions
  FOR DELETE TO authenticated USING (team_id = (SELECT auth.uid()));

-- RLS Policies for team_announcements
DROP POLICY IF EXISTS "announcements_select_policy" ON team_announcements;
DROP POLICY IF EXISTS "announcements_insert_policy" ON team_announcements;
DROP POLICY IF EXISTS "announcements_update_policy" ON team_announcements;
DROP POLICY IF EXISTS "announcements_delete_policy" ON team_announcements;

CREATE POLICY "announcements_select_policy" ON team_announcements
  FOR SELECT TO authenticated USING (
    team_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = team_announcements.team_id 
      AND player_id = (SELECT auth.uid()) 
      AND status = 'active'
    )
  );

CREATE POLICY "announcements_insert_policy" ON team_announcements
  FOR INSERT TO authenticated WITH CHECK (team_id = (SELECT auth.uid()));

CREATE POLICY "announcements_update_policy" ON team_announcements
  FOR UPDATE TO authenticated USING (team_id = (SELECT auth.uid()));

CREATE POLICY "announcements_delete_policy" ON team_announcements
  FOR DELETE TO authenticated USING (team_id = (SELECT auth.uid()));

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
CREATE TRIGGER update_team_invitations_updated_at 
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_records_updated_at 
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_injury_records_updated_at ON injury_records;
CREATE TRIGGER update_injury_records_updated_at 
  BEFORE UPDATE ON injury_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_match_records_updated_at ON match_records;
CREATE TRIGGER update_match_records_updated_at 
  BEFORE UPDATE ON match_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_match_performance_updated_at ON player_match_performance;
CREATE TRIGGER update_player_match_performance_updated_at 
  BEFORE UPDATE ON player_match_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER update_training_sessions_updated_at 
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_announcements_updated_at ON team_announcements;
CREATE TRIGGER update_team_announcements_updated_at 
  BEFORE UPDATE ON team_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create composite and optimized indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_player ON team_members(team_id, player_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

CREATE INDEX IF NOT EXISTS idx_team_invitations_team_player ON team_invitations(team_id, player_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

CREATE INDEX IF NOT EXISTS idx_attendance_team_player ON attendance_records(team_id, player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_date ON attendance_records(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_team_date ON attendance_records(team_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_injury_team_player ON injury_records(team_id, player_id);
CREATE INDEX IF NOT EXISTS idx_injury_status ON injury_records(status);

CREATE INDEX IF NOT EXISTS idx_match_team_date ON match_records(team_id, match_date DESC);

CREATE INDEX IF NOT EXISTS idx_performance_match_player ON player_match_performance(match_id, player_id);

CREATE INDEX IF NOT EXISTS idx_training_team_date ON training_sessions(team_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_team_created ON team_announcements(team_id, created_at DESC);

-- Grant limited permissions (not ALL)
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON injury_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON match_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON player_match_performance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON training_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_announcements TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE 'Team Management System setup completed successfully!';
  RAISE NOTICE 'Tables created: team_members, team_invitations, attendance_records, injury_records';
  RAISE NOTICE 'Tables created: match_records, player_match_performance, training_sessions, team_announcements';
  RAISE NOTICE 'RLS policies enabled with proper security';
  RAISE NOTICE 'Optimized indexes created for performance';
  RAISE NOTICE 'Ready to use with team management features!';
END $$;
