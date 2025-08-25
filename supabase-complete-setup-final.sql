-- OnlySports Complete Database Setup Script
-- This script creates all necessary tables, policies, functions, and triggers
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to handle foreign keys)
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
    achievements jsonb DEFAULT '[]'::jsonb,
    stats jsonb DEFAULT '{}'::jsonb,
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
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
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
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
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

-- Insert sample data for testing
INSERT INTO public.profiles (id, email, name, role, sport, bio, location, verified, achievements, stats)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'anirudh@example.com', 'Anirudh', 'athlete', 'Football', 'Professional football player with 5 years of experience.', 'New York, USA', true, 
     '[{"id": "1", "title": "Championship Winner", "description": "Won the regional championship", "date": "2023", "icon": "🏆"}]'::jsonb,
     '{"goals": 25, "assists": 12, "matches": 30}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440002', 'coach@example.com', 'Sample Coach', 'coach', 'Basketball', 'Experienced basketball coach specializing in youth development.', 'Los Angeles, USA', true,
     '[{"id": "1", "title": "Coach of the Year", "description": "Awarded coach of the year 2023", "date": "2023", "icon": "🏅"}]'::jsonb,
     '{"teams_coached": 5, "championships": 2, "years_experience": 10}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440003', 'scout@example.com', 'Sample Scout', 'scout', 'Soccer', 'Talent scout for professional soccer teams.', 'London, UK', false,
     '[]'::jsonb,
     '{"players_discovered": 50, "successful_signings": 15}'::jsonb);

-- Insert sample posts
INSERT INTO public.posts (user_id, title, description, type, image_url, likes_count, comments_count, views_count)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Amazing Goal!', 'Scored this incredible goal in yesterday''s match. The team played amazingly!', 'highlight', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', 15, 3, 120),
    ('550e8400-e29b-41d4-a716-446655440001', 'Training Session', 'Intense training session today. Working on my speed and agility.', 'training', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 8, 1, 65),
    ('550e8400-e29b-41d4-a716-446655440002', 'Team Strategy', 'Working with the team on new formations and strategies for the upcoming season.', 'training', 'https://images.unsplash.com/photo-1546608235-65d1b2d5d9c4?w=800', 12, 2, 89);

-- Insert sample opportunities
INSERT INTO public.opportunities (team_id, title, description, type, sport, location, deadline, requirements)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440002', 'Youth Football Tryouts', 'Open tryouts for our youth football team. Looking for talented players aged 16-18.', 'tryout', 'Football', 'New York, USA', '2024-03-15 10:00:00+00', '["Age 16-18", "Basic football skills", "Physical fitness test"]'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440002', 'Basketball Scholarship', 'Full scholarship opportunity for exceptional basketball players.', 'scholarship', 'Basketball', 'Los Angeles, USA', '2024-04-01 23:59:59+00', '["High school diploma", "Basketball experience", "Academic excellence"]'::jsonb);

-- Success message
SELECT 'OnlySports database setup completed successfully! All tables, policies, functions, and triggers have been created.' as status;