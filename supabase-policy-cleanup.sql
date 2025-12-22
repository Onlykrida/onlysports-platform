-- Policy Cleanup Script for OnlySports
-- Run this in your Supabase SQL Editor to fix duplicate policies

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON profiles;

-- Recreate clean policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Add a service role policy for debugging (optional but helpful)
CREATE POLICY "Service role can do anything" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Policy cleanup completed successfully!';
  RAISE NOTICE 'Duplicate policies removed and clean policies created.';
  RAISE NOTICE 'You should now be able to create profiles without permission errors.';
END $$;