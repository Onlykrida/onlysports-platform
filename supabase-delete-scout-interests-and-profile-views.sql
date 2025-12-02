-- ========================================
-- CLEANUP SCRIPT: Remove Scout Interests and Profile Views Feature
-- ========================================
-- This script removes all tables, functions, triggers, and policies
-- related to the scout interests and profile views feature

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS scout_interests_updated_at ON scout_interests;

-- Drop tables (will also drop all associated policies automatically)
DROP TABLE IF EXISTS scout_interests CASCADE;
DROP TABLE IF EXISTS profile_views CASCADE;

-- Now drop functions (no longer have dependencies)
DROP FUNCTION IF EXISTS get_interested_scouts_for_athlete(UUID, INTEGER);
DROP FUNCTION IF EXISTS track_scout_interest(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS update_scout_interests_updated_at();
DROP FUNCTION IF EXISTS get_profile_viewers(UUID, INTEGER);
DROP FUNCTION IF EXISTS track_profile_view(UUID, UUID);
DROP FUNCTION IF EXISTS get_profile_views_count(UUID);

-- Confirm cleanup
DO $$ 
BEGIN
    RAISE NOTICE 'Scout interests and profile views feature has been successfully removed';
    RAISE NOTICE 'Dropped tables: scout_interests, profile_views';
    RAISE NOTICE 'Dropped functions: get_interested_scouts_for_athlete, track_scout_interest, get_profile_viewers, track_profile_view, get_profile_views_count';
END $$;
