-- OnlySports Complete Database Setup - ALL TABLES
-- This includes EVERY table your app needs
-- Run this in your Supabase SQL Editor

-- Drop ALL existing tables to start fresh
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_post_likes_count() CASCADE;

-- ====================================
-- PROFILES TABLE
-- ====================================
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('athlete', 'coach', 'scout', 'team', 'fan', 'trainer')),
    avatar text,
    bio text,
    location text,
    verified boolean DEFAULT false,
    sport text,
    position text,
    achievements jsonb DEFAULT '[]'::jsonb,
    stats jsonb DEFAULT '{}'::jsonb,
    role_specific_data jsonb DEFAULT '{}'::jsonb,
    resume_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================
-- POSTS TABLE
-- ====================================
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  image_url text,
  type text NOT NULL CHECK (type IN ('highlight', 'training', 'match', 'achievement')),
  opportunity_id uuid,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================
-- POST LIKES TABLE
-- ====================================
CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- ====================================
-- FOLLOWS TABLE
-- ====================================
CREATE TABLE public.follows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- ====================================
-- OPPORTUNITIES TABLE
-- ====================================
CREATE TABLE public.opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('tryout', 'tournament', 'sponsorship', 'scholarship', 'job', 'camp')),
  sport text NOT NULL,
  location text NOT NULL,
  deadline timestamp with time zone NOT NULL,
  requirements jsonb DEFAULT '[]'::jsonb,
  paid boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================
-- APPLICATIONS TABLE (FOR OPPORTUNITIES)
-- ====================================
CREATE TABLE public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  athlete_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  cover_letter text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(opportunity_id, athlete_id)
);

-- ====================================
-- MESSAGES TABLE
-- ====================================
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_url text,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================
-- NOTIFICATIONS TABLE
-- ====================================
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'post', 'opportunity', 'message', 'connection_request', 'connection_accepted', 'profile_view', 'mention', 'system', 'application')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================
-- ENABLE ROW LEVEL SECURITY
-- ====================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ====================================
-- RLS POLICIES - PROFILES
-- ====================================
CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on user_id" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ====================================
-- RLS POLICIES - POSTS
-- ====================================
CREATE POLICY "Enable read access for all users" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on user_id" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- RLS POLICIES - POST LIKES
-- ====================================
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.post_likes
    FOR ALL USING (auth.uid() = user_id);

-- ====================================
-- RLS POLICIES - FOLLOWS
-- ====================================
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- ====================================
-- RLS POLICIES - OPPORTUNITIES
-- ====================================
CREATE POLICY "Enable read access for all users" ON public.opportunities
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on team_id" ON public.opportunities
  FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Enable update for users based on team_id" ON public.opportunities
  FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Enable delete for users based on team_id" ON public.opportunities
  FOR DELETE USING (auth.uid() = team_id);

-- ====================================
-- RLS POLICIES - APPLICATIONS
-- ====================================
CREATE POLICY "Enable read access for all users" ON public.applications
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for athletes" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Enable update for opportunity owners" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.opportunities
      WHERE opportunities.id = applications.opportunity_id
      AND opportunities.team_id = auth.uid()
    )
  );

-- ====================================
-- RLS POLICIES - MESSAGES
-- ====================================
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ====================================
-- RLS POLICIES - NOTIFICATIONS
-- ====================================
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- TRIGGERS AND FUNCTIONS
-- ====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post likes count
CREATE TRIGGER update_post_likes_count_trigger
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_likes_count();

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_sport ON public.profiles(sport);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Post likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_sport ON public.opportunities(sport);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_team_id ON public.opportunities(team_id);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_athlete_id ON public.applications(athlete_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ====================================
-- GRANT PERMISSIONS
-- ====================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ====================================
-- STORAGE BUCKETS
-- ====================================

-- Posts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ====================================
-- STORAGE POLICIES
-- ====================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view posts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Posts storage policies
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Allow public to view posts" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'posts');

CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ====================================
-- SUCCESS MESSAGE
-- ====================================
SELECT '✅ OnlySports database setup completed successfully!' as status;
SELECT '📋 Tables created: profiles, posts, post_likes, follows, opportunities, applications, messages, notifications' as info;
SELECT '🔒 RLS policies enabled for all tables' as security;
SELECT '⚡ Indexes created for performance' as performance;
SELECT '💾 Storage buckets configured' as storage;
SELECT '🎯 Ready to use with your OnlySports app!' as ready;
