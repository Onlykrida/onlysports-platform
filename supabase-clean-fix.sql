-- Clean fix for OnlySports database
-- This script only adds missing tables and fixes issues without conflicts

-- Enable necessary extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add comments table (this is what's missing for comments functionality)
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments (only create if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' AND policyname = 'Comments are viewable by everyone'
    ) THEN
        CREATE POLICY "Comments are viewable by everyone" ON public.comments
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' AND policyname = 'Users can insert their own comments'
    ) THEN
        CREATE POLICY "Users can insert their own comments" ON public.comments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' AND policyname = 'Users can update their own comments'
    ) THEN
        CREATE POLICY "Users can update their own comments" ON public.comments
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments'
    ) THEN
        CREATE POLICY "Users can delete their own comments" ON public.comments
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

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

-- Trigger to update comments count (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
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

-- Trigger to create comment notification (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.create_comment_notification();

-- Add post_id column to messages table if it doesn't exist (for sharing posts)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'post_id'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN post_id uuid;
        ALTER TABLE public.messages ADD CONSTRAINT messages_post_id_fkey 
            FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create comment_likes table for comment likes functionality
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    comment_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
    CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
    CONSTRAINT comment_likes_unique UNIQUE (user_id, comment_id)
);

-- Create indexes for comment_likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable RLS for comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' AND policyname = 'Comment likes are viewable by everyone'
    ) THEN
        CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
            FOR SELECT USING (true);
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' AND policyname = 'Users can like comments'
    ) THEN
        CREATE POLICY "Users can like comments" ON public.comment_likes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' AND policyname = 'Users can unlike comments'
    ) THEN
        CREATE POLICY "Users can unlike comments" ON public.comment_likes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $;

-- Add likes_count column to comments table if it doesn't exist
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN likes_count integer DEFAULT 0;
    END IF;
END $;

-- Function to update comment likes count when like is added/removed
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

-- Trigger to update comment likes count (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE PROCEDURE public.update_comment_likes_count();

-- Success message
SELECT 'Database fix completed successfully! Comments, comment likes, and sharing functionality added.' as status;