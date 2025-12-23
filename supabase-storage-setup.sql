-- Storage buckets + strict RLS policies (Supabase Storage)
-- Run this in your Supabase SQL editor

-- IMPORTANT
-- 1) Make sure you have Storage enabled in your Supabase project
-- 2) This enforces an "owner folder" convention per bucket
--    - avatars:  avatars/<userId>/<file>
--    - posts:    posts/<userId>/<file>
--    - videos:   videos/<userId>/<file>
-- 3) Buckets are public for viewing (SELECT) but writes are restricted to the folder owner

-- NOTE
-- storage.objects is owned by a system role in Supabase.
-- If you see: "ERROR: 42501: must be owner of table objects"
-- you are not running this as the project owner (postgres/supabase_admin).
-- Run this file in Supabase Dashboard → SQL Editor while logged in as the project owner.
--
-- In most Supabase projects, storage.objects RLS is already enabled by default.

-- -----------------------------------------------------------------------------
-- Buckets
-- -----------------------------------------------------------------------------

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Posts bucket (images + short clips)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

-- Videos bucket (optional, if you separate longer videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm'];

-- -----------------------------------------------------------------------------
-- Policies
-- NOTE: Policies are global on storage.objects, so names MUST be unique.
-- -----------------------------------------------------------------------------

-- Drop existing (best-effort) policies we may have created earlier
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view posts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

DROP POLICY IF EXISTS "Posts files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own posts media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own posts media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own posts media" ON storage.objects;

DROP POLICY IF EXISTS "Videos files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- ---- avatars (public read, owner write) ----

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---- posts (public read, owner write) ----

CREATE POLICY "Posts files are publicly accessible" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'posts');

CREATE POLICY "Users can upload their own posts media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own posts media" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own posts media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---- videos (public read, owner write) ----

CREATE POLICY "Videos files are publicly accessible" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'videos');

CREATE POLICY "Users can upload their own videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- -----------------------------------------------------------------------------
-- Verify
-- -----------------------------------------------------------------------------
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('avatars', 'posts', 'videos');
