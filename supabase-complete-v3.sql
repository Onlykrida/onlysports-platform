-- OnlySports Complete Database Setup V3
-- Includes ALL tables needed for the app to function
-- Run this as a fresh setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables if they exist (in correct order to avoid FK constraints)
DROP TABLE IF EXISTS player_match_performance CASCADE;
DROP TABLE IF EXISTS match_records CASCADE;
DROP TABLE IF EXISTS injury_records CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS team_announcements CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_profile_completion(UUID) CASCADE;

-- Ensure we have access to auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'scout', 'team', 'fan', 'trainer')),
  
  -- Common profile fields
  avatar TEXT,
  bio TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  verified BOOLEAN DEFAULT FALSE,
  
  -- Core sport fields
  sport TEXT,
  position TEXT,
  
  -- Profile metadata
  profile_completion_score INTEGER DEFAULT 0,
  
  -- Generic fields
  achievements JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  
  -- Role-specific data
  athlete_data JSONB DEFAULT '{}'::jsonb,
  coach_data JSONB DEFAULT '{}'::jsonb,
  scout_data JSONB DEFAULT '{}'::jsonb,
  trainer_data JSONB DEFAULT '{}'::jsonb,
  team_data JSONB DEFAULT '{}'::jsonb,
  fan_data JSONB DEFAULT '{}'::jsonb,
  role_specific_data JSONB DEFAULT '{}'::jsonb,
  
  resume_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. POSTS TABLE
-- ============================================
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  type TEXT NOT NULL DEFAULT 'highlight' CHECK (type IN ('highlight', 'training', 'match', 'achievement')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  opportunity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. POST_LIKES TABLE
-- ============================================
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- 4. FOLLOWS TABLE
-- ============================================
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- 5. OPPORTUNITIES TABLE
-- ============================================
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tryout', 'tournament', 'sponsorship', 'scholarship', 'job', 'camp')),
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. APPLICATIONS TABLE (MISSING - CRITICAL!)
-- ============================================
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  cover_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, athlete_id)
);

-- ============================================
-- 7. MESSAGES TABLE (MISSING - CRITICAL!)
-- ============================================
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES - POSTS
-- ============================================
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - POST_LIKES
-- ============================================
CREATE POLICY "Likes are viewable by everyone" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - FOLLOWS
-- ============================================
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

-- ============================================
-- RLS POLICIES - OPPORTUNITIES
-- ============================================
CREATE POLICY "Opportunities are viewable by everyone" ON opportunities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own opportunities" ON opportunities
  FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Users can update their own opportunities" ON opportunities
  FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Users can delete their own opportunities" ON opportunities
  FOR DELETE USING (auth.uid() = team_id);

-- ============================================
-- RLS POLICIES - APPLICATIONS
-- ============================================
CREATE POLICY "Applications viewable by applicant and opportunity owner" ON applications
  FOR SELECT USING (
    auth.uid() = athlete_id OR 
    auth.uid() IN (SELECT team_id FROM opportunities WHERE id = opportunity_id)
  );

CREATE POLICY "Users can insert their own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Opportunity owners can update application status" ON applications
  FOR UPDATE USING (
    auth.uid() IN (SELECT team_id FROM opportunities WHERE id = opportunity_id)
  );

CREATE POLICY "Users can delete their own applications" ON applications
  FOR DELETE USING (auth.uid() = athlete_id);

-- ============================================
-- RLS POLICIES - MESSAGES
-- ============================================
CREATE POLICY "Messages viewable by sender and receiver" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent/received messages" ON messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- ============================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at 
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_sport ON profiles(sport);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_opportunity_id ON posts(opportunity_id) WHERE opportunity_id IS NOT NULL;

-- Post likes indexes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at DESC);

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Opportunities indexes
CREATE INDEX idx_opportunities_sport ON opportunities(sport);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_opportunities_team_id ON opportunities(team_id);

-- Applications indexes
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_athlete_id ON applications(athlete_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ OnlySports Complete Database Setup V3 finished!';
  RAISE NOTICE '📋 Core tables: profiles, posts, post_likes, follows';
  RAISE NOTICE '📋 Feature tables: opportunities, applications, messages, notifications';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Indexes created';
  RAISE NOTICE '🎯 Ready to use!';
END $$;
