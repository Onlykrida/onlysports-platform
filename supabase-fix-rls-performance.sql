-- Fix RLS Policy Performance Issues
-- This script optimizes RLS policies by wrapping auth.uid() in subqueries
-- to prevent re-evaluation for each row, improving query performance at scale

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Teams can insert their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Teams can update their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Teams can delete their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;
DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- PROFILES: Optimized RLS Policies
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING ((select auth.uid()) = id);

-- POSTS: Optimized RLS Policies
CREATE POLICY "Users can insert their own posts" ON public.posts
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING ((select auth.uid()) = user_id);

-- OPPORTUNITIES: Optimized RLS Policies
CREATE POLICY "Teams can insert their own opportunities" ON public.opportunities
    FOR INSERT WITH CHECK ((select auth.uid()) = team_id);

CREATE POLICY "Teams can update their own opportunities" ON public.opportunities
    FOR UPDATE USING ((select auth.uid()) = team_id);

CREATE POLICY "Teams can delete their own opportunities" ON public.opportunities
    FOR DELETE USING ((select auth.uid()) = team_id);

-- FOLLOWS: Optimized RLS Policies
CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK ((select auth.uid()) = follower_id AND follower_id <> following_id);

CREATE POLICY "Users can unfollow others" ON public.follows
    FOR DELETE USING ((select auth.uid()) = follower_id);

-- LIKES: Optimized RLS Policies
CREATE POLICY "Users can like posts" ON public.likes
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can unlike posts" ON public.likes
    FOR DELETE USING ((select auth.uid()) = user_id);

-- COMMENTS: Optimized RLS Policies
CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING ((select auth.uid()) = user_id);

-- COMMENT_LIKES: Optimized RLS Policies
CREATE POLICY "Users can like comments" ON public.comment_likes
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can unlike comments" ON public.comment_likes
    FOR DELETE USING ((select auth.uid()) = user_id);

-- MESSAGES: Optimized RLS Policies
CREATE POLICY "Users can view messages they sent or received" ON public.messages
    FOR SELECT USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "Users can update messages they received" ON public.messages
    FOR UPDATE USING ((select auth.uid()) = receiver_id);

-- NOTIFICATIONS: Optimized RLS Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING ((select auth.uid()) = user_id);

-- Success message
SELECT 'RLS policies optimized successfully! All auth.uid() calls are now wrapped in subqueries for better performance.' as status;
