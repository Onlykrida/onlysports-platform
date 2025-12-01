-- Profile Views Tracking
-- This table tracks when users view profiles

-- Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate views within same session (can be adjusted)
  UNIQUE(profile_id, viewer_id, created_at::DATE)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(created_at DESC);

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view who viewed their profile" ON profile_views;
DROP POLICY IF EXISTS "Authenticated users can record profile views" ON profile_views;

-- Policy: Users can see who viewed their profile
CREATE POLICY "Users can view who viewed their profile"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy: Authenticated users can record views
CREATE POLICY "Authenticated users can record profile views"
  ON profile_views FOR INSERT
  WITH CHECK (
    auth.uid() = viewer_id AND
    viewer_id != profile_id
  );

-- Function to get profile viewers
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track profile view
CREATE OR REPLACE FUNCTION track_profile_view(
  p_profile_id UUID,
  p_viewer_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Only insert if viewer is not the profile owner
  IF p_viewer_id != p_profile_id THEN
    INSERT INTO profile_views (profile_id, viewer_id)
    VALUES (p_profile_id, p_viewer_id)
    ON CONFLICT (profile_id, viewer_id, (created_at::DATE)) 
    DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get profile views count
CREATE OR REPLACE FUNCTION get_profile_views_count(
  p_profile_id UUID
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT viewer_id)
    FROM profile_views
    WHERE profile_id = p_profile_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_profile_viewers TO authenticated;
GRANT EXECUTE ON FUNCTION track_profile_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_views_count TO authenticated;

COMMENT ON TABLE profile_views IS 'Tracks profile views from all users';
COMMENT ON FUNCTION get_profile_viewers IS 'Returns users who have viewed a profile';
COMMENT ON FUNCTION track_profile_view IS 'Records a profile view';
COMMENT ON FUNCTION get_profile_views_count IS 'Returns total unique viewer count for a profile';
