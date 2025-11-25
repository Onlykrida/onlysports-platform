-- Fix all function_search_path_mutable warnings
-- Drop and recreate functions with SET search_path = ''

-- 1. Drop all functions first
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_posts_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.create_follow_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_follow_counts() CASCADE;
DROP FUNCTION IF EXISTS public.create_like_notification() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.create_comment_notification() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.create_message_notification() CASCADE;
DROP FUNCTION IF EXISTS public.create_application_notification() CASCADE;
DROP FUNCTION IF EXISTS public.get_unread_message_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_application_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_followers_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_posts_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- 2. Recreate functions with proper search_path

-- Handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update posts count
CREATE OR REPLACE FUNCTION public.update_posts_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET posts_count = posts_count - 1
    WHERE id = OLD.user_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET posts_count = posts_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create follow notification
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.follower_id != NEW.following_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id)
    VALUES (NEW.following_id, 'follow', NEW.follower_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'athlete');
  RETURN NEW;
END;
$$;

-- Update follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    
    UPDATE public.profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create like notification
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id)
    VALUES (post_owner_id, 'like', NEW.user_id, NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create comment notification
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, comment_id)
    VALUES (post_owner_id, 'comment', NEW.user_id, NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create message notification
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  other_user_id uuid;
BEGIN
  SELECT CASE
    WHEN participant1_id = NEW.sender_id THEN participant2_id
    ELSE participant1_id
  END INTO other_user_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  IF other_user_id IS NOT NULL AND other_user_id != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, conversation_id)
    VALUES (other_user_id, 'message', NEW.sender_id, NEW.conversation_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create application notification
CREATE OR REPLACE FUNCTION public.create_application_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  opportunity_owner_id uuid;
BEGIN
  SELECT user_id INTO opportunity_owner_id
  FROM public.opportunities
  WHERE id = NEW.opportunity_id;
  
  IF opportunity_owner_id IS NOT NULL AND opportunity_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, opportunity_id)
    VALUES (opportunity_owner_id, 'application', NEW.user_id, NEW.opportunity_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(DISTINCT m.conversation_id)::integer INTO unread_count
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE (c.participant1_id = p_user_id OR c.participant2_id = p_user_id)
    AND m.sender_id != p_user_id
    AND NOT m.read;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Get application count
CREATE OR REPLACE FUNCTION public.get_application_count(p_opportunity_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  app_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO app_count
  FROM public.opportunity_applications
  WHERE opportunity_id = p_opportunity_id;
  
  RETURN COALESCE(app_count, 0);
END;
$$;

-- Update profile followers count
CREATE OR REPLACE FUNCTION public.update_profile_followers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Update profile posts count
CREATE OR REPLACE FUNCTION public.update_profile_posts_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET posts_count = posts_count + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET posts_count = GREATEST(0, posts_count - 1)
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Recreate triggers (if they were dropped)

-- Updated at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_posts_updated_at
      BEFORE UPDATE ON public.posts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at'
  ) THEN
    CREATE TRIGGER update_conversations_updated_at
      BEFORE UPDATE ON public.conversations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Posts count triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_posts_count_on_insert'
  ) THEN
    CREATE TRIGGER update_profile_posts_count_on_insert
      AFTER INSERT ON public.posts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_profile_posts_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profile_posts_count_on_delete'
  ) THEN
    CREATE TRIGGER update_profile_posts_count_on_delete
      AFTER DELETE ON public.posts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_profile_posts_count();
  END IF;
END $$;

-- Follow count triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_follow_counts_on_insert'
  ) THEN
    CREATE TRIGGER update_follow_counts_on_insert
      AFTER INSERT ON public.follows
      FOR EACH ROW
      EXECUTE FUNCTION public.update_follow_counts();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_follow_counts_on_delete'
  ) THEN
    CREATE TRIGGER update_follow_counts_on_delete
      AFTER DELETE ON public.follows
      FOR EACH ROW
      EXECUTE FUNCTION public.update_follow_counts();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_follow_notification_trigger'
  ) THEN
    CREATE TRIGGER create_follow_notification_trigger
      AFTER INSERT ON public.follows
      FOR EACH ROW
      EXECUTE FUNCTION public.create_follow_notification();
  END IF;
END $$;

-- Post likes triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_likes_count_on_insert'
  ) THEN
    CREATE TRIGGER update_post_likes_count_on_insert
      AFTER INSERT ON public.post_likes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_post_likes_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_likes_count_on_delete'
  ) THEN
    CREATE TRIGGER update_post_likes_count_on_delete
      AFTER DELETE ON public.post_likes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_post_likes_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_like_notification_trigger'
  ) THEN
    CREATE TRIGGER create_like_notification_trigger
      AFTER INSERT ON public.post_likes
      FOR EACH ROW
      EXECUTE FUNCTION public.create_like_notification();
  END IF;
END $$;

-- Comment count triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_comments_count_on_insert'
  ) THEN
    CREATE TRIGGER update_post_comments_count_on_insert
      AFTER INSERT ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_post_comments_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_comments_count_on_delete'
  ) THEN
    CREATE TRIGGER update_post_comments_count_on_delete
      AFTER DELETE ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_post_comments_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_comment_notification_trigger'
  ) THEN
    CREATE TRIGGER create_comment_notification_trigger
      AFTER INSERT ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION public.create_comment_notification();
  END IF;
END $$;

-- Comment likes triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_likes_count_on_insert'
  ) THEN
    CREATE TRIGGER update_comment_likes_count_on_insert
      AFTER INSERT ON public.comment_likes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_comment_likes_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_likes_count_on_delete'
  ) THEN
    CREATE TRIGGER update_comment_likes_count_on_delete
      AFTER DELETE ON public.comment_likes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_comment_likes_count();
  END IF;
END $$;

-- Message triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversation_last_message_trigger'
  ) THEN
    CREATE TRIGGER update_conversation_last_message_trigger
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.update_conversation_last_message();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_message_notification_trigger'
  ) THEN
    CREATE TRIGGER create_message_notification_trigger
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.create_message_notification();
  END IF;
END $$;

-- Application triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_application_notification_trigger'
  ) THEN
    CREATE TRIGGER create_application_notification_trigger
      AFTER INSERT ON public.opportunity_applications
      FOR EACH ROW
      EXECUTE FUNCTION public.create_application_notification();
  END IF;
END $$;
