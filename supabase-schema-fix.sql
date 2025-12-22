-- OnlySports Schema Fix Script
-- This script fixes the current database schema issues
-- Run this in your Supabase SQL Editor

-- 1. Add the missing 'trainer' role to the role constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['athlete'::text, 'coach'::text, 'scout'::text, 'team'::text, 'fan'::text, 'trainer'::text]));

-- 2. Add the missing role_specific_data column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_specific_data jsonb DEFAULT '{}'::jsonb;

-- 3. Update the handle_new_user function to use the role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        new.id, 
        new.email, 
        COALESCE(new.raw_user_meta_data->>'name', 'New User'), 
        COALESCE(new.raw_user_meta_data->>'role', 'athlete')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

-- 4. Create missing scouting tables
CREATE TABLE IF NOT EXISTS public.player_stats (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    player_id uuid NOT NULL,
    sport text,
    position text,
    skill integer DEFAULT 50 CHECK (skill >= 0 AND skill <= 100),
    speed integer DEFAULT 50 CHECK (speed >= 0 AND speed <= 100),
    stamina integer DEFAULT 50 CHECK (stamina >= 0 AND stamina <= 100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT player_stats_pkey PRIMARY KEY (id),
    CONSTRAINT player_stats_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT player_stats_unique UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.scout_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    scout_id uuid NOT NULL,
    sport text,
    preferred_positions text[] DEFAULT '{}',
    weight_skill numeric DEFAULT 0.35 CHECK (weight_skill >= 0 AND weight_skill <= 1),
    weight_speed numeric DEFAULT 0.25 CHECK (weight_speed >= 0 AND weight_speed <= 1),
    weight_stamina numeric DEFAULT 0.2 CHECK (weight_stamina >= 0 AND weight_stamina <= 1),
    weight_position_match numeric DEFAULT 0.2 CHECK (weight_position_match >= 0 AND weight_position_match <= 1),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scout_preferences_pkey PRIMARY KEY (id),
    CONSTRAINT scout_preferences_scout_id_fkey FOREIGN KEY (scout_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT scout_preferences_unique UNIQUE (scout_id)
);

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    scout_id uuid NOT NULL,
    player_id uuid NOT NULL,
    fit_score integer DEFAULT 0 CHECK (fit_score >= 0 AND fit_score <= 100),
    breakdown jsonb DEFAULT '{}',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id),
    CONSTRAINT ai_recommendations_scout_id_fkey FOREIGN KEY (scout_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT ai_recommendations_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT ai_recommendations_unique UNIQUE (scout_id, player_id)
);

-- 5. Enable RLS on new tables
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for new tables
CREATE POLICY "Player stats are viewable by everyone" ON public.player_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own player stats" ON public.player_stats
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Scout preferences are viewable by everyone" ON public.scout_preferences
    FOR SELECT USING (true);

CREATE POLICY "Scouts can manage their own preferences" ON public.scout_preferences
    FOR ALL USING (auth.uid() = scout_id);

CREATE POLICY "AI recommendations are viewable by everyone" ON public.ai_recommendations
    FOR SELECT USING (true);

CREATE POLICY "Scouts can manage their own recommendations" ON public.ai_recommendations
    FOR ALL USING (auth.uid() = scout_id);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_specific_data ON public.profiles USING gin(role_specific_data);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON public.player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_sport ON public.player_stats(sport);
CREATE INDEX IF NOT EXISTS idx_scout_preferences_scout_id ON public.scout_preferences(scout_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_scout_id ON public.ai_recommendations(scout_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_player_id ON public.ai_recommendations(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_fit_score ON public.ai_recommendations(fit_score DESC);

-- Success message
SELECT 'Schema fix completed successfully! Added trainer role, role_specific_data column, scouting tables, and updated trigger.' as status;