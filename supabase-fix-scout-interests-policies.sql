-- Fix Scout Interests Policies
-- This SQL resolves the duplicate policy error and ensures clean setup

-- Drop ALL existing policies for scout_interests table
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view scout interests related to them" ON scout_interests;
    DROP POLICY IF EXISTS "Scouts and coaches can track interests" ON scout_interests;
    DROP POLICY IF EXISTS "Scouts and coaches can update their interests" ON scout_interests;
    DROP POLICY IF EXISTS "Scouts and coaches can delete their interests" ON scout_interests;
    DROP POLICY IF EXISTS "Athletes can view interests about them" ON scout_interests;
    DROP POLICY IF EXISTS "Scouts can view their interests" ON scout_interests;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS scout_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'bookmark', 'request', 'interested')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one entry per scout-athlete-action combo
  UNIQUE(scout_id, athlete_id, action_type)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_scout_interests_athlete ON scout_interests(athlete_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scout_interests_scout ON scout_interests(scout_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scout_interests_created ON scout_interests(created_at DESC);

-- Enable RLS
ALTER TABLE scout_interests ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
-- Policy 1: Users can view their own interests (both as scout and as athlete)
CREATE POLICY "Users can view scout interests related to them"
  ON scout_interests FOR SELECT
  USING (
    auth.uid() = scout_id OR 
    auth.uid() = athlete_id
  );

-- Policy 2: Only scouts and coaches can create interests
CREATE POLICY "Scouts and coaches can track interests"
  ON scout_interests FOR INSERT
  WITH CHECK (
    auth.uid() = scout_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'scout' OR role = 'coach')
    )
  );

-- Policy 3: Scouts and coaches can update their own interests
CREATE POLICY "Scouts and coaches can update their interests"
  ON scout_interests FOR UPDATE
  USING (auth.uid() = scout_id);

-- Policy 4: Scouts and coaches can delete their own interests
CREATE POLICY "Scouts and coaches can delete their interests"
  ON scout_interests FOR DELETE
  USING (auth.uid() = scout_id);

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_scout_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scout_interests_updated_at ON scout_interests;
CREATE TRIGGER scout_interests_updated_at
  BEFORE UPDATE ON scout_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_scout_interests_updated_at();

-- Drop and recreate the function for getting interested scouts
DROP FUNCTION IF EXISTS get_interested_scouts_for_athlete(UUID, INTEGER);
CREATE OR REPLACE FUNCTION get_interested_scouts_for_athlete(
  p_athlete_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  scout_id UUID,
  scout_name TEXT,
  scout_avatar TEXT,
  scout_organization TEXT,
  last_interaction TIMESTAMPTZ,
  actions TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as scout_id,
    p.name as scout_name,
    p.avatar as scout_avatar,
    (p.role_specific_data->>'organization')::TEXT as scout_organization,
    MAX(si.created_at) as last_interaction,
    ARRAY_AGG(DISTINCT si.action_type ORDER BY si.action_type) as actions
  FROM scout_interests si
  JOIN profiles p ON p.id = si.scout_id
  WHERE si.athlete_id = p_athlete_id
    AND (p.role = 'scout' OR p.role = 'coach')
  GROUP BY p.id, p.name, p.avatar, p.role_specific_data
  ORDER BY last_interaction DESC
  LIMIT p_limit;
END;
$$;

-- Drop and recreate the function for tracking scout interest
DROP FUNCTION IF EXISTS track_scout_interest(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION track_scout_interest(
  p_scout_id UUID,
  p_athlete_id UUID,
  p_action_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO scout_interests (scout_id, athlete_id, action_type)
  VALUES (p_scout_id, p_athlete_id, p_action_type)
  ON CONFLICT (scout_id, athlete_id, action_type) 
  DO UPDATE SET updated_at = NOW();
END;
$$;

-- Ensure profile_views table exists
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate views within same session (can be adjusted)
  UNIQUE(profile_id, viewer_id, created_at::DATE)
);

-- Create indexes for profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(created_at DESC);

-- Enable RLS for profile_views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Drop existing profile_views policies
DROP POLICY IF EXISTS "Users can view who viewed their profile" ON profile_views;
DROP POLICY IF EXISTS "Authenticated users can record profile views" ON profile_views;

-- Create fresh profile_views policies
CREATE POLICY "Users can view who viewed their profile"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated users can record profile views"
  ON profile_views FOR INSERT
  WITH CHECK (
    auth.uid() = viewer_id AND
    viewer_id != profile_id
  );

-- Drop and recreate profile_views functions
DROP FUNCTION IF EXISTS get_profile_viewers(UUID, INTEGER);
CREATE OR REPLACE FUNCTION get_profile_viewers(
  p_profile_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  viewer_id UUID,
  viewer_name TEXT,
  viewer_avatar TEXT,
  viewer_role TEXT,
  last_viewed TIMESTAMPTZ,
  view_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as viewer_id,
    p.name as viewer_name,
    p.avatar as viewer_avatar,
    p.role as viewer_role,
    MAX(pv.created_at) as last_viewed,
    COUNT(*)::BIGINT as view_count
  FROM profile_views pv
  JOIN profiles p ON p.id = pv.viewer_id
  WHERE pv.profile_id = p_profile_id
  GROUP BY p.id, p.name, p.avatar, p.role
  ORDER BY last_viewed DESC
  LIMIT p_limit;
END;
$$;

DROP FUNCTION IF EXISTS track_profile_view(UUID, UUID);
CREATE OR REPLACE FUNCTION track_profile_view(
  p_profile_id UUID,
  p_viewer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only insert if viewer is not the profile owner
  IF p_viewer_id != p_profile_id THEN
    INSERT INTO profile_views (profile_id, viewer_id)
    VALUES (p_profile_id, p_viewer_id)
    ON CONFLICT (profile_id, viewer_id, (created_at::DATE)) 
    DO NOTHING;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS get_profile_views_count(UUID);
CREATE OR REPLACE FUNCTION get_profile_views_count(
  p_profile_id UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT viewer_id)
    FROM profile_views
    WHERE profile_id = p_profile_id
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_interested_scouts_for_athlete TO authenticated;
GRANT EXECUTE ON FUNCTION track_scout_interest TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_viewers TO authenticated;
GRANT EXECUTE ON FUNCTION track_profile_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_views_count TO authenticated;

-- Add comments
COMMENT ON TABLE scout_interests IS 'Tracks scout and coach interactions with athletes (views, bookmarks, requests, interested)';
COMMENT ON TABLE profile_views IS 'Tracks profile views from all users';
COMMENT ON FUNCTION get_interested_scouts_for_athlete IS 'Returns scouts and coaches who have shown interest in an athlete';
COMMENT ON FUNCTION track_scout_interest IS 'Records a scout interest action';
COMMENT ON FUNCTION get_profile_viewers IS 'Returns users who have viewed a profile';
COMMENT ON FUNCTION track_profile_view IS 'Records a profile view';
COMMENT ON FUNCTION get_profile_views_count IS 'Returns total unique viewer count for a profile';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Scout interests and profile views setup completed successfully!';
END $$;
