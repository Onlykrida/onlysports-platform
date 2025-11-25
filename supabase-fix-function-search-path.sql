-- Fix Function Search Path Mutable Security Warnings
-- This sets the search_path for all functions to prevent security vulnerabilities
-- Run this SQL in your Supabase SQL Editor

-- 1. handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. update_posts_count
CREATE OR REPLACE FUNCTION public.update_posts_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET posts_count = posts_count + 1
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET posts_count = GREATEST(0, posts_count - 1)
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. update_comment_likes_count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. create_follow_notification
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, created_at)
  VALUES (NEW.following_id, 'follow', NEW.follower_id, NOW());
  RETURN NEW;
END;
$$;

-- 5. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$;

-- 6. update_follow_counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE user_id = NEW.follower_id;
    
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE user_id = OLD.follower_id;
    
    UPDATE profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE user_id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 7. create_like_notification
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id, created_at)
    VALUES (post_owner_id, 'like', NEW.user_id, NEW.post_id, NOW());
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. update_post_likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 9. create_comment_notification
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, created_at)
    VALUES (post_owner_id, 'comment', NEW.user_id, NEW.post_id, NEW.id, NOW());
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. update_post_comments_count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 11. create_message_notification
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  recipient_id UUID;
BEGIN
  SELECT CASE 
    WHEN c.user1_id = NEW.sender_id THEN c.user2_id
    ELSE c.user1_id
  END INTO recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, actor_id, created_at)
    VALUES (recipient_id, 'message', NEW.sender_id, NOW());
  END IF;
  
  RETURN NEW;
END;
$$;

-- 12. create_application_notification
CREATE OR REPLACE FUNCTION public.create_application_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  opportunity_owner_id UUID;
BEGIN
  SELECT user_id INTO opportunity_owner_id FROM opportunities WHERE id = NEW.opportunity_id;
  
  IF opportunity_owner_id IS NOT NULL AND opportunity_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, opportunity_id, created_at)
    VALUES (opportunity_owner_id, 'application', NEW.user_id, NEW.opportunity_id, NOW());
  END IF;
  
  RETURN NEW;
END;
$$;

-- 13. get_unread_message_count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT m.conversation_id)
  INTO unread_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE m.sender_id != p_user_id
    AND (c.user1_id = p_user_id OR c.user2_id = p_user_id)
    AND m.created_at > COALESCE(
      (SELECT last_read_at FROM conversation_participants WHERE conversation_id = c.id AND user_id = p_user_id),
      '1970-01-01'::TIMESTAMP
    );
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- 14. get_application_count
CREATE OR REPLACE FUNCTION public.get_application_count(p_opportunity_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  app_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO app_count
  FROM opportunity_applications
  WHERE opportunity_id = p_opportunity_id;
  
  RETURN COALESCE(app_count, 0);
END;
$$;

-- 15. update_profile_followers_count
CREATE OR REPLACE FUNCTION public.update_profile_followers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE user_id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 16. update_profile_posts_count
CREATE OR REPLACE FUNCTION public.update_profile_posts_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET posts_count = posts_count + 1
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET posts_count = GREATEST(0, posts_count - 1)
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 17. update_conversation_last_message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- 18. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Verification: Check if all functions now have search_path set
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  CASE 
    WHEN p.proconfig IS NULL THEN 'NO SEARCH PATH SET'
    ELSE array_to_string(p.proconfig, ', ')
  END AS configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_updated_at',
    'update_posts_count',
    'update_comment_likes_count',
    'create_follow_notification',
    'handle_new_user',
    'update_follow_counts',
    'create_like_notification',
    'update_post_likes_count',
    'create_comment_notification',
    'update_post_comments_count',
    'create_message_notification',
    'create_application_notification',
    'get_unread_message_count',
    'get_application_count',
    'update_profile_followers_count',
    'update_profile_posts_count',
    'update_conversation_last_message',
    'update_updated_at_column'
  )
ORDER BY p.proname;
