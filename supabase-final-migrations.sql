-- ============================================
-- OnlyKrida Final Migrations
-- Run these against your Supabase SQL Editor
-- ============================================

-- 1. Add push_token column to profiles (for push notifications)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by user and event
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- RLS for analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Create profile_views table (for team dashboard views tracking)
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(created_at DESC);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert profile views" ON profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can see who viewed them" ON profile_views
  FOR SELECT USING (auth.uid() = viewed_id);

-- 4. Ensure scout_preferences table exists
CREATE TABLE IF NOT EXISTS scout_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sport TEXT,
  preferred_positions TEXT[] DEFAULT '{}',
  weight_skill NUMERIC DEFAULT 0.35,
  weight_speed NUMERIC DEFAULT 0.25,
  weight_stamina NUMERIC DEFAULT 0.20,
  weight_position_match NUMERIC DEFAULT 0.20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scout_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scout preferences" ON scout_preferences
  FOR ALL USING (auth.uid() = scout_id);

-- 5. Ensure player_stats table exists
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sport TEXT,
  position TEXT,
  skill INTEGER DEFAULT 50,
  speed INTEGER DEFAULT 50,
  stamina INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own player stats" ON player_stats
  FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Anyone can read player stats" ON player_stats
  FOR SELECT USING (true);

-- 6. Ensure ai_recommendations table exists
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fit_score NUMERIC DEFAULT 0,
  breakdown JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scout_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_recs_scout ON ai_recommendations(scout_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_player ON ai_recommendations(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_score ON ai_recommendations(fit_score DESC);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scouts can manage own recommendations" ON ai_recommendations
  FOR ALL USING (auth.uid() = scout_id);

CREATE POLICY "Players can see their recommendations" ON ai_recommendations
  FOR SELECT USING (auth.uid() = player_id);

-- 7. Ensure groups/group_members/group_messages tables exist
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  avatar TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read groups" ON groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group members" ON group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
  );

CREATE POLICY "Group creators can manage members" ON group_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.created_by = auth.uid())
  );

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id, created_at DESC);

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read messages" ON group_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_messages.group_id AND group_members.user_id = auth.uid())
  );

CREATE POLICY "Group members can send messages" ON group_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_messages.group_id AND group_members.user_id = auth.uid())
    AND auth.uid() = sender_id
  );

-- 8. Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE player_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE scout_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_recommendations;

-- Done! All tables ready for OnlyKrida.
