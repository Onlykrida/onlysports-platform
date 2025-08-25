# Database Setup Instructions

## The Problem
You're getting "Permission denied. Please check your database policies" because the database tables and Row Level Security (RLS) policies haven't been set up in your Supabase database.

## Quick Fix Steps

### 1. Go to Your Supabase Dashboard
- Open https://supabase.com/dashboard
- Select your project: `dcixlerneuuyhsftnifm`

### 2. Open SQL Editor
- In the left sidebar, click on "SQL Editor"
- Click "New Query"

### 3. Run the Setup Script
- Copy the entire contents of `supabase-setup.sql` from your project
- Paste it into the SQL Editor
- Click "Run" button

### 4. Verify Setup
- After running the script, you should see success messages
- Check that these tables exist in the "Table Editor":
  - `profiles`
  - `posts` 
  - `opportunities`

### 5. Test the App
- Try signing up again in your app
- The error should be resolved

## What the Script Does

1. **Creates Tables**: Sets up the database schema for profiles, posts, and opportunities
2. **Enables RLS**: Activates Row Level Security for data protection
3. **Creates Policies**: Sets up permissions so users can only access their own data
4. **Adds Indexes**: Improves query performance
5. **Creates Triggers**: Automatically updates timestamps

## Common Issues & Solutions

### Issue: "Table already exists" error
**Solution**: The script uses `CREATE TABLE IF NOT EXISTS` so this shouldn't happen, but if it does, the script will continue.

### Issue: "Policy already exists" error  
**Solution**: The updated script drops existing policies first to avoid conflicts.

### Issue: Still getting permission errors after setup
**Solutions**:
1. Make sure you ran the ENTIRE script, not just parts of it
2. Check that RLS is enabled on all tables
3. Verify policies exist in the "Authentication" > "Policies" section

### Issue: Can't find SQL Editor
**Solution**: Make sure you're logged into the correct Supabase project and have the right permissions.

## Verification Checklist

After running the script, verify these items in your Supabase dashboard:

- [ ] Tables exist: `profiles`, `posts`, `opportunities`
- [ ] RLS is enabled on all tables (green shield icon)
- [ ] Policies exist for each table (check Authentication > Policies)
- [ ] No error messages in the SQL Editor output

## Need Help?

If you're still having issues:

1. Check the SQL Editor output for any error messages
2. Make sure you're using the correct Supabase project
3. Verify your project URL and anon key are correct in the app
4. Try running the script again (it's safe to run multiple times)

## Alternative: Manual Setup

If the script doesn't work, you can create the tables manually:

1. Go to "Table Editor" in Supabase
2. Click "Create a new table"
3. Create the `profiles` table with these columns:
   - `id` (uuid, primary key, references auth.users)
   - `email` (text, required)
   - `name` (text, required)
   - `role` (text, required)
   - `verified` (boolean, default false)
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

4. Enable RLS on the table
5. Add these policies:
   - SELECT: `true` (public read)
   - INSERT: `auth.uid() = id` (users can insert their own profile)
   - UPDATE: `auth.uid() = id` (users can update their own profile)

Repeat similar steps for `posts` and `opportunities` tables.