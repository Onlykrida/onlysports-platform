-- Team Management System Schema
-- For team/academy management features

-- Team Members (linking players to teams)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'removed')) DEFAULT 'pending',
  jersey_number INTEGER,
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
  UNIQUE(team_id, player_id, status)
);

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
  team_score INTEGER,
  opponent_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Match Performance
CREATE TABLE IF NOT EXISTS player_match_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES match_records(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  minutes_played INTEGER,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  rating DECIMAL(3,1),
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
  duration_minutes INTEGER,
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
DROP POLICY IF EXISTS "Team managers can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team managers can manage their team members" ON team_members;

CREATE POLICY "Team managers can view their team members" ON team_members
  FOR SELECT USING (
    team_id = auth.uid() OR 
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('scout', 'coach'))
  );

CREATE POLICY "Team managers can manage their team members" ON team_members
  FOR ALL USING (team_id = auth.uid());

-- RLS Policies for team_invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team managers can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team managers and players can update invitations" ON team_invitations;

CREATE POLICY "Users can view their invitations" ON team_invitations
  FOR SELECT USING (player_id = auth.uid() OR team_id = auth.uid());

CREATE POLICY "Team managers can create invitations" ON team_invitations
  FOR INSERT WITH CHECK (team_id = auth.uid());

CREATE POLICY "Team managers and players can update invitations" ON team_invitations
  FOR UPDATE USING (team_id = auth.uid() OR player_id = auth.uid());

-- RLS Policies for attendance_records
DROP POLICY IF EXISTS "Team members can view attendance" ON attendance_records;
DROP POLICY IF EXISTS "Team managers can manage attendance" ON attendance_records;

CREATE POLICY "Team members can view attendance" ON attendance_records
  FOR SELECT USING (
    team_id = auth.uid() OR 
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM team_members WHERE team_id = attendance_records.team_id AND player_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team managers can manage attendance" ON attendance_records
  FOR ALL USING (team_id = auth.uid());

-- RLS Policies for injury_records
DROP POLICY IF EXISTS "Team members can view injuries" ON injury_records;
DROP POLICY IF EXISTS "Team managers can manage injuries" ON injury_records;

CREATE POLICY "Team members can view injuries" ON injury_records
  FOR SELECT USING (
    team_id = auth.uid() OR 
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM team_members WHERE team_id = injury_records.team_id AND player_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team managers can manage injuries" ON injury_records
  FOR ALL USING (team_id = auth.uid());

-- RLS Policies for match_records
DROP POLICY IF EXISTS "Team members can view matches" ON match_records;
DROP POLICY IF EXISTS "Team managers can manage matches" ON match_records;

CREATE POLICY "Team members can view matches" ON match_records
  FOR SELECT USING (
    team_id = auth.uid() OR
    EXISTS (SELECT 1 FROM team_members WHERE team_id = match_records.team_id AND player_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team managers can manage matches" ON match_records
  FOR ALL USING (team_id = auth.uid());

-- RLS Policies for player_match_performance
DROP POLICY IF EXISTS "Team members can view performance" ON player_match_performance;
DROP POLICY IF EXISTS "Team managers can manage performance" ON player_match_performance;

CREATE POLICY "Team members can view performance" ON player_match_performance
  FOR SELECT USING (
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM match_records WHERE id = player_match_performance.match_id AND team_id = auth.uid())
  );

CREATE POLICY "Team managers can manage performance" ON player_match_performance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM match_records WHERE id = player_match_performance.match_id AND team_id = auth.uid())
  );

-- RLS Policies for training_sessions
DROP POLICY IF EXISTS "Team members can view training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Team managers can manage training sessions" ON training_sessions;

CREATE POLICY "Team members can view training sessions" ON training_sessions
  FOR SELECT USING (
    team_id = auth.uid() OR
    EXISTS (SELECT 1 FROM team_members WHERE team_id = training_sessions.team_id AND player_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team managers can manage training sessions" ON training_sessions
  FOR ALL USING (team_id = auth.uid());

-- RLS Policies for team_announcements
DROP POLICY IF EXISTS "Team members can view announcements" ON team_announcements;
DROP POLICY IF EXISTS "Team managers can manage announcements" ON team_announcements;

CREATE POLICY "Team members can view announcements" ON team_announcements
  FOR SELECT USING (
    team_id = auth.uid() OR
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_announcements.team_id AND player_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team managers can manage announcements" ON team_announcements
  FOR ALL USING (team_id = auth.uid());

-- Create function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS team_members_player_id_idx ON team_members(player_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON team_members(status);

CREATE INDEX IF NOT EXISTS team_invitations_team_id_idx ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS team_invitations_player_id_idx ON team_invitations(player_id);
CREATE INDEX IF NOT EXISTS team_invitations_status_idx ON team_invitations(status);

CREATE INDEX IF NOT EXISTS attendance_records_team_id_idx ON attendance_records(team_id);
CREATE INDEX IF NOT EXISTS attendance_records_player_id_idx ON attendance_records(player_id);
CREATE INDEX IF NOT EXISTS attendance_records_session_date_idx ON attendance_records(session_date DESC);

CREATE INDEX IF NOT EXISTS injury_records_team_id_idx ON injury_records(team_id);
CREATE INDEX IF NOT EXISTS injury_records_player_id_idx ON injury_records(player_id);
CREATE INDEX IF NOT EXISTS injury_records_status_idx ON injury_records(status);

CREATE INDEX IF NOT EXISTS match_records_team_id_idx ON match_records(team_id);
CREATE INDEX IF NOT EXISTS match_records_match_date_idx ON match_records(match_date DESC);

CREATE INDEX IF NOT EXISTS training_sessions_team_id_idx ON training_sessions(team_id);
CREATE INDEX IF NOT EXISTS training_sessions_session_date_idx ON training_sessions(session_date DESC);

CREATE INDEX IF NOT EXISTS team_announcements_team_id_idx ON team_announcements(team_id);
CREATE INDEX IF NOT EXISTS team_announcements_created_at_idx ON team_announcements(created_at DESC);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Team Management System setup completed!';
  RAISE NOTICE '📋 Tables created for roster, attendance, injuries, matches, and announcements';
  RAISE NOTICE '🔒 RLS policies enabled for security';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🎯 Ready to use with team management features!';
END $$;
