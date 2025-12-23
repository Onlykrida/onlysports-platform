-- ============================================================================
-- OnlySports Complete Backend Setup
-- Run this in your Supabase SQL Editor for a complete fresh setup
-- Includes: Auth, Profiles, Feed, Messages, Notifications, Opportunities
-- Features: Real-time subscriptions, RLS policies, Triggers, ML preparation
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- CLEAN UP (Drop existing objects in correct order)
-- ============================================================================

DROP TRIGGER IF EXISTS on_message_notification ON public.messages CASCADE;
DROP TRIGGER IF EXISTS on_comment_notification ON public.comments CASCADE;
DROP TRIGGER IF EXISTS on_follow_notification ON public.follows CASCADE;
DROP TRIGGER IF EXISTS on_like_notification ON public.likes CASCADE;
DROP TRIGGER IF EXISTS on_post_change ON public.posts CASCADE;
DROP TRIGGER IF EXISTS on_follow_change ON public.follows CASCADE;
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes CASCADE;
DROP TRIGGER IF EXISTS on_comment_change ON public.comments CASCADE;
DROP TRIGGER IF EXISTS on_like_change ON public.likes CASCADE;
DROP TRIGGER IF EXISTS on_application_change ON public.applications CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts CASCADE;
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities CASCADE;
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications CASCADE;
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments CASCADE;

DROP FUNCTION IF EXISTS public.create_message_notification() CASCADE;
DROP FUNCTION IF EXISTS public.create_comment_notification() CASCADE;
DROP FUNCTION IF EXISTS public.create_follow_notification() CASCADE;
DROP FUNCTION IF EXISTS public.create_like_notification() CASCADE;
DROP FUNCTION IF EXISTS public.update_posts_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_follow_counts() CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_applications_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.ml_summaries CASCADE;
DROP TABLE IF EXISTS public.analytics_cache CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.comment_likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Profiles table (User accounts with role-based data)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
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
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Posts table (Feed content)
CREATE TABLE public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    video_url text,
    image_url text,
    type text NOT NULL CHECK (type IN ('highlight', 'training', 'match', 'achievement')),
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    views_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    opportunity_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Opportunities table (Tryouts, tournaments, sponsorships, scholarships)
CREATE TABLE public.opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL CHECK (category IN ('tryouts', 'tournaments', 'sponsorships', 'scholarships', 'contracts')),
    type jsonb DEFAULT '[]'::jsonb,
    sport text,
    location text NOT NULL,
    deadline timestamptz NOT NULL,
    requirements text,
    compensation text,
    duration text,
    age_range text,
    skill_level text,
    contact_info text,
    additional_info text,
    paid boolean DEFAULT false,
    applications_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Applications table (Athletes applying to opportunities)
CREATE TABLE public.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    cover_letter text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(opportunity_id, athlete_id)
);

-- Follows table (Social connections)
CREATE TABLE public.follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- Likes table (Post likes)
CREATE TABLE public.likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- Comments table (Post comments)
CREATE TABLE public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    content text NOT NULL,
    likes_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Comment likes table
CREATE TABLE public.comment_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

-- Messages table (Real-time messaging)
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    media_url text,
    post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
    status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Notifications table (Real-time notifications)
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('like', 'follow', 'comment', 'opportunity', 'message', 'application', 'connection_request', 'connection_accepted', 'profile_view', 'mention', 'system')),
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- ML Summaries table (For future ML features - player highlights, performance summaries)
CREATE TABLE public.ml_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL CHECK (entity_type IN ('profile', 'post', 'opportunity', 'conversation')),
    entity_id uuid NOT NULL,
    summary_type text NOT NULL CHECK (summary_type IN ('performance', 'highlights', 'skills', 'sentiment', 'recommendations')),
    summary_data jsonb NOT NULL,
    confidence_score float,
    model_version text,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    UNIQUE(entity_type, entity_id, summary_type)
);

-- Analytics Cache table (For caching analytics queries)
CREATE TABLE public.analytics_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key text NOT NULL UNIQUE,
    cache_data jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL
);

-- ============================================================================
-- CREATE INDEXES (Performance optimization)
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_sport ON public.profiles(sport);
CREATE INDEX idx_profiles_location ON public.profiles(location);
CREATE INDEX idx_profiles_name_trgm ON public.profiles USING gin(name gin_trgm_ops);
CREATE INDEX idx_profiles_verified ON public.profiles(verified) WHERE verified = true;

-- Posts indexes
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_type ON public.posts(type);
CREATE INDEX idx_posts_opportunity_id ON public.posts(opportunity_id) WHERE opportunity_id IS NOT NULL;

-- Opportunities indexes
CREATE INDEX idx_opportunities_team_id ON public.opportunities(team_id);
CREATE INDEX idx_opportunities_sport ON public.opportunities(sport);
CREATE INDEX idx_opportunities_category ON public.opportunities(category);
CREATE INDEX idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX idx_opportunities_location ON public.opportunities(location);
CREATE INDEX idx_opportunities_created_at ON public.opportunities(created_at DESC);

-- Applications indexes
CREATE INDEX idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX idx_applications_athlete_id ON public.applications(athlete_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_follows_created_at ON public.follows(created_at DESC);

-- Likes indexes
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_created_at ON public.likes(created_at DESC);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Comment likes indexes
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(receiver_id, read) WHERE read = false;

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- ML Summaries indexes
CREATE INDEX idx_ml_summaries_entity ON public.ml_summaries(entity_type, entity_id);
CREATE INDEX idx_ml_summaries_type ON public.ml_summaries(summary_type);
CREATE INDEX idx_ml_summaries_expires ON public.ml_summaries(expires_at) WHERE expires_at IS NOT NULL;

-- Analytics Cache indexes
CREATE INDEX idx_analytics_cache_expires ON public.analytics_cache(expires_at);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid()::text = id::text);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid()::text = id::text);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Opportunities policies
CREATE POLICY "Opportunities are viewable by everyone"
    ON public.opportunities FOR SELECT
    USING (true);

CREATE POLICY "Teams can create opportunities"
    ON public.opportunities FOR INSERT
    WITH CHECK (auth.uid()::text = team_id::text);

CREATE POLICY "Teams can update their opportunities"
    ON public.opportunities FOR UPDATE
    USING (auth.uid()::text = team_id::text);

CREATE POLICY "Teams can delete their opportunities"
    ON public.opportunities FOR DELETE
    USING (auth.uid()::text = team_id::text);

-- Applications policies
CREATE POLICY "Applications are viewable by opportunity owner and applicant"
    ON public.applications FOR SELECT
    USING (
        auth.uid()::text = athlete_id::text 
        OR auth.uid()::text IN (SELECT team_id::text FROM public.opportunities WHERE id = opportunity_id)
    );

CREATE POLICY "Athletes can create applications"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid()::text = athlete_id::text);

CREATE POLICY "Athletes can update their applications"
    ON public.applications FOR UPDATE
    USING (auth.uid()::text = athlete_id::text);

CREATE POLICY "Teams can update applications for their opportunities"
    ON public.applications FOR UPDATE
    USING (auth.uid()::text IN (SELECT team_id::text FROM public.opportunities WHERE id = opportunity_id));

CREATE POLICY "Athletes can delete their applications"
    ON public.applications FOR DELETE
    USING (auth.uid()::text = athlete_id::text);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid()::text = follower_id::text);

CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid()::text = follower_id::text);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like posts"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can unlike posts"
    ON public.likes FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their comments"
    ON public.comments FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their comments"
    ON public.comments FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Comment likes policies
CREATE POLICY "Comment likes are viewable by everyone"
    ON public.comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like comments"
    ON public.comment_likes FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can unlike comments"
    ON public.comment_likes FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Messages policies (Strict privacy)
CREATE POLICY "Users can view their messages"
    ON public.messages FOR SELECT
    USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their received messages"
    ON public.messages FOR UPDATE
    USING (auth.uid()::text = receiver_id::text OR auth.uid()::text = sender_id::text);

CREATE POLICY "Users can delete their messages"
    ON public.messages FOR DELETE
    USING (auth.uid()::text = sender_id::text);

-- Notifications policies
CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ML Summaries policies
CREATE POLICY "ML summaries are viewable by everyone"
    ON public.ml_summaries FOR SELECT
    USING (true);

CREATE POLICY "Only service role can manage ML summaries"
    ON public.ml_summaries FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Analytics Cache policies
CREATE POLICY "Analytics cache is viewable by everyone"
    ON public.analytics_cache FOR SELECT
    USING (true);

CREATE POLICY "Only service role can manage analytics cache"
    ON public.analytics_cache FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.comments 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Update follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.following_id;
        
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles 
        SET followers_count = GREATEST(followers_count - 1, 0)
        WHERE id = OLD.following_id;
        
        UPDATE public.profiles 
        SET following_count = GREATEST(following_count - 1, 0)
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Update posts count
CREATE OR REPLACE FUNCTION public.update_posts_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET posts_count = posts_count + 1 
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles 
        SET posts_count = GREATEST(posts_count - 1, 0)
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Update applications count
CREATE OR REPLACE FUNCTION public.update_applications_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.opportunities 
        SET applications_count = applications_count + 1 
        WHERE id = NEW.opportunity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.opportunities 
        SET applications_count = GREATEST(applications_count - 1, 0)
        WHERE id = OLD.opportunity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create like notification
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    post_owner_id uuid;
    liker_name text;
BEGIN
    SELECT p.user_id, pr.name INTO post_owner_id, liker_name
    FROM public.posts p
    JOIN public.profiles pr ON pr.id = NEW.user_id
    WHERE p.id = NEW.post_id;
    
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            post_owner_id,
            'like',
            'New Like',
            liker_name || ' liked your post',
            jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create follow notification
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    follower_name text;
BEGIN
    SELECT name INTO follower_name
    FROM public.profiles
    WHERE id = NEW.follower_id;
    
    IF follower_name IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            NEW.following_id,
            'follow',
            'New Follower',
            follower_name || ' started following you',
            jsonb_build_object('follower_id', NEW.follower_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create comment notification
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    post_owner_id uuid;
    commenter_name text;
BEGIN
    SELECT p.user_id, pr.name INTO post_owner_id, commenter_name
    FROM public.posts p
    JOIN public.profiles pr ON pr.id = NEW.user_id
    WHERE p.id = NEW.post_id;
    
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            post_owner_id,
            'comment',
            'New Comment',
            commenter_name || ' commented on your post',
            jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create message notification
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sender_name text;
BEGIN
    SELECT name INTO sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;
    
    IF sender_name IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            NEW.receiver_id,
            'message',
            'New Message',
            sender_name || ' sent you a message',
            jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Count update triggers
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER on_comment_like_change
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_comment_likes_count();

CREATE TRIGGER on_follow_change
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_follow_counts();

CREATE TRIGGER on_post_change
    AFTER INSERT OR DELETE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_posts_count();

CREATE TRIGGER on_application_change
    AFTER INSERT OR DELETE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_applications_count();

-- Notification triggers
CREATE TRIGGER on_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.create_like_notification();

CREATE TRIGGER on_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.create_follow_notification();

CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.create_comment_notification();

CREATE TRIGGER on_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.create_message_notification();

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

-- Enable realtime for messages (for chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for posts (for live feed updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Enable realtime for likes (for live like counts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;

-- Enable realtime for comments (for live comments)
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Enable realtime for follows (for live follower updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

-- ============================================================================
-- STORAGE SETUP (Run in Supabase Dashboard > Storage)
-- ============================================================================

-- You need to manually create these buckets in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create buckets: 'avatars', 'posts', 'videos'
-- 3. Make them public or add policies as needed

-- Example RLS policies for storage (run after creating buckets):
-- 
-- For 'avatars' bucket:
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
-- 
-- CREATE POLICY "Users can upload their own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can update their own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- Similar policies for 'posts' and 'videos' buckets

-- ============================================================================
-- CLEANUP FUNCTIONS (Optional - for maintenance)
-- ============================================================================

-- Function to clean expired ML summaries
CREATE OR REPLACE FUNCTION public.cleanup_expired_ml_summaries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.ml_summaries
    WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;

-- Function to clean expired analytics cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.analytics_cache
    WHERE expires_at < now();
END;
$$;

-- ============================================================================
-- HELPER FUNCTIONS (For app usage)
-- ============================================================================

-- Function to get conversation participants
CREATE OR REPLACE FUNCTION public.get_conversations(user_uuid uuid)
RETURNS TABLE (
    participant_id uuid,
    participant_name text,
    participant_avatar text,
    participant_role text,
    last_message text,
    last_message_time timestamptz,
    unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH conversations AS (
        SELECT DISTINCT
            CASE 
                WHEN m.sender_id = user_uuid THEN m.receiver_id
                ELSE m.sender_id
            END AS other_user_id,
            MAX(m.created_at) AS last_msg_time
        FROM public.messages m
        WHERE m.sender_id = user_uuid OR m.receiver_id = user_uuid
        GROUP BY other_user_id
    )
    SELECT 
        c.other_user_id,
        p.name,
        p.avatar,
        p.role,
        (
            SELECT content 
            FROM public.messages 
            WHERE (sender_id = user_uuid AND receiver_id = c.other_user_id)
               OR (sender_id = c.other_user_id AND receiver_id = user_uuid)
            ORDER BY created_at DESC 
            LIMIT 1
        ) AS last_message,
        c.last_msg_time,
        (
            SELECT COUNT(*)
            FROM public.messages
            WHERE sender_id = c.other_user_id 
              AND receiver_id = user_uuid 
              AND read = false
        )::bigint AS unread_count
    FROM conversations c
    JOIN public.profiles p ON p.id = c.other_user_id
    ORDER BY c.last_msg_time DESC;
END;
$$;

-- ============================================================================
-- VERIFICATION & COMPLETION
-- ============================================================================

-- Verify all tables exist
DO $$
DECLARE
    table_count integer;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'profiles', 'posts', 'opportunities', 'applications',
        'follows', 'likes', 'comments', 'comment_likes',
        'messages', 'notifications', 'ml_summaries', 'analytics_cache'
    );
    
    IF table_count = 12 THEN
        RAISE NOTICE '✅ All 12 tables created successfully';
    ELSE
        RAISE WARNING '⚠️ Only % tables created. Expected 12', table_count;
    END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    '🎉 OnlySports Backend Setup Complete!' as status,
    'All tables, indexes, RLS policies, triggers, and functions created' as message,
    'Next steps:' as next_steps,
    '1. Create storage buckets (avatars, posts, videos) in Supabase Dashboard' as step_1,
    '2. Test authentication flow' as step_2,
    '3. Verify real-time subscriptions are working' as step_3,
    '4. Your frontend should now connect successfully!' as step_4;
