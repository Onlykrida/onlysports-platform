-- ============================================================================
-- OnlyKrida — verification_mode column on fitness_test_results
--
-- Generated: 2026-04-27
-- Idempotent (ADD COLUMN IF NOT EXISTS)
--
-- Apply via: Supabase Dashboard → SQL Editor at
-- https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- WHY THIS EXISTS
-- ----------------------------------------------------------------------------
-- The current `verification_tier` field tells you WHO verified (self / app /
-- coach / center) but not HOW. A coach who watched a video and a coach who
-- was physically present are very different trust signals — both reach the
-- coach_verified tier, but the in-person path is the stronger evidence.
--
-- This adds `verification_mode` so the UI can:
--   - Show "Coach-Verified · in-person" vs "Coach-Verified · video review"
--   - Let the verifier choose the mode at approval time (verify-result.tsx)
--   - Eventually weight in-person above remote in scout-confidence calc
--
-- The `verification_requests.coach_id` field keeps its name but now also
-- holds scout user_ids — scouts are also valid verifiers per athlete request.
-- No schema change needed for that; the role is determined by the verifier's
-- profile, not the column name.
-- ============================================================================

-- 1. Add the verification_mode column
ALTER TABLE public.fitness_test_results
  ADD COLUMN IF NOT EXISTS verification_mode text
  CHECK (verification_mode IN ('remote_video', 'in_person', 'sensor_only'));

-- Comment for future readers
COMMENT ON COLUMN public.fitness_test_results.verification_mode IS
  'How verification was performed: remote_video = verifier watched uploaded video, '
  'in_person = verifier was physically present at the test, '
  'sensor_only = app-measured via on-device sensors. NULL until verified.';

-- 2. Index for filtering verified results by mode (analytics, scout queries)
CREATE INDEX IF NOT EXISTS idx_fitness_test_verification_mode
  ON public.fitness_test_results(verification_mode)
  WHERE verification_mode IS NOT NULL;

-- 3. Backfill: existing coach_verified rows likely came from in-person tests
--    (the old verify flow asked "Did you witness this athlete perform this test?"
--    which strongly implied in-person). Set their mode accordingly.
--    Only touches rows where verification_mode is currently NULL.
UPDATE public.fitness_test_results
SET verification_mode = 'in_person'
WHERE verification_tier = 'coach_verified'
  AND verification_mode IS NULL;

-- App-measured rows get sensor_only as their mode
UPDATE public.fitness_test_results
SET verification_mode = 'sensor_only'
WHERE verification_tier = 'app_measured'
  AND verification_mode IS NULL
  AND sensor_data IS NOT NULL;
