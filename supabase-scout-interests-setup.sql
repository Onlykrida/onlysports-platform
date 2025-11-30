-- Scout Interests Tracking
-- This table tracks when scouts view, bookmark, or send requests to athletes

-- Create scout_interests table
CREATE TABLE IF NOT EXISTS scout_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'bookmark', 'request')),
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

-- Policy: Users can view their own interests (both as scout and as athlete)
CREATE POLICY "Users can view scout interests related to them"
  ON scout_interests FOR SELECT
  USING (
    auth.uid() = scout_id OR 
    auth.uid() = athlete_id
  );

-- Policy: Only scouts can create interests
CREATE POLICY "Scouts can track interests"
  ON scout_interests FOR INSERT
  WITH CHECK (
    auth.uid() = scout_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'scout'
    )
  );

-- Policy: Scouts can update their own interests
CREATE POLICY "Scouts can update their interests"
  ON scout_interests FOR UPDATE
  USING (auth.uid() = scout_id);

-- Policy: Scouts can delete their own interests
CREATE POLICY "Scouts can delete their interests"
  ON scout_interests FOR DELETE
  USING (auth.uid() = scout_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_scout_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scout_interests_updated_at
  BEFORE UPDATE ON scout_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_scout_interests_updated_at();

-- Function to get interested scouts for an athlete
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
) AS $$
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
    AND p.role = 'scout'
  GROUP BY p.id, p.name, p.avatar, p.role_specific_data
  ORDER BY last_interaction DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track scout interest
CREATE OR REPLACE FUNCTION track_scout_interest(
  p_scout_id UUID,
  p_athlete_id UUID,
  p_action_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO scout_interests (scout_id, athlete_id, action_type)
  VALUES (p_scout_id, p_athlete_id, p_action_type)
  ON CONFLICT (scout_id, athlete_id, action_type) 
  DO UPDATE SET updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_interested_scouts_for_athlete TO authenticated;
GRANT EXECUTE ON FUNCTION track_scout_interest TO authenticated;

COMMENT ON TABLE scout_interests IS 'Tracks scout interactions with athletes (views, bookmarks, requests)';
COMMENT ON FUNCTION get_interested_scouts_for_athlete IS 'Returns scouts who have shown interest in an athlete';
COMMENT ON FUNCTION track_scout_interest IS 'Records a scout interest action';
