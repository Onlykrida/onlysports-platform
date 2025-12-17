-- OnlySports Enhanced Profile System
-- Complete schema with role-specific fields for all user types
-- Version 2.0 - Enhanced Profile System

-- First, drop existing tables and policies if they exist
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Ensure we have access to auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_profile_completion(UUID) CASCADE;

-- Create enhanced profiles table with comprehensive role-specific fields
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'scout', 'team', 'fan', 'trainer')),
  
  -- Common profile fields
  avatar TEXT,
  bio TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  location_geo POINT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Core sport fields (common across multiple roles)
  sport TEXT,
  position TEXT,
  
  -- Profile metadata
  profile_completion_score INTEGER DEFAULT 0,
  public_visibility TEXT DEFAULT 'public' CHECK (public_visibility IN ('public', 'scouts-only', 'private')),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Generic fields
  achievements JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  
  -- ATHLETE specific fields
  athlete_data JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   dob: "YYYY-MM-DD",
  --   gender: "male" | "female" | "other",
  --   height_cm: number,
  --   weight_kg: number,
  --   current_team: string,
  --   preferred_foot: "left" | "right" | "both",
  --   dominant_hand: "left" | "right" | "both",
  --   dominant_style: ["aggressive", "technical", etc],
  --   highlight_videos: [{url, title, thumbnail}],
  --   injury_history: [{injury, date, recovery_time}],
  --   training_frequency: "daily" | "weekly" | "occasional",
  --   aspirations: string,
  --   consent_contact_scouts: boolean,
  --   career_history: [{team, position, start_date, end_date, achievements}]
  -- }
  
  -- COACH specific fields
  coach_data JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   sports_coached: [string],
  --   years_experience: number,
  --   certifications: [{name, organization, date, file_url}],
  --   availability: string,
  --   training_programs: [{name, description, duration, level}],
  --   testimonials: [{name, text, date}],
  --   coaching_philosophy: string,
  --   team_history: [string]
  -- }
  
  -- SCOUT specific fields
  scout_data JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   organization: string (required),
  --   regions: [string],
  --   sports_interested: [string],
  --   age_groups_recruiting: [string],
  --   position_preferences: [string],
  --   saved_filters: {},
  --   preferred_contact_method: string,
  --   scouting_regions: [string],
  --   athlete_levels: [string],
  --   looking_for: string
  -- }
  
  -- TRAINER / PHYSIO specific fields
  trainer_data JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   certifications: [{name, organization, date, file_url}],
  --   specialties: [string],
  --   services_offered: [string],
  --   pricing_packages: [{name, description, price, duration}],
  --   availability_calendar: {},
  --   facility_photos: [string]
  -- }
  
  -- TEAM / CLUB specific fields
  team_data JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   organization_name: string,
  --   organization_type: string,
  --   league: string,
  --   founded: string,
  --   home_venue: string,
  --   roster_info: {},
  --   trials_opportunities: [{title, date, location}],
  --   facilities_photos: [string],
  --   admin_contacts: [{name, role, email, phone}]
  -- }
  
  -- FAN specific fields
  fan_data JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   favorite_sports: [string],
  --   favorite_teams: [string],
  --   favorite_athletes: [string],
  --   notification_preferences: {}
  -- }
  
  -- Legacy role-specific data (for backwards compatibility)
  role_specific_data JSONB DEFAULT '{}'::jsonb,
  resume_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on user_id" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

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

-- Enable RLS for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts
CREATE POLICY "Enable read access for all users" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on user_id" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON posts
  FOR DELETE USING (auth.uid() = user_id);

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

-- Enable RLS for opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for opportunities
CREATE POLICY "Enable read access for all users" ON opportunities
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users based on team_id" ON opportunities
  FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Enable update for users based on team_id" ON opportunities
  FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Enable delete for users based on team_id" ON opportunities
  FOR DELETE USING (auth.uid() = team_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at 
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate profile completion score
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  profile RECORD;
  score INTEGER := 0;
  role_data JSONB;
BEGIN
  SELECT * INTO profile FROM profiles WHERE id = profile_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Basic fields (30 points total)
  IF profile.name IS NOT NULL AND profile.name != '' THEN score := score + 5; END IF;
  IF profile.bio IS NOT NULL AND profile.bio != '' THEN score := score + 5; END IF;
  IF profile.avatar IS NOT NULL AND profile.avatar != '' THEN score := score + 5; END IF;
  IF profile.location_city IS NOT NULL THEN score := score + 5; END IF;
  IF profile.location_country IS NOT NULL THEN score := score + 5; END IF;
  IF profile.sport IS NOT NULL AND profile.sport != '' THEN score := score + 5; END IF;
  
  -- Role-specific scoring (70 points total)
  CASE profile.role
    WHEN 'athlete' THEN
      role_data := profile.athlete_data;
      IF role_data ? 'dob' AND role_data->>'dob' != '' THEN score := score + 10; END IF;
      IF role_data ? 'height_cm' AND (role_data->>'height_cm')::numeric > 0 THEN score := score + 5; END IF;
      IF role_data ? 'weight_kg' AND (role_data->>'weight_kg')::numeric > 0 THEN score := score + 5; END IF;
      IF profile.position IS NOT NULL AND profile.position != '' THEN score := score + 10; END IF;
      IF role_data ? 'current_team' AND role_data->>'current_team' != '' THEN score := score + 5; END IF;
      IF jsonb_array_length(COALESCE(profile.achievements, '[]'::jsonb)) > 0 THEN score := score + 10; END IF;
      IF role_data ? 'highlight_videos' AND jsonb_array_length(role_data->'highlight_videos') > 0 THEN score := score + 15; END IF;
      IF role_data ? 'aspirations' AND role_data->>'aspirations' != '' THEN score := score + 10; END IF;
    
    WHEN 'coach' THEN
      role_data := profile.coach_data;
      IF role_data ? 'years_experience' AND (role_data->>'years_experience')::numeric > 0 THEN score := score + 15; END IF;
      IF role_data ? 'coaching_philosophy' AND role_data->>'coaching_philosophy' != '' THEN score := score + 15; END IF;
      IF role_data ? 'certifications' AND jsonb_array_length(role_data->'certifications') > 0 THEN score := score + 20; END IF;
      IF role_data ? 'training_programs' AND jsonb_array_length(role_data->'training_programs') > 0 THEN score := score + 10; END IF;
      IF role_data ? 'team_history' AND jsonb_array_length(role_data->'team_history') > 0 THEN score := score + 10; END IF;
    
    WHEN 'scout' THEN
      role_data := profile.scout_data;
      IF role_data ? 'organization' AND role_data->>'organization' != '' THEN score := score + 20; END IF;
      IF role_data ? 'regions' AND jsonb_array_length(role_data->'regions') > 0 THEN score := score + 15; END IF;
      IF role_data ? 'sports_interested' AND jsonb_array_length(role_data->'sports_interested') > 0 THEN score := score + 15; END IF;
      IF role_data ? 'age_groups_recruiting' AND jsonb_array_length(role_data->'age_groups_recruiting') > 0 THEN score := score + 10; END IF;
      IF role_data ? 'looking_for' AND role_data->>'looking_for' != '' THEN score := score + 10; END IF;
    
    WHEN 'trainer' THEN
      role_data := profile.trainer_data;
      IF role_data ? 'certifications' AND jsonb_array_length(role_data->'certifications') > 0 THEN score := score + 25; END IF;
      IF role_data ? 'specialties' AND jsonb_array_length(role_data->'specialties') > 0 THEN score := score + 15; END IF;
      IF role_data ? 'services_offered' AND jsonb_array_length(role_data->'services_offered') > 0 THEN score := score + 15; END IF;
      IF role_data ? 'pricing_packages' AND jsonb_array_length(role_data->'pricing_packages') > 0 THEN score := score + 15; END IF;
    
    WHEN 'team' THEN
      role_data := profile.team_data;
      IF role_data ? 'organization_name' AND role_data->>'organization_name' != '' THEN score := score + 20; END IF;
      IF role_data ? 'organization_type' AND role_data->>'organization_type' != '' THEN score := score + 10; END IF;
      IF role_data ? 'league' AND role_data->>'league' != '' THEN score := score + 10; END IF;
      IF role_data ? 'founded' AND role_data->>'founded' != '' THEN score := score + 5; END IF;
      IF role_data ? 'home_venue' AND role_data->>'home_venue' != '' THEN score := score + 10; END IF;
      IF role_data ? 'admin_contacts' AND jsonb_array_length(role_data->'admin_contacts') > 0 THEN score := score + 15; END IF;
    
    WHEN 'fan' THEN
      role_data := profile.fan_data;
      IF role_data ? 'favorite_sports' AND jsonb_array_length(role_data->'favorite_sports') > 0 THEN score := score + 25; END IF;
      IF role_data ? 'favorite_teams' AND jsonb_array_length(role_data->'favorite_teams') > 0 THEN score := score + 25; END IF;
      IF role_data ? 'favorite_athletes' AND jsonb_array_length(role_data->'favorite_athletes') > 0 THEN score := score + 20; END IF;
    
    ELSE
      score := score + 0;
  END CASE;
  
  -- Cap at 100
  IF score > 100 THEN
    score := 100;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_sport_idx ON profiles(sport);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_location_country_idx ON profiles(location_country);
CREATE INDEX profiles_location_city_idx ON profiles(location_city);
CREATE INDEX profiles_verified_idx ON profiles(verified);
CREATE INDEX profiles_public_visibility_idx ON profiles(public_visibility);
CREATE INDEX profiles_last_active_idx ON profiles(last_active_at DESC);
CREATE INDEX profiles_completion_idx ON profiles(profile_completion_score DESC);

CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_type_idx ON posts(type);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);

CREATE INDEX opportunities_sport_idx ON opportunities(sport);
CREATE INDEX opportunities_type_idx ON opportunities(type);
CREATE INDEX opportunities_deadline_idx ON opportunities(deadline);
CREATE INDEX opportunities_team_id_idx ON opportunities(team_id);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_profile_completion(UUID) TO authenticated;

-- Grant permissions to anon users for reading public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON posts TO anon;
GRANT SELECT ON opportunities TO anon;
GRANT EXECUTE ON FUNCTION calculate_profile_completion(UUID) TO anon;

-- Add foreign key constraint to auth.users (after table creation)
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ OnlySports Enhanced Profile System setup completed!';
  RAISE NOTICE '📋 Tables created with comprehensive role-specific fields';
  RAISE NOTICE '🔒 RLS policies enabled for security';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '📊 Profile completion scoring system implemented';
  RAISE NOTICE '🎯 Ready to use with enhanced profile features!';
END $$;
