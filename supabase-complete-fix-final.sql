-- Complete OnlySports Database Fix
-- Run this script in your Supabase SQL Editor to fix all issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create comments table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.comments (
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

-- Create comment_likes table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
    CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
    CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT comment_likes_unique UNIQUE (comment_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;

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

-- Drop existing functions and triggers for comments (to avoid conflicts)
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
DROP FUNCTION IF EXISTS public.update_comment_likes_count();
DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
DROP FUNCTION IF EXISTS public.create_comment_notification();
DROP TRIGGER IF EXISTS on_comment_count_change ON public.comments;
DROP FUNCTION IF EXISTS public.update_post_comments_count();

-- Function to update comment likes count when like is added/removed
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update comment likes count
CREATE TRIGGER on_comment_like_change
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE PROCEDURE public.update_comment_likes_count();

-- Function to update post comments count when comment is added/removed
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

-- Trigger to update post comments count
CREATE TRIGGER on_comment_count_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.update_post_comments_count();

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

-- Insert some sample users for testing (only if they don't exist)
DO $$
DECLARE
    sample_user_1_id uuid := gen_random_uuid();
    sample_user_2_id uuid := gen_random_uuid();
    sample_user_3_id uuid := gen_random_uuid();
BEGIN
    -- Insert sample users only if profiles table is empty or has very few records
    IF (SELECT COUNT(*) FROM public.profiles) < 3 THEN
        INSERT INTO public.profiles (id, email, name, role, sport, bio, location, verified, avatar)
        VALUES 
        (
            sample_user_1_id,
            'athlete1@example.com',
            'Alex Johnson',
            'athlete',
            'Basketball',
            'Professional basketball player with 8 years of experience. Love the game and always pushing limits!',
            'Los Angeles, CA',
            true,
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
        ),
        (
            sample_user_2_id,
            'coach1@example.com',
            'Sarah Martinez',
            'coach',
            'Soccer',
            'Youth soccer coach passionate about developing the next generation of players.',
            'Miami, FL',
            true,
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'
        ),
        (
            sample_user_3_id,
            'scout1@example.com',
            'Mike Thompson',
            'scout',
            'Football',
            'Talent scout for college football programs. Always looking for the next star.',
            'Dallas, TX',
            false,
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
        )
        ON CONFLICT (id) DO NOTHING;

        -- Insert sample posts
        INSERT INTO public.posts (user_id, title, description, type, image_url, likes_count, comments_count)
        VALUES 
        (
            sample_user_1_id,
            'Amazing game last night!',
            'Just finished an incredible game! Scored 28 points and we won by 15. The team chemistry is really coming together this season. 🏀🔥',
            'highlight',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
            15,
            3
        ),
        (
            sample_user_2_id,
            'Training session with the kids',
            'Had an amazing training session with my U-16 team today. These kids are so dedicated and talented. The future of soccer is bright! ⚽',
            'training',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop',
            8,
            2
        ),
        (
            sample_user_3_id,
            'Scouting at the championship',
            'At the state championship today scouting some incredible talent. The level of play keeps getting better every year.',
            'match',
            'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=600&fit=crop',
            5,
            1
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Success message
SELECT 'OnlySports database setup completed successfully! Comments, likes, and sample data are ready.' as status;