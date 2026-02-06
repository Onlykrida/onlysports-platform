# Storage Bucket Setup

## Required Bucket Configuration

You need to create **ONE** public bucket named `posts` in your Supabase Storage.

### Step-by-Step Instructions:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**

### Bucket Settings:

- **Bucket name**: `posts`
- **Public bucket**: ✅ **TOGGLE THIS ON** (This is critical!)
- **File size limit**: 50 MB
- **Allowed MIME types**: Leave empty or set to `image/*, video/*`

5. Click **"Create bucket"**

### Configure Storage Policies (RLS):

After creating the bucket, you need to set up policies:

1. Click on the `posts` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"** and add these 4 policies:

#### Policy 1: Upload (INSERT)
```sql
-- Name: Allow authenticated users to upload
-- Target roles: authenticated
-- WITH CHECK expression:
bucket_id = 'posts'
```

#### Policy 2: View (SELECT)
```sql
-- Name: Allow public to view
-- Target roles: public
-- USING expression:
bucket_id = 'posts'
```

#### Policy 3: Update
```sql
-- Name: Allow users to update their files
-- Target roles: authenticated
-- USING and WITH CHECK expression:
bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 4: Delete
```sql
-- Name: Allow users to delete their files
-- Target roles: authenticated
-- USING expression:
bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Quick SQL Setup (Alternative)

You can also run this SQL in the SQL Editor:

```sql
-- Ensure the bucket exists (you may need to create it manually first)
-- Then run this to set up policies:

-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow authenticated users to upload',
  'posts',
  'bucket_id = ''posts'''::text
);

-- Allow public to view files
INSERT INTO storage.policies (name, bucket_id, definition, roles)
VALUES (
  'Allow public to view',
  'posts',
  'bucket_id = ''posts'''::text,
  ARRAY['public']
);
```

### Verification:

After setup, verify:
1. The bucket appears in Storage section
2. It shows a **🌐 Public** badge
3. Try uploading an image/video in the app
4. The media should be visible to all users

### Troubleshooting:

**Error: "Bucket not found"**
- Make sure the bucket is named exactly `posts` (lowercase)

**Error: "new row violates row-level security policy"**
- The bucket needs to be marked as Public
- Check that the policies are correctly set up

**Media not visible to other users:**
- The bucket must be Public
- Go to Storage > posts bucket > Settings > Toggle "Public bucket" ON
