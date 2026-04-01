-- ============================================
-- FITNESS TEST RESULTS — Unified table for all test types
-- Replaces old beep_test_results table
-- ============================================

-- Drop old beep test table if exists
DROP TABLE IF EXISTS public.beep_test_results;

-- Create unified fitness test results table
CREATE TABLE public.fitness_test_results (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conducted_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
    test_type       text NOT NULL CHECK (test_type IN ('yoyo', 'sprint_20m', 'sprint_40m', 'agility_ttest', 'vertical_jump')),
    test_mode       text NOT NULL DEFAULT 'self' CHECK (test_mode IN ('self', 'coached', 'manual')),

    -- Yo-Yo IR1 specific
    level           integer CHECK (level >= 5 AND level <= 23),
    shuttle         integer CHECK (shuttle >= 1),
    vo2max          numeric,
    total_distance  numeric,
    total_shuttles  integer,
    peak_speed      numeric,

    -- Sprint specific
    sprint_time     numeric,   -- seconds
    sprint_distance integer,   -- 20 or 40 meters

    -- Agility T-Test specific
    agility_time    numeric,   -- seconds

    -- Vertical Jump specific
    jump_height     numeric,   -- centimeters

    -- Common
    zone            text NOT NULL CHECK (zone IN ('starter','building','rising','strong','elite','unstoppable')),
    test_date       timestamptz DEFAULT now(),
    notes           text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_fitness_test_athlete ON public.fitness_test_results(athlete_id);
CREATE INDEX idx_fitness_test_type ON public.fitness_test_results(test_type);
CREATE INDEX idx_fitness_test_date ON public.fitness_test_results(test_date DESC);
CREATE INDEX idx_fitness_test_athlete_type ON public.fitness_test_results(athlete_id, test_type, test_date DESC);
CREATE INDEX idx_fitness_test_conducted_by ON public.fitness_test_results(conducted_by);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.fitness_test_results ENABLE ROW LEVEL SECURITY;

-- Anyone can read (scouts need to see athlete fitness data)
CREATE POLICY "fitness_test_results_select" ON public.fitness_test_results
    FOR SELECT USING (true);

-- Athletes can insert their own results, coaches can insert for athletes they conduct
CREATE POLICY "fitness_test_results_insert_own" ON public.fitness_test_results
    FOR INSERT WITH CHECK (auth.uid() = athlete_id OR auth.uid() = conducted_by);

-- Athletes can update their own results
CREATE POLICY "fitness_test_results_update_own" ON public.fitness_test_results
    FOR UPDATE USING (auth.uid() = athlete_id);

-- Athletes can delete their own results
CREATE POLICY "fitness_test_results_delete_own" ON public.fitness_test_results
    FOR DELETE USING (auth.uid() = athlete_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fitness_test_results;

-- ============================================
-- PROFILE AUGMENTATION — Location + Demographics
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Location indexes for scouting queries
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_state_sport ON public.profiles(state, sport);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- ============================================
-- SCOUT PREFERENCES — Location preferences
-- ============================================
ALTER TABLE public.scout_preferences ADD COLUMN IF NOT EXISTS preferred_states text[] DEFAULT '{}';

-- ============================================
-- VERIFICATION SYSTEM MIGRATION (2026-04-01)
-- ============================================

-- 1. Add verification columns to fitness_test_results
ALTER TABLE public.fitness_test_results
  ADD COLUMN IF NOT EXISTS verification_tier text NOT NULL DEFAULT 'self_reported'
    CHECK (verification_tier IN ('self_reported', 'app_measured', 'coach_verified', 'center_tested')),
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS sensor_data jsonb,
  ADD COLUMN IF NOT EXISTS attestation_count integer DEFAULT 0;

-- 2. Index for verification tier filtering
CREATE INDEX IF NOT EXISTS idx_fitness_test_verification
  ON public.fitness_test_results(verification_tier);

-- 3. Peer attestation table
CREATE TABLE IF NOT EXISTS public.test_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id uuid NOT NULL REFERENCES public.fitness_test_results(id) ON DELETE CASCADE,
  attester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship text CHECK (relationship IN ('teammate', 'training_partner', 'coach_staff', 'spectator')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_result_id, attester_id)
);

ALTER TABLE public.test_attestations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attestations_read" ON public.test_attestations FOR SELECT USING (true);
CREATE POLICY "attestations_insert" ON public.test_attestations FOR INSERT WITH CHECK (auth.uid() = attester_id);
CREATE POLICY "attestations_delete" ON public.test_attestations FOR DELETE USING (auth.uid() = attester_id);

-- 4. Coach verification requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id uuid NOT NULL REFERENCES public.fitness_test_results(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id),
  coach_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  coach_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vr_read" ON public.verification_requests FOR SELECT
  USING (auth.uid() = athlete_id OR auth.uid() = coach_id);
CREATE POLICY "vr_insert" ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "vr_update" ON public.verification_requests FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE INDEX IF NOT EXISTS idx_vr_coach ON public.verification_requests(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_vr_athlete ON public.verification_requests(athlete_id);
