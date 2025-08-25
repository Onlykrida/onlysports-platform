# Supabase Configuration Guide

## Current Status
The app is currently using a mock Supabase client to prevent crashes. To connect to your actual Supabase instance, follow these steps:

## Step 1: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

## Step 2: Update the Configuration
Replace the placeholder values in `constants/supabase.ts`:

```typescript
// Replace these with your actual values
const supabaseUrl = 'YOUR_ACTUAL_SUPABASE_URL'; // e.g., 'https://abcdefgh.supabase.co'
const supabaseAnonKey = 'YOUR_ACTUAL_ANON_KEY'; // Your anon/public key
```

## Step 3: Set Up Database Tables
Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('athlete', 'coach', 'scout', 'team', 'fan')) NOT NULL,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  sport TEXT,
  position TEXT,
  achievements JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  type TEXT CHECK (type IN ('highlight', 'training', 'match', 'achievement')) NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunities table
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('tryout', 'tournament', 'sponsorship', 'scholarship')) NOT NULL,
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  deadline DATE NOT NULL,
  requirements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Teams can insert opportunities" ON opportunities FOR INSERT WITH CHECK (auth.uid() = team_id);
CREATE POLICY "Teams can update own opportunities" ON opportunities FOR UPDATE USING (auth.uid() = team_id);
CREATE POLICY "Teams can delete own opportunities" ON opportunities FOR DELETE USING (auth.uid() = team_id);

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;
```

## Step 4: Test the Connection
After updating the configuration, restart your app. The authentication should now work with your Supabase instance.

## Troubleshooting
- Make sure your Supabase project is active and not paused
- Verify that RLS policies are set up correctly
- Check the browser console for any authentication errors
- Ensure your anon key has the correct permissions