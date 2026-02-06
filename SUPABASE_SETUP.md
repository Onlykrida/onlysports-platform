# Supabase Setup Guide for OnlyKrida

## 1. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in to your account
2. Select your OnlyKrida project (or create a new one)
3. Go to **Settings** → **API**
4. Copy your:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 2. Update Your App Configuration

Open `constants/supabase.ts` and replace:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual credentials:
```typescript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## 3. Set Up Database Tables

Run these SQL commands in your Supabase SQL Editor:

### Create Profiles Table
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'scout', 'team', 'fan')),
  avatar TEXT,
  bio TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  sport TEXT,
  position TEXT,
  achievements JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Create Posts Table
```sql
-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('highlight', 'training', 'match', 'achievement')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

### Create Opportunities Table
```sql
-- Create opportunities table
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tryout', 'tournament', 'sponsorship', 'scholarship')),
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Opportunities are viewable by everyone" ON opportunities
  FOR SELECT USING (true);

CREATE POLICY "Teams can insert opportunities" ON opportunities
  FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Teams can update their opportunities" ON opportunities
  FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Teams can delete their opportunities" ON opportunities
  FOR DELETE USING (auth.uid() = team_id);
```

### Create Updated At Trigger
```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Enable Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Enable **Email** authentication
3. Optionally enable **Google** or other providers
4. Configure your site URL (for development: `http://localhost:8081`)

## 5. Test the Connection

After updating your credentials, restart your app and try:
1. Creating a new account (signup)
2. Logging in with existing credentials
3. The app should now connect to your Supabase database!

## Features Now Available

✅ **User Authentication**: Signup, login, logout with Supabase Auth
✅ **User Profiles**: Store and update user information
✅ **Database Integration**: All user data stored in Supabase
✅ **Real-time Updates**: Automatic sync with database changes
✅ **Security**: Row Level Security (RLS) policies protect user data

## Next Steps

- Set up file storage for images/videos in Supabase Storage
- Add real-time subscriptions for live updates
- Implement push notifications
- Add social features (follows, likes, comments)