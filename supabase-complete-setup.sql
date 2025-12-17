-- OnlySports Complete Database Setup
-- Includes all tables needed for the app to function

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to avoid FK constraints)
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
-- 3. POST_LIKES TABLE (MISSING - THIS IS THE ISSUE!)
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
  type TEXT NOT NULL CHECK (type IN ('tryout', 'tournament', 'sponsorship', 'scholarship')),
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ OnlySports Complete Database Setup finished!';
  RAISE NOTICE '📋 All tables created: profiles, posts, post_likes, follows, opportunities';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Indexes created';
  RAISE NOTICE '🎯 Ready to use!';
END $$;
