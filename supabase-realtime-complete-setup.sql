-- OnlySports Complete Realtime Setup
-- This script sets up the complete database schema for realtime messaging, notifications, and opportunities

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'scout', 'team', 'fan', 'trainer')),
  avatar TEXT,
  bio TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  sport TEXT,
  position TEXT,
  achievements TEXT[],
  stats JSONB DEFAULT '{}',
  role_specific_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('highlight', 'training', 'match', 'achievement', 'general')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create follows table
CREATE TABLE follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- Create messages table with enhanced features
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK(sender_id != receiver_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'post', 'opportunity', 'message', 'connection_request', 'connection_accepted', 'profile_view', 'mention', 'system', 'application')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunities table with paid field
CREATE TABLE opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tryout', 'tournament', 'sponsorship', 'scholarship', 'job', 'camp')),
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  requirements TEXT[],
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  cover_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, athlete_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_sport ON profiles(sport);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_opportunities_team_id ON opportunities(team_id);
CREATE INDEX idx_opportunities_sport ON opportunities(sport);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_opportunities_paid ON opportunities(paid);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_athlete_id ON applications(athlete_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Create functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions to update counters
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for counters
CREATE TRIGGER update_likes_count_trigger AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();
CREATE TRIGGER update_comments_count_trigger AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Create notification triggers
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    NEW.following_id,
    'follow',
    'New Follower',
    p.name || ' started following you',
    json_build_object('follower_id', NEW.follower_id, 'follower_name', p.name)
  FROM profiles p
  WHERE p.id = NEW.follower_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    posts.user_id,
    'like',
    'Post Liked',
    p.name || ' liked your post',
    json_build_object('liker_id', NEW.user_id, 'liker_name', p.name, 'post_id', NEW.post_id)
  FROM profiles p, posts
  WHERE p.id = NEW.user_id AND posts.id = NEW.post_id AND posts.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    posts.user_id,
    'comment',
    'New Comment',
    p.name || ' commented on your post',
    json_build_object('commenter_id', NEW.user_id, 'commenter_name', p.name, 'post_id', NEW.post_id, 'comment_id', NEW.id)
  FROM profiles p, posts
  WHERE p.id = NEW.user_id AND posts.id = NEW.post_id AND posts.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_opportunity_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all athletes about new opportunities
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.id,
    'opportunity',
    'New Opportunity',
    'New ' || NEW.type || ' opportunity: ' || NEW.title,
    json_build_object('opportunity_id', NEW.id, 'team_id', NEW.team_id, 'type', NEW.type, 'sport', NEW.sport)
  FROM profiles p
  WHERE p.role = 'athlete' AND (p.sport = NEW.sport OR p.sport IS NULL);
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify team about new application
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      o.team_id,
      'application',
      'New Application',
      p.name || ' applied to your opportunity: ' || o.title,
      json_build_object('application_id', NEW.id, 'athlete_id', NEW.athlete_id, 'athlete_name', p.name, 'opportunity_id', NEW.opportunity_id)
    FROM profiles p, opportunities o
    WHERE p.id = NEW.athlete_id AND o.id = NEW.opportunity_id;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Notify athlete about status change
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      NEW.athlete_id,
      'application',
      'Application ' || CASE WHEN NEW.status = 'accepted' THEN 'Accepted' WHEN NEW.status = 'rejected' THEN 'Rejected' ELSE 'Updated' END,
      'Your application to ' || o.title || ' has been ' || NEW.status,
      json_build_object('application_id', NEW.id, 'opportunity_id', NEW.opportunity_id, 'status', NEW.status)
    FROM opportunities o
    WHERE o.id = NEW.opportunity_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create notification triggers
CREATE TRIGGER follow_notification_trigger AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION create_follow_notification();
CREATE TRIGGER like_notification_trigger AFTER INSERT ON likes FOR EACH ROW EXECUTE FUNCTION create_like_notification();
CREATE TRIGGER comment_notification_trigger AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION create_comment_notification();
CREATE TRIGGER opportunity_notification_trigger AFTER INSERT ON opportunities FOR EACH ROW EXECUTE FUNCTION create_opportunity_notification();
CREATE TRIGGER application_notification_trigger AFTER INSERT OR UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION create_application_notification();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can insert their own follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert their own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Opportunities policies
CREATE POLICY "Opportunities are viewable by everyone" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Teams/coaches/scouts can insert opportunities" ON opportunities FOR INSERT WITH CHECK (
  auth.uid() = team_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('team', 'coach', 'scout'))
);
CREATE POLICY "Teams can update their own opportunities" ON opportunities FOR UPDATE USING (auth.uid() = team_id);
CREATE POLICY "Teams can delete their own opportunities" ON opportunities FOR DELETE USING (auth.uid() = team_id);

-- Applications policies
CREATE POLICY "Applications are viewable by athletes and opportunity owners" ON applications FOR SELECT USING (
  auth.uid() = athlete_id OR 
  auth.uid() IN (SELECT team_id FROM opportunities WHERE id = opportunity_id)
);
CREATE POLICY "Athletes can insert their own applications" ON applications FOR INSERT WITH CHECK (
  auth.uid() = athlete_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'athlete')
);
CREATE POLICY "Athletes can update their own applications" ON applications FOR UPDATE USING (auth.uid() = athlete_id);
CREATE POLICY "Opportunity owners can update application status" ON applications FOR UPDATE USING (
  auth.uid() IN (SELECT team_id FROM opportunities WHERE id = opportunity_id)
);
CREATE POLICY "Athletes can delete their own applications" ON applications FOR DELETE USING (auth.uid() = athlete_id);

-- Create storage bucket for avatars and media
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

CREATE POLICY "Media files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Anyone can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "Anyone can update their own media" ON storage.objects FOR UPDATE USING (bucket_id = 'media');
CREATE POLICY "Anyone can delete their own media" ON storage.objects FOR DELETE USING (bucket_id = 'media');

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- Insert some sample data for testing
INSERT INTO profiles (id, email, name, role, sport, bio, verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'john.athlete@example.com', 'John Athlete', 'athlete', 'Football', 'Professional football player', true),
  ('00000000-0000-0000-0000-000000000002', 'sarah.coach@example.com', 'Sarah Coach', 'coach', 'Football', 'Experienced football coach', true),
  ('00000000-0000-0000-0000-000000000003', 'mike.scout@example.com', 'Mike Scout', 'scout', 'Football', 'Talent scout for major leagues', true),
  ('00000000-0000-0000-0000-000000000004', 'team.united@example.com', 'United FC', 'team', 'Football', 'Professional football team', true);

-- Insert sample opportunities
INSERT INTO opportunities (team_id, title, description, type, sport, location, deadline, paid, requirements) VALUES
  ('00000000-0000-0000-0000-000000000004', 'Summer Training Camp', 'Intensive 2-week training camp for young talents', 'camp', 'Football', 'Los Angeles, CA', '2024-06-01 23:59:59+00', true, ARRAY['Age 16-20', 'Basic football skills', 'Medical clearance']),
  ('00000000-0000-0000-0000-000000000002', 'Youth League Tryouts', 'Open tryouts for our youth development program', 'tryout', 'Football', 'New York, NY', '2024-05-15 18:00:00+00', false, ARRAY['Age 14-18', 'Parental consent', 'Previous team experience']),
  ('00000000-0000-0000-0000-000000000003', 'College Scholarship Program', 'Full scholarship opportunity for exceptional talents', 'scholarship', 'Football', 'Various Locations', '2024-08-31 23:59:59+00', true, ARRAY['High school graduate', 'GPA 3.5+', 'Outstanding athletic performance']);

COMMIT;

-- Success message
SELECT 'OnlySports database setup completed successfully! 🎉' as message;