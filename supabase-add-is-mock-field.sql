-- Add is_mock field to tables for easy mock data identification and cleanup

-- Add is_mock column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_is_mock ON profiles(is_mock);

-- Add is_mock column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_is_mock ON posts(is_mock);

-- Add is_mock column to opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_opportunities_is_mock ON opportunities(is_mock);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_mock IS 'Flag to identify mock/test data for easy cleanup';
COMMENT ON COLUMN posts.is_mock IS 'Flag to identify mock/test data for easy cleanup';
COMMENT ON COLUMN opportunities.is_mock IS 'Flag to identify mock/test data for easy cleanup';
