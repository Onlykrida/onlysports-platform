-- Create missing comment_likes table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Create comment_likes table for comment likes
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.comment_likes;
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
CREATE POLICY "Users can like comments" ON public.comment_likes
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;
CREATE POLICY "Users can unlike comments" ON public.comment_likes
    FOR DELETE USING ((select auth.uid()) = user_id);

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
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update comment likes count
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- Success message
SELECT 'comment_likes table created successfully!' as status;
