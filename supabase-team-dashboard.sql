-- ============================================================
-- Profile Views table for team dashboard analytics
-- ============================================================

-- Create the profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups by profile owner
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);

-- Index for time-range queries (e.g. views in the last 30 days)
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(profile_id, created_at DESC);

-- Prevent duplicate views from the same viewer within a short window (optional unique constraint)
-- Uncomment the line below if you want to deduplicate per viewer per day:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_views_unique_daily ON profile_views(profile_id, viewer_id, (created_at::date));

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can record a profile view
CREATE POLICY "Authenticated users can insert profile views"
  ON profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Profile owners can read their own view records
CREATE POLICY "Profile owners can read their own views"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());
