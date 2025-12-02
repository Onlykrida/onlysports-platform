-- Fix Profile Views and Scout Interests Functions
-- This script fixes the missing functions and duplicate policies

-- =============================================
-- 1. Fix Profile Views Functions
-- =============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_profile_viewers(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_profile_views_count(UUID);
DROP FUNCTION IF EXISTS track_profile_view(UUID, UUID);

-- Create get_profile_viewers function
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
SET search_path = public
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

-- Create get_profile_views_count function
CREATE OR REPLACE FUNCTION get_profile_views_count(
  p_profile_id UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT viewer_id)
    FROM profile_views
    WHERE profile_id = p_profile_id
  );
END;
$$;

-- Create track_profile_view function
CREATE OR REPLACE FUNCTION track_profile_view(
  p_profile_id UUID,
  p_viewer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_profile_viewers(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_views_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_profile_view(UUID, UUID) TO authenticated;

-- =============================================
-- 2. Fix Scout Interests Policies (Remove Duplicates)
-- =============================================

-- Drop all existing policies for scout_interests
DROP POLICY IF EXISTS "Users can view scout interests related to them" ON scout_interests;
DROP POLICY IF EXISTS "Scouts and coaches can track interests" ON scout_interests;
DROP POLICY IF EXISTS "Scouts and coaches can update their interests" ON scout_interests;
DROP POLICY IF EXISTS "Scouts and coaches can delete their interests" ON scout_interests;

-- Recreate policies (clean slate)
CREATE POLICY "Users can view scout interests related to them"
  ON scout_interests FOR SELECT
  USING (
    auth.uid() = scout_id OR 
    auth.uid() = athlete_id
  );

CREATE POLICY "Scouts and coaches can track interests"
  ON scout_interests FOR INSERT
  WITH CHECK (
    auth.uid() = scout_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'scout' OR role = 'coach')
    )
  );

CREATE POLICY "Scouts and coaches can update their interests"
  ON scout_interests FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts and coaches can delete their interests"
  ON scout_interests FOR DELETE
  USING (auth.uid() = scout_id);

-- =============================================
-- 3. Update Scout Interests Function
-- =============================================

-- Drop and recreate the function with proper search_path
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as scout_id,
    p.name as scout_name,
    p.avatar as scout_avatar,
    p.role_specific_data->>'organization' as scout_organization,
    MAX(si.created_at) as last_interaction,
    ARRAY_AGG(DISTINCT si.action_type ORDER BY si.action_type) as actions
  FROM scout_interests si
  JOIN profiles p ON p.id = si.scout_id
  WHERE si.athlete_id = p_athlete_id
    AND (p.role = 'scout' OR p.role = 'coach')
    AND si.action_type = 'interested'  -- Only show explicit interests
  GROUP BY p.id, p.name, p.avatar, p.role_specific_data
  ORDER BY last_interaction DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_interested_scouts_for_athlete(UUID, INTEGER) TO authenticated;

-- =============================================
-- 4. Update Track Scout Interest Function
-- =============================================

DROP FUNCTION IF EXISTS track_scout_interest(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION track_scout_interest(
  p_scout_id UUID,
  p_athlete_id UUID,
  p_action_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO scout_interests (scout_id, athlete_id, action_type)
  VALUES (p_scout_id, p_athlete_id, p_action_type)
  ON CONFLICT (scout_id, athlete_id, action_type) 
  DO UPDATE SET updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION track_scout_interest(UUID, UUID, TEXT) TO authenticated;

-- =============================================
-- 5. Create Helper Functions for Scout Context
-- =============================================

-- Function to check if scout is interested in an athlete
CREATE OR REPLACE FUNCTION is_scout_interested(
  p_scout_id UUID,
  p_athlete_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM scout_interests
    WHERE scout_id = p_scout_id
      AND athlete_id = p_athlete_id
      AND action_type = 'interested'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_scout_interested(UUID, UUID) TO authenticated;

-- Function to remove scout interest
CREATE OR REPLACE FUNCTION remove_scout_interest(
  p_scout_id UUID,
  p_athlete_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM scout_interests
  WHERE scout_id = p_scout_id
    AND athlete_id = p_athlete_id
    AND action_type = 'interested';
END;
$$;

GRANT EXECUTE ON FUNCTION remove_scout_interest(UUID, UUID) TO authenticated;

-- =============================================
-- Comments
-- =============================================

COMMENT ON FUNCTION get_profile_viewers IS 'Returns users who have viewed a profile with view counts';
COMMENT ON FUNCTION get_profile_views_count IS 'Returns total unique viewer count for a profile';
COMMENT ON FUNCTION track_profile_view IS 'Records a profile view automatically';
COMMENT ON FUNCTION get_interested_scouts_for_athlete IS 'Returns scouts/coaches who explicitly marked interest in an athlete';
COMMENT ON FUNCTION track_scout_interest IS 'Records explicit scout interest (interested button click)';
COMMENT ON FUNCTION is_scout_interested IS 'Checks if scout has marked athlete as interested';
COMMENT ON FUNCTION remove_scout_interest IS 'Removes scout interest from athlete';
