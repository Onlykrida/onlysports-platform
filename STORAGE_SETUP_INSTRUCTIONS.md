# Storage Setup Instructions for OnlySports

## Problem
Posts are only visible to the creator because the storage bucket is not properly configured for public access.

## Solution
You need to configure the Supabase Storage bucket to allow public access to uploaded media files.

### Option 1: Using SQL (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-storage-setup.sql`
4. Run the query
5. Verify the bucket is public by checking the Storage section

### Option 2: Using Supabase Dashboard UI
1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. If "posts" bucket doesn't exist:
   - Click "New bucket"
   - Name: `posts`
   - **IMPORTANT: Toggle "Public bucket" to ON**
   - File size limit: 50MB
   - Allowed MIME types: image/*, video/*
   - Click "Create bucket"

4. If "posts" bucket exists but is private:
   - Click on the bucket settings (gear icon)
   - Toggle "Public bucket" to ON
   - Save changes

5. Configure RLS Policies:
   - Click on "Policies" tab for the posts bucket
   - Add the following policies:

   **Upload Policy** (INSERT):
   - Name: "Allow authenticated users to upload"
   - Target roles: authenticated
   - WITH CHECK expression:
   ```sql
   bucket_id = 'posts' AND
   (storage.foldername(name))[1] = 'posts' AND
   (storage.foldername(name))[2] = auth.uid()::text
   ```

   **View Policy** (SELECT):
   - Name: "Allow public to view posts"
   - Target roles: public
   - USING expression:
   ```sql
   bucket_id = 'posts'
   ```

   **Update Policy** (UPDATE):
   - Name: "Allow users to update their own files"
   - Target roles: authenticated
   - USING and WITH CHECK expression:
   ```sql
   bucket_id = 'posts' AND
   (storage.foldername(name))[1] = 'posts' AND
   (storage.foldername(name))[2] = auth.uid()::text
   ```

   **Delete Policy** (DELETE):
   - Name: "Allow users to delete their own files"
   - Target roles: authenticated
   - USING expression:
   ```sql
   bucket_id = 'posts' AND
   (storage.foldername(name))[1] = 'posts' AND
   (storage.foldername(name))[2] = auth.uid()::text
   ```

## Testing
After setting up the storage bucket:
1. Create a new post with an image or video
2. Log out and check if the post is visible
3. Or open the post in an incognito window
4. The media should be visible to everyone

## Important Notes
- The bucket MUST be set to public for posts to be visible to all users
- The folder structure is: `posts/{user_id}/{filename}`
- Only authenticated users can upload to their own folder
- Everyone (including anonymous users) can view the files
- Users can only modify/delete their own files

## Troubleshooting
If posts are still not visible after setup:
1. Verify the bucket is public in Storage settings
2. Check that RLS policies are correctly applied
3. Clear your app cache and reload
4. Check browser console for any CORS errors
5. Verify the public URL is being generated correctly