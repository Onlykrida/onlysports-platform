-- Storage bucket setup for posts with public access
-- Run this in your Supabase SQL editor

-- Create the posts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true, -- Make bucket public so anyone can view the files
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view posts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create storage policies for the posts bucket

-- Allow all authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public (everyone) to view all files in the posts bucket
CREATE POLICY "Allow public to view posts" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'posts');

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Verify the bucket is public
SELECT id, name, public FROM storage.buckets WHERE id = 'posts';