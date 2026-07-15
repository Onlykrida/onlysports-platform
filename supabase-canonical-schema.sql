-- ============================================================================
-- OnlySports Canonical Schema
-- Single source-of-truth migration file
-- Generated: 2026-03-10
--
-- Usage: Run this in the Supabase SQL Editor.
-- It is idempotent: uses CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS,
-- and CREATE OR REPLACE FUNCTION so it can be re-run safely.
--
-- Tables (13):
--   profiles, posts, opportunities, applications, follows, likes,
--   comments, comment_likes, messages, notifications,
--   player_stats, scout_preferences, ai_recommendations
--
-- Also sets up: indexes, RLS policies, trigger functions, triggers,
-- storage buckets (avatars, posts, videos), realtime, grants.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- trigram text search

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email        text NOT NULL UNIQUE,
    name         text NOT NULL,
    role         text NOT NULL DEFAULT 'athlete'
                     CHECK (role IN (
                         'athlete','coach','scout','team','fan',
                         'trainer','gym','brand','academy'
                     )),
    avatar       text,
    cover_photo  text,
    bio          text,
    location     text,
    verified     boolean DEFAULT false,
    sport        text,
    position     text,
    achievements jsonb DEFAULT '[]'::jsonb,
    stats        jsonb DEFAULT '{}'::jsonb,
    role_specific_data jsonb DEFAULT '{}'::jsonb,
    followers_count  integer DEFAULT 0,
    following_count  integer DEFAULT 0,
    posts_count      integer DEFAULT 0,
    created_at   timestamptz DEFAULT now(),
    updated_at   timestamptz DEFAULT now()
);

-- Ensure all 9 roles are present even on an existing table (safe to re-run)
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_role_check
        CHECK (role IN (
            'athlete','coach','scout','team','fan',
            'trainer','gym','brand','academy'
        ));
EXCEPTION WHEN others THEN
    RAISE NOTICE 'profiles_role_check: %', SQLERRM;
END $$;

-- Add cover_photo column if missing on existing table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_photo text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_specific_data jsonb DEFAULT '{}'::jsonb;

-- ---------- posts ----------
CREATE TABLE IF NOT EXISTS public.posts (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title          text NOT NULL,
    description    text,
    video_url      text,
    image_url      text,
    type           text NOT NULL CHECK (type IN ('highlight','training','match','achievement')),
    likes_count    integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    views_count    integer DEFAULT 0,
    shares_count   integer DEFAULT 0,
    opportunity_id uuid,
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz DEFAULT now()
);

-- ---------- opportunities ----------
CREATE TABLE IF NOT EXISTS public.opportunities (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title             text NOT NULL,
    description       text NOT NULL,
    category          text NOT NULL CHECK (category IN ('tryouts','tournaments','sponsorships','scholarships','contracts')),
    type              jsonb DEFAULT '[]'::jsonb,
    sport             text,
    location          text NOT NULL,
    deadline          timestamptz NOT NULL,
    requirements      text,
    compensation      text,
    duration          text,
    age_range         text,
    skill_level       text,
    contact_info      text,
    additional_info   text,
    paid              boolean NOT NULL DEFAULT false,
    applications_count integer DEFAULT 0,
    created_at        timestamptz DEFAULT now(),
    updated_at        timestamptz DEFAULT now()
);

-- ---------- applications ----------
CREATE TABLE IF NOT EXISTS public.applications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    athlete_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status          text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected')),
    cover_letter    text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE(opportunity_id, athlete_id)
);

-- ---------- follows ----------
CREATE TABLE IF NOT EXISTS public.follows (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at   timestamptz DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- ---------- likes ----------
CREATE TABLE IF NOT EXISTS public.likes (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- ---------- comments ----------
CREATE TABLE IF NOT EXISTS public.comments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    content     text NOT NULL,
    likes_count integer DEFAULT 0,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- ---------- comment_likes ----------
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

-- ---------- messages ----------
CREATE TABLE IF NOT EXISTS public.messages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content     text NOT NULL,
    media_url   text,
    post_id     uuid REFERENCES public.posts(id) ON DELETE SET NULL,
    status      text DEFAULT 'sent' CHECK (status IN ('sent','delivered','read')),
    read        boolean DEFAULT false,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS public.notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type       text NOT NULL CHECK (type IN (
                   'like','follow','comment','opportunity','message',
                   'application','connection_request','connection_accepted',
                   'profile_view','mention','system'
               )),
    title      text NOT NULL,
    message    text NOT NULL,
    read       boolean DEFAULT false,
    data       jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- ---------- player_stats (scouting / AI) ----------
CREATE TABLE IF NOT EXISTS public.player_stats (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sport      text,
    position   text,
    skill      numeric NOT NULL DEFAULT 50,
    speed      numeric NOT NULL DEFAULT 50,
    stamina    numeric NOT NULL DEFAULT 50,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ---------- scout_preferences (scouting / AI) ----------
CREATE TABLE IF NOT EXISTS public.scout_preferences (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sport                text,
    preferred_positions  text[] DEFAULT '{}',
    weight_skill         numeric NOT NULL DEFAULT 0.35,
    weight_speed         numeric NOT NULL DEFAULT 0.25,
    weight_stamina       numeric NOT NULL DEFAULT 0.20,
    weight_position_match numeric NOT NULL DEFAULT 0.20,
    created_at           timestamptz DEFAULT now(),
    updated_at           timestamptz DEFAULT now()
);

-- ---------- ai_recommendations (scouting / AI) ----------
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fit_score  numeric NOT NULL DEFAULT 0,
    breakdown  jsonb NOT NULL DEFAULT '{}'::jsonb,
    notes      text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(scout_id, player_id)
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email          ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role           ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_sport          ON public.profiles(sport);
CREATE INDEX IF NOT EXISTS idx_profiles_location       ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at     ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_verified       ON public.profiles(verified) WHERE verified = true;

-- trigram index for name search (requires pg_trgm)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_name_trgm') THEN
        CREATE INDEX idx_profiles_name_trgm ON public.profiles USING gin(name gin_trgm_ops);
    END IF;
END $$;

-- posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id        ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at     ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type           ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_opportunity_id ON public.posts(opportunity_id) WHERE opportunity_id IS NOT NULL;

-- opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_team_id    ON public.opportunities(team_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_sport      ON public.opportunities(sport);
CREATE INDEX IF NOT EXISTS idx_opportunities_category   ON public.opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline   ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON public.opportunities(created_at DESC);

-- applications
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_athlete_id     ON public.applications(athlete_id);
CREATE INDEX IF NOT EXISTS idx_applications_status         ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at     ON public.applications(created_at DESC);

-- follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at   ON public.follows(created_at DESC);

-- likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id    ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id    ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id    ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id    ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- comment_likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id    ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id  ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread       ON public.messages(receiver_id, read) WHERE read = false;

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read       ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type       ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON public.notifications(user_id, read) WHERE read = false;

-- player_stats
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id  ON public.player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_sport      ON public.player_stats(sport);
CREATE INDEX IF NOT EXISTS idx_player_stats_updated_at ON public.player_stats(updated_at DESC);

-- scout_preferences
CREATE INDEX IF NOT EXISTS idx_scout_preferences_scout_id ON public.scout_preferences(scout_id);
CREATE INDEX IF NOT EXISTS idx_scout_preferences_sport    ON public.scout_preferences(sport);

-- ai_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_scout_id  ON public.ai_recommendations(scout_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_player_id ON public.ai_recommendations(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_score     ON public.ai_recommendations(fit_score DESC);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS POLICIES
--    Pattern: DROP IF EXISTS then CREATE, so re-runs are safe.
-- ============================================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Profiles are viewable by everyone"     ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile"    ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid()::text = id::text);
-- Note: service_role bypasses RLS by default. The handle_new_user() trigger uses
-- SECURITY DEFINER and also bypasses RLS. So this policy applies only to direct
-- user inserts via the anon/authenticated keys, which must match auth.uid().

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid()::text = id::text);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid()::text = id::text);

-- ---- posts ----
DROP POLICY IF EXISTS "Posts are viewable by everyone"    ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts"  ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts"  ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts"  ON public.posts;

CREATE POLICY "Posts are viewable by everyone"
    ON public.posts FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ---- opportunities ----
DROP POLICY IF EXISTS "Opportunities are viewable by everyone"  ON public.opportunities;
DROP POLICY IF EXISTS "Teams can create opportunities"          ON public.opportunities;
DROP POLICY IF EXISTS "Teams can update their opportunities"    ON public.opportunities;
DROP POLICY IF EXISTS "Teams can delete their opportunities"    ON public.opportunities;

CREATE POLICY "Opportunities are viewable by everyone"
    ON public.opportunities FOR SELECT USING (true);

CREATE POLICY "Teams can create opportunities"
    ON public.opportunities FOR INSERT
    WITH CHECK (auth.uid()::text = team_id::text);

CREATE POLICY "Teams can update their opportunities"
    ON public.opportunities FOR UPDATE
    USING (auth.uid()::text = team_id::text);

CREATE POLICY "Teams can delete their opportunities"
    ON public.opportunities FOR DELETE
    USING (auth.uid()::text = team_id::text);

-- ---- applications ----
DROP POLICY IF EXISTS "Applications are viewable by opportunity owner and applicant" ON public.applications;
DROP POLICY IF EXISTS "Athletes can create applications"                             ON public.applications;
DROP POLICY IF EXISTS "Athletes can update their applications"                       ON public.applications;
DROP POLICY IF EXISTS "Teams can update applications for their opportunities"        ON public.applications;
DROP POLICY IF EXISTS "Athletes can delete their applications"                       ON public.applications;

CREATE POLICY "Applications are viewable by opportunity owner and applicant"
    ON public.applications FOR SELECT
    USING (
        auth.uid()::text = athlete_id::text
        OR auth.uid()::text IN (
            SELECT team_id::text FROM public.opportunities WHERE id = opportunity_id
        )
    );

CREATE POLICY "Athletes can create applications"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid()::text = athlete_id::text);

CREATE POLICY "Athletes can update their applications"
    ON public.applications FOR UPDATE
    USING (auth.uid()::text = athlete_id::text);

CREATE POLICY "Teams can update applications for their opportunities"
    ON public.applications FOR UPDATE
    USING (auth.uid()::text IN (
        SELECT team_id::text FROM public.opportunities WHERE id = opportunity_id
    ));

CREATE POLICY "Athletes can delete their applications"
    ON public.applications FOR DELETE
    USING (auth.uid()::text = athlete_id::text);

-- ---- follows ----
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others"          ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow"               ON public.follows;

CREATE POLICY "Follows are viewable by everyone"
    ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid()::text = follower_id::text);

CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid()::text = follower_id::text);

-- ---- likes ----
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like posts"           ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts"         ON public.likes;

CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can unlike posts"
    ON public.likes FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ---- comments ----
DROP POLICY IF EXISTS "Comments are viewable by everyone"       ON public.comments;
DROP POLICY IF EXISTS "Users can create comments"               ON public.comments;
DROP POLICY IF EXISTS "Users can update their comments"         ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments"     ON public.comments;

CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT USING (true);

CREATE POLICY "Users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their comments"
    ON public.comments FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ---- comment_likes ----
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can like comments"                ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments"              ON public.comment_likes;

CREATE POLICY "Comment likes are viewable by everyone"
    ON public.comment_likes FOR SELECT USING (true);

CREATE POLICY "Users can like comments"
    ON public.comment_likes FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can unlike comments"
    ON public.comment_likes FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ---- messages ----
DROP POLICY IF EXISTS "Users can view their messages"           ON public.messages;
DROP POLICY IF EXISTS "Users can send messages"                 ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their messages"         ON public.messages;

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
    USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

-- ---- notifications ----
DROP POLICY IF EXISTS "Users can view their notifications"    ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications"  ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their notifications"  ON public.notifications;

CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ---- player_stats ----
DROP POLICY IF EXISTS "Player stats are viewable by everyone"   ON public.player_stats;
DROP POLICY IF EXISTS "Users can manage their own player stats" ON public.player_stats;

CREATE POLICY "Player stats are viewable by everyone"
    ON public.player_stats FOR SELECT USING (true);

CREATE POLICY "Users can manage their own player stats"
    ON public.player_stats FOR ALL
    USING (auth.uid()::text = player_id::text);

-- ---- scout_preferences ----
DROP POLICY IF EXISTS "Scout preferences are viewable by everyone"   ON public.scout_preferences;
DROP POLICY IF EXISTS "Users can manage their own scout preferences" ON public.scout_preferences;

CREATE POLICY "Scout preferences are viewable by everyone"
    ON public.scout_preferences FOR SELECT USING (true);

CREATE POLICY "Users can manage their own scout preferences"
    ON public.scout_preferences FOR ALL
    USING (auth.uid()::text = scout_id::text);

-- ---- ai_recommendations ----
DROP POLICY IF EXISTS "AI recommendations are viewable by involved users" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can manage their own recommendations"        ON public.ai_recommendations;

CREATE POLICY "AI recommendations are viewable by involved users"
    ON public.ai_recommendations FOR SELECT
    USING (
        auth.uid()::text = scout_id::text
        OR auth.uid()::text = player_id::text
    );

CREATE POLICY "Users can manage their own recommendations"
    ON public.ai_recommendations FOR ALL
    USING (auth.uid()::text = scout_id::text);

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- ---------- updated_at auto-setter ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ---------- handle_new_user (auto-create profile on auth signup) ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- ---------- count updaters (use GREATEST to prevent negative counts) ----------

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_posts_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_applications_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.opportunities SET applications_count = applications_count + 1 WHERE id = NEW.opportunity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.opportunities SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = OLD.opportunity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- ---------- notification creators ----------

CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    post_owner_id uuid;
    liker_name    text;
BEGIN
    SELECT p.user_id, pr.name INTO post_owner_id, liker_name
    FROM public.posts p
    JOIN public.profiles pr ON pr.id = NEW.user_id
    WHERE p.id = NEW.post_id;

    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            post_owner_id, 'like', 'New Like',
            liker_name || ' liked your post',
            jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    follower_name text;
BEGIN
    SELECT name INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;

    IF follower_name IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            NEW.following_id, 'follow', 'New Follower',
            follower_name || ' started following you',
            jsonb_build_object('follower_id', NEW.follower_id)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    post_owner_id  uuid;
    commenter_name text;
BEGIN
    SELECT p.user_id, pr.name INTO post_owner_id, commenter_name
    FROM public.posts p
    JOIN public.profiles pr ON pr.id = NEW.user_id
    WHERE p.id = NEW.post_id;

    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            post_owner_id, 'comment', 'New Comment',
            commenter_name || ' commented on your post',
            jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sender_name text;
BEGIN
    SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

    IF sender_name IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            NEW.receiver_id, 'message', 'New Message',
            sender_name || ' sent you a message',
            jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
        );
    END IF;
    RETURN NEW;
END;
$$;

-- ---------- helper: get_conversations ----------
-- SECURITY: zero-arg, auth.uid()-scoped. The old get_conversations(user_uuid)
-- overload let ANY anon-key caller read anyone's DM previews (F1 in the /cso
-- audit); it is dropped in 20260716_security_hardening.sql and must never be
-- reintroduced here.

DROP FUNCTION IF EXISTS public.get_conversations(uuid);

CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
    participant_id      uuid,
    participant_name    text,
    participant_avatar  text,
    participant_role    text,
    last_message        text,
    last_message_time   timestamptz,
    unread_count        bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_uuid uuid := auth.uid();
BEGIN
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;
    RETURN QUERY
    WITH convos AS (
        SELECT DISTINCT
            CASE WHEN m.sender_id = user_uuid THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
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
            SELECT content FROM public.messages
            WHERE (sender_id = user_uuid AND receiver_id = c.other_user_id)
               OR (sender_id = c.other_user_id AND receiver_id = user_uuid)
            ORDER BY created_at DESC LIMIT 1
        ),
        c.last_msg_time,
        (
            SELECT COUNT(*) FROM public.messages
            WHERE sender_id = c.other_user_id
              AND receiver_id = user_uuid
              AND read = false
        )::bigint
    FROM convos c
    JOIN public.profiles p ON p.id = c.other_user_id
    ORDER BY c.last_msg_time DESC;
END;
$$;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Drop all existing triggers first so re-runs are clean
DROP TRIGGER IF EXISTS on_auth_user_created        ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at   ON public.profiles;
DROP TRIGGER IF EXISTS update_posts_updated_at      ON public.posts;
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
DROP TRIGGER IF EXISTS update_applications_updated_at  ON public.applications;
DROP TRIGGER IF EXISTS update_comments_updated_at   ON public.comments;
DROP TRIGGER IF EXISTS update_messages_updated_at   ON public.messages;
DROP TRIGGER IF EXISTS update_player_stats_updated_at ON public.player_stats;
DROP TRIGGER IF EXISTS update_scout_preferences_updated_at ON public.scout_preferences;
DROP TRIGGER IF EXISTS update_ai_recommendations_updated_at ON public.ai_recommendations;
DROP TRIGGER IF EXISTS on_like_change              ON public.likes;
DROP TRIGGER IF EXISTS on_comment_change           ON public.comments;
DROP TRIGGER IF EXISTS on_comment_like_change      ON public.comment_likes;
DROP TRIGGER IF EXISTS on_follow_change            ON public.follows;
DROP TRIGGER IF EXISTS on_post_change              ON public.posts;
DROP TRIGGER IF EXISTS on_application_change       ON public.applications;
DROP TRIGGER IF EXISTS on_like_notification        ON public.likes;
DROP TRIGGER IF EXISTS on_follow_notification      ON public.follows;
DROP TRIGGER IF EXISTS on_comment_notification     ON public.comments;
DROP TRIGGER IF EXISTS on_message_notification     ON public.messages;

-- Auto-create profile on auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
    BEFORE UPDATE ON public.player_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scout_preferences_updated_at
    BEFORE UPDATE ON public.scout_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
    BEFORE UPDATE ON public.ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Count-update triggers
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER on_comment_like_change
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

CREATE TRIGGER on_follow_change
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

CREATE TRIGGER on_post_change
    AFTER INSERT OR DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_posts_count();

CREATE TRIGGER on_application_change
    AFTER INSERT OR DELETE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_applications_count();

-- Notification triggers
CREATE TRIGGER on_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.create_like_notification();

CREATE TRIGGER on_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.create_follow_notification();

CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

CREATE TRIGGER on_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.create_message_notification();

-- ============================================================================
-- 8. STORAGE BUCKETS
-- ============================================================================

-- Avatars bucket (10 MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 'avatars', true, 10485760,
    ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

-- Posts bucket (50 MB limit, images + video)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'posts', 'posts', true, 52428800,
    ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm'];

-- Videos bucket (100 MB limit, video only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos', 'videos', true, 104857600,
    ARRAY['video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/mp4','video/quicktime','video/webm'];

-- ============================================================================
-- 9. STORAGE RLS POLICIES
-- ============================================================================

-- Drop all existing storage policies (best-effort)
DROP POLICY IF EXISTS "Avatar images are publicly accessible"  ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"      ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"      ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"      ON storage.objects;
DROP POLICY IF EXISTS "Posts files are publicly accessible"    ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own posts media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own posts media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own posts media" ON storage.objects;
DROP POLICY IF EXISTS "Videos files are publicly accessible"   ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own videos"      ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos"      ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos"      ON storage.objects;

-- Avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Posts media
CREATE POLICY "Posts files are publicly accessible" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'posts');

CREATE POLICY "Users can upload their own posts media" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own posts media" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own posts media" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Videos
CREATE POLICY "Videos files are publicly accessible" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'videos');

CREATE POLICY "Users can upload their own videos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own videos" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- 10. REALTIME
-- ============================================================================

-- Enable realtime for key tables (safe to re-run; will no-op if already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.player_stats;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scout_preferences;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_recommendations;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================================
-- 11. GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- SECURITY: blanket GRANT ALL (tables + functions, incl. to anon) was the
-- reason every SECURITY DEFINER helper and PII column was reachable by any
-- anon-key holder (/cso audit). Authenticated gets table access (RLS scopes
-- rows; column grants below scope profiles); anon gets nothing by default —
-- grant anon per-table only when a public surface genuinely needs it.
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
-- anon exceptions (deliberate):
GRANT INSERT ON public.analytics_events TO anon;  -- pre-login telemetry (null-user policy)
DO $$
BEGIN
  -- waitlist is created by scripts/create-waitlist-table.ts, not this file
  IF to_regclass('public.waitlist') IS NOT NULL THEN
    GRANT INSERT ON public.waitlist TO anon;      -- public waitlist form
  END IF;
END $$;

-- ============================================================================
-- 11b. SECURITY HARDENING (mirrors supabase/migrations/20260716_security_hardening.sql)
-- Keep this section in sync with that migration — canonical file is the
-- source of truth for fresh environments.
-- ============================================================================

-- Columns added by side migrations, folded into canonical:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token text;
ALTER TABLE public.fitness_test_results ADD COLUMN IF NOT EXISTS verification_mode text
  CHECK (verification_mode IN ('remote_video','in_person','sensor_only'));

-- Profiles column-level SELECT: email + push_token are never client-readable.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, role, avatar, cover_photo, bio, location, city, state,
  verified, sport, position, achievements, stats, role_specific_data,
  gender, date_of_birth,
  followers_count, following_count, posts_count,
  created_at, updated_at
) ON public.profiles TO authenticated;
GRANT UPDATE (
  name, avatar, cover_photo, bio, location, city, state, sport, position,
  achievements, stats, role_specific_data, gender, date_of_birth, push_token,
  updated_at
) ON public.profiles TO authenticated;

-- Guard triggers + approve_verification RPC + search indexes: definitions
-- live in supabase/migrations/20260716_security_hardening.sql — run that file
-- after this one on any fresh environment. (Not duplicated inline to keep one
-- authoritative definition of the security-critical functions.)

-- ============================================================================
-- 12. VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_count integer;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
          'profiles','posts','opportunities','applications',
          'follows','likes','comments','comment_likes',
          'messages','notifications',
          'player_stats','scout_preferences','ai_recommendations'
      );

    IF table_count = 13 THEN
        RAISE NOTICE 'All 13 tables created successfully.';
    ELSE
        RAISE WARNING 'Only % of 13 expected tables found.', table_count;
    END IF;
END $$;

SELECT 'OnlySports canonical schema applied successfully.' AS status;
