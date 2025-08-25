-- Complete OnlySports Database Setup Script
-- Fresh setup for all tables and functionality
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS public.comment_likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role = ANY (ARRAY['athlete'::text, 'coach'::text, 'scout'::text, 'team'::text, 'fan'::text])),
    avatar text,
    bio text,
    location text,
    verified boolean DEFAULT false,
    sport text,
    position text,
    achievements text[] DEFAULT '{}',
    stats jsonb DEFAULT '{}',
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create posts table
CREATE TABLE public.posts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    video_url text,
    image_url text,
    type text NOT NULL CHECK (type = ANY (ARRAY['highlight'::text, 'training'::text, 'match'::text, 'achievement'::text])),
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    views_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT posts_pkey PRIMARY KEY (id),
    CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create opportunities table
CREATE TABLE public.opportunities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type text NOT NULL CHECK (type = ANY (ARRAY['tryout'::text, 'tournament'::text, 'sponsorship'::text, 'scholarship'::text])),
    sport text NOT NULL,
    location text NOT NULL,
    deadline timestamp with time zone NOT NULL,
    requirements jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT opportunities_pkey PRIMARY KEY (id),
    CONSTRAINT opportunities_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create follows table
CREATE TABLE public.follows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT follows_pkey PRIMARY KEY (id),
    CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
    CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id)
);

-- Create likes table
CREATE TABLE public.likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT likes_pkey PRIMARY KEY (id),
    CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    CONSTRAINT likes_unique UNIQUE (user_id, post_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    post_id uuid NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT messages_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE
);

-- Create comments table
CREATE TABLE public.comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create comment_likes table
CREATE TABLE public.comment_likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    comment_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
    CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
    CONSTRAINT comment_likes_unique UNIQUE (user_id, comment_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    type text NOT NULL CHECK (type = ANY (ARRAY['like'::text, 'follow'::text, 'comment'::text, 'opportunity'::text, 'message'::text])),
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_type ON public.posts(type);
CREATE INDEX idx_opportunities_team_id ON public.opportunities(team_id);
CREATE INDEX idx_opportunities_sport ON public.opportunities(sport);
CREATE INDEX idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for opportunities
CREATE POLICY "Opportunities are viewable by everyone" ON public.opportunities
    FOR SELECT USING (true);

CREATE POLICY "Teams can insert their own opportunities" ON public.opportunities
    FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Teams can update their own opportunities" ON public.opportunities
    FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Teams can delete their own opportunities" ON public.opportunities
    FOR DELETE USING (auth.uid() = team_id);

-- RLS Policies for follows
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for likes
CREATE POLICY "Likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON public.comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'New User'), 'athlete')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update likes count when like is added/removed
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
        SET likes_count = likes_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update likes count
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE PROCEDURE public.update_post_likes_count();

-- Function to update comments count when comment is added/removed
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET comments_count = comments_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update comments count
CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.update_post_comments_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS trigger AS $
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.comments 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update comment likes count
CREATE TRIGGER on_comment_like_change
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE PROCEDURE public.update_comment_likes_count();

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger AS $
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increase follower count for the user being followed
        UPDATE public.profiles 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.following_id;
        
        -- Increase following count for the user doing the following
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease follower count for the user being unfollowed
        UPDATE public.profiles 
        SET followers_count = followers_count - 1 
        WHERE id = OLD.following_id;
        
        -- Decrease following count for the user doing the unfollowing
        UPDATE public.profiles 
        SET following_count = following_count - 1 
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update follow counts
CREATE TRIGGER on_follow_change
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE PROCEDURE public.update_follow_counts();

-- Function to update posts count
CREATE OR REPLACE FUNCTION public.update_posts_count()
RETURNS trigger AS $
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET posts_count = posts_count + 1 
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles 
        SET posts_count = posts_count - 1 
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update posts count
CREATE TRIGGER on_post_change
    AFTER INSERT OR DELETE ON public.posts
    FOR EACH ROW EXECUTE PROCEDURE public.update_posts_count();

-- Function to create notification on new like
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS trigger AS $$
DECLARE
    post_owner_id uuid;
    liker_name text;
BEGIN
    -- Get the post owner and liker name
    SELECT p.user_id, pr.name INTO post_owner_id, liker_name
    FROM public.posts p
    JOIN public.profiles pr ON pr.id = NEW.user_id
    WHERE p.id = NEW.post_id;
    
    -- Don't create notification if user likes their own post
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            post_owner_id,
            'like',
            'New Like',
            liker_name || ' liked your post',
            json_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create like notification
CREATE TRIGGER on_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE PROCEDURE public.create_like_notification();

-- Function to create notification on new follow
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS trigger AS $$
DECLARE
    follower_name text;
BEGIN
    -- Get the follower name
    SELECT name INTO follower_name
    FROM public.profiles
    WHERE id = NEW.follower_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        NEW.following_id,
        'follow',
        'New Follower',
        follower_name || ' started following you',
        json_build_object('follower_id', NEW.follower_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create follow notification
CREATE TRIGGER on_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE PROCEDURE public.create_follow_notification();

-- Function to create notification on new comment
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS trigger AS $$
DECLARE
    post_owner_id uuid;
    commenter_name text;
BEGIN
    -- Get the post owner and commenter name
    SELECT p.user_id, pr.name INTO post_owner_id, commenter_name
    FROM public.posts p
    JOIN public.profiles pr ON pr.id = NEW.user_id
    WHERE p.id = NEW.post_id;
    
    -- Don't create notification if user comments on their own post
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            post_owner_id,
            'comment',
            'New Comment',
            commenter_name || ' commented on your post',
            json_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create comment notification
CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.create_comment_notification();

-- Function to create notification on new message
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger AS $$
DECLARE
    sender_name text;
BEGIN
    -- Get the sender name
    SELECT name INTO sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        NEW.receiver_id,
        'message',
        'New Message',
        sender_name || ' sent you a message',
        json_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create message notification
CREATE TRIGGER on_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.create_message_notification();

-- Insert sample data for testing (optional - you can remove this section if not needed)
DO $
DECLARE
    sample_athlete_id uuid := gen_random_uuid();
    sample_coach_id uuid := gen_random_uuid();
    sample_scout_id uuid := gen_random_uuid();
    sample_post_id uuid := gen_random_uuid();
BEGIN
    -- Sample profiles
    INSERT INTO public.profiles (id, email, name, role, sport, bio, location, verified, avatar) VALUES
    (sample_athlete_id, 'sample.athlete@example.com', 'Alex Johnson', 'athlete', 'Football', 'Professional football player with 5 years of experience.', 'New York, USA', true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'),
    (sample_coach_id, 'sample.coach@example.com', 'Sarah Williams', 'coach', 'Basketball', 'Experienced basketball coach specializing in youth development.', 'Los Angeles, USA', true, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'),
    (sample_scout_id, 'sample.scout@example.com', 'Mike Davis', 'scout', 'Soccer', 'Talent scout for professional soccer teams.', 'London, UK', false, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100');
    
    -- Sample post
    INSERT INTO public.posts (id, user_id, title, description, type, image_url) VALUES
    (sample_post_id, sample_athlete_id, 'Amazing touchdown pass!', 'Just scored this incredible touchdown in today''s game. The team coordination was perfect!', 'highlight', 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800');
    
    -- Sample follow relationship
    INSERT INTO public.follows (follower_id, following_id) VALUES
    (sample_coach_id, sample_athlete_id);
    
    -- Sample like
    INSERT INTO public.likes (user_id, post_id) VALUES
    (sample_coach_id, sample_post_id);
    
    -- Sample comment
    INSERT INTO public.comments (post_id, user_id, content) VALUES
    (sample_post_id, sample_coach_id, 'Great play! Your technique has really improved.');
    
    -- Sample opportunity
    INSERT INTO public.opportunities (team_id, title, description, type, sport, location, deadline) VALUES
    (sample_coach_id, 'Basketball Team Tryouts', 'Looking for talented players to join our championship team. All skill levels welcome.', 'tryout', 'Basketball', 'Los Angeles, CA', now() + interval '30 days');
END $;

-- Success message
SELECT 'OnlySports database setup completed successfully! All tables, policies, and sample data have been created.' as status;