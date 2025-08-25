-- OnlySports Database Setup Script
-- Run this in your Supabase SQL Editor

-- First, drop existing tables and policies if they exist to start fresh
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'scout', 'team', 'fan')),
  avatar TEXT,
  bio TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  sport TEXT,
  position TEXT,
  achievements JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on user_id" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('highlight', 'training', 'match', 'achievement')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts
CREATE POLICY "Enable read access for all users" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on user_id" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create opportunities table
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

-- Enable RLS for opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for opportunities
CREATE POLICY "Enable read access for all users" ON opportunities
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on team_id" ON opportunities
  FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Enable update for users based on team_id" ON opportunities
  FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Enable delete for users based on team_id" ON opportunities
  FOR DELETE USING (auth.uid() = team_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at 
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_sport_idx ON profiles(sport);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_type_idx ON posts(type);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX opportunities_sport_idx ON opportunities(sport);
CREATE INDEX opportunities_type_idx ON opportunities(type);
CREATE INDEX opportunities_deadline_idx ON opportunities(deadline);
CREATE INDEX opportunities_team_id_idx ON opportunities(team_id);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for reading public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON posts TO anon;
GRANT SELECT ON opportunities TO anon;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ OnlySports database setup completed successfully!';
  RAISE NOTICE '📋 Tables created: profiles, posts, opportunities';
  RAISE NOTICE '🔒 RLS policies enabled for security';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🎯 Ready to use with your OnlySports app!';
END $$;