-- ============================================================================
-- OnlyKrida — Storage RLS policies for the `posts` bucket
--
-- Generated: 2026-04-26
-- Idempotent (DROP POLICY IF EXISTS before each CREATE)
--
-- Apply via: Supabase Dashboard → SQL Editor at
-- https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- WHY THIS EXISTS
-- ----------------------------------------------------------------------------
-- supabase-js storage uploads to the `posts` bucket fail with
-- "new row violates row-level security policy" (status 403) for authenticated
-- users. On Android Expo Go this surfaces as a generic "Network request
-- failed" because RN's fetch wraps non-2xx binary responses opaquely. Without
-- these policies, no athlete can post a photo or video. avatars and videos
-- buckets already have working policies; only `posts` is missing.
--
-- POLICIES INSTALLED
-- ----------------------------------------------------------------------------
--   1. posts_read_public         — anyone can SELECT (bucket is public)
--   2. posts_insert_own_folder   — authenticated users INSERT into
--                                   posts/images/<their_uid>/* or
--                                   posts/videos/<their_uid>/*
--   3. posts_update_own_folder   — authenticated users UPDATE their own files
--   4. posts_delete_own_folder   — authenticated users DELETE their own files
--
-- Path convention enforced for posts bucket:
--   posts/images/<user_id>/<timestamp>-<rand>.<ext>
--   posts/videos/<user_id>/<timestamp>-<rand>.<ext>
-- (matches hooks/posts-context.tsx:540 mediaFolder + user.id + filename)
-- ============================================================================

DROP POLICY IF EXISTS "posts_read_public"       ON storage.objects;
DROP POLICY IF EXISTS "posts_insert_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "posts_update_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "posts_delete_own_folder" ON storage.objects;

CREATE POLICY "posts_read_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'posts');

CREATE POLICY "posts_insert_own_folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'posts'
    AND (storage.foldername(name))[1] IN ('images', 'videos')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "posts_update_own_folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'posts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'posts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "posts_delete_own_folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'posts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
