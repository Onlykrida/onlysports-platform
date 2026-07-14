-- ============================================================================
-- OnlyKrida — Pre-launch audit security & integrity fixes
-- Generated 2026-07-13 by CTO audit. REVIEW BEFORE APPLYING.
--
-- HOW TO APPLY (do NOT run blindly against production):
--   1. supabase link --project-ref <prod-ref>
--   2. supabase db pull                 # baseline the REAL schema first
--   3. Reconcile this file against the baseline (some objects below may already
--      exist under slightly different definitions — the drift is the point).
--   4. supabase db push                 # apply in a transaction
--
-- NOTE ON INDEXES: this file uses plain CREATE INDEX (runs inside the migration
-- transaction). That takes a brief lock — fine pre-launch with little data. On a
-- populated production table, run the CREATE INDEX statements separately with
-- CONCURRENTLY, OUTSIDE a transaction.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- C1 (CRITICAL): profiles UPDATE let any user self-award `verified` and change
-- `role`. The policy had USING but no WITH CHECK and no column protection.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- service_role (seed scripts, admin edge functions) bypasses this guard.
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    RAISE EXCEPTION 'verified is not user-editable';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role is not user-editable';
  END IF;
  -- Counter columns are trigger-maintained; block direct client tampering (F6).
  IF NEW.followers_count IS DISTINCT FROM OLD.followers_count
     OR NEW.following_count IS DISTINCT FROM OLD.following_count
     OR NEW.posts_count IS DISTINCT FROM OLD.posts_count THEN
    RAISE EXCEPTION 'counter columns are not user-editable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile ON public.profiles;
CREATE TRIGGER trg_guard_profile
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_cols();
-- APP CHANGE REQUIRED: stop sending `role` in the updateProfile payload
-- (hooks/auth-context.tsx) or legitimate profile edits will now be rejected.

-- ----------------------------------------------------------------------------
-- C2 (CRITICAL): athletes could self-approve their fitness verification tier.
-- Restrict tier/verifier columns; upgrades happen only via approve_verification.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_fitness_verification_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.verification_tier IS DISTINCT FROM OLD.verification_tier
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    RAISE EXCEPTION 'verification columns can only be set by an approver';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_fitness_verification ON public.fitness_test_results;
CREATE TRIGGER trg_guard_fitness_verification
  BEFORE UPDATE ON public.fitness_test_results
  FOR EACH ROW EXECUTE FUNCTION public.guard_fitness_verification_cols();

-- On INSERT, athletes may only claim self_reported / app_measured tiers.
CREATE OR REPLACE FUNCTION public.guard_fitness_insert_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.verification_tier IS NOT NULL
     AND NEW.verification_tier NOT IN ('self_reported', 'app_measured') THEN
    RAISE EXCEPTION 'athletes may only self-report self_reported or app_measured tiers';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_fitness_insert_tier ON public.fitness_test_results;
CREATE TRIGGER trg_guard_fitness_insert_tier
  BEFORE INSERT ON public.fitness_test_results
  FOR EACH ROW EXECUTE FUNCTION public.guard_fitness_insert_tier();

-- Coach/center approval path (fixes D5: the coach tier-upgrade UPDATE currently
-- matches 0 rows because the only UPDATE policy is athlete-owned). Runs as owner
-- so it can set the protected columns AND insert the athlete notification (D4).
CREATE OR REPLACE FUNCTION public.approve_verification(
  p_test_result_id uuid,
  p_tier text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_athlete uuid;
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role NOT IN ('coach', 'team', 'academy') THEN
    RAISE EXCEPTION 'only coaches/academies may approve verification';
  END IF;
  IF p_tier NOT IN ('coach_verified', 'center_tested') THEN
    RAISE EXCEPTION 'invalid approval tier';
  END IF;

  UPDATE public.fitness_test_results
     SET verification_tier = p_tier,
         verified_by = auth.uid(),
         verified_at = now()
   WHERE id = p_test_result_id
  RETURNING athlete_id INTO v_athlete;

  IF v_athlete IS NULL THEN
    RAISE EXCEPTION 'test result not found';
  END IF;

  UPDATE public.verification_requests
     SET status = 'approved'
   WHERE test_result_id = p_test_result_id AND status = 'pending';

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (v_athlete, 'verification_approved', 'Verification approved',
          'Your fitness result was verified.', jsonb_build_object('test_result_id', p_test_result_id));
END;
$$;
REVOKE ALL ON FUNCTION public.approve_verification(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_verification(uuid, text) TO authenticated;
-- APP CHANGE REQUIRED: hooks/fitness-test-context.tsx approveVerification should
-- call supabase.rpc('approve_verification', {...}) instead of a direct UPDATE.

-- ----------------------------------------------------------------------------
-- C3 (CRITICAL): profiles SELECT USING(true) exposed email, date_of_birth,
-- push_token (and minors' DOB) to any anon-key holder. Restrict to a safe
-- column set via column-level grants. RLS still governs row visibility.
-- ----------------------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, role, avatar, cover_photo, bio, sport, position,
  achievements, stats, verified, followers_count, following_count,
  posts_count, state, city, created_at, role_specific_data
) ON public.profiles TO anon, authenticated;
-- email, date_of_birth, gender, push_token: intentionally NOT granted — read
-- them server-side (edge function / SECURITY DEFINER) where genuinely needed.
-- NOTE: `city`/`state` exposure for minor accounts should be reconsidered (H1/DPDP).

-- ----------------------------------------------------------------------------
-- F1 (CRITICAL): get_conversations was SECURITY DEFINER, took the target user
-- as a parameter, and was granted to anon — any caller could read anyone's DM
-- previews. Rewrite around auth.uid() and revoke from anon.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_conversations(uuid);
CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
  conversation_with uuid,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH me AS (SELECT auth.uid() AS uid)
  SELECT
    CASE WHEN m.sender_id = (SELECT uid FROM me) THEN m.receiver_id ELSE m.sender_id END AS conversation_with,
    (array_agg(m.content ORDER BY m.created_at DESC))[1] AS last_message,
    max(m.created_at) AS last_message_at,
    count(*) FILTER (
      WHERE m.receiver_id = (SELECT uid FROM me) AND m.status <> 'read'
    ) AS unread_count
  FROM public.messages m
  WHERE m.sender_id = (SELECT uid FROM me) OR m.receiver_id = (SELECT uid FROM me)
  GROUP BY 1;
$$;
REVOKE ALL ON FUNCTION public.get_conversations() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;

-- ----------------------------------------------------------------------------
-- F2 (HIGH): blanket GRANT ALL ON ALL TABLES/FUNCTIONS TO anon, authenticated
-- makes RLS the only line of defence and auto-exposes any future table before
-- its RLS is added. Prefer granular grants. This is intentionally left as a
-- MANUAL step — auto-revoking here can break the running app. Audit with:
--   SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE grantee IN ('anon','authenticated') ORDER BY table_name;
-- and replace with per-table grants matching each table's RLS intent.

-- ----------------------------------------------------------------------------
-- D1 (HIGH): scout_preferences.weight_endurance is written by the client
-- (app/scout-preferences.tsx) but exists in no schema file → every save 400s.
-- ----------------------------------------------------------------------------
ALTER TABLE public.scout_preferences ADD COLUMN IF NOT EXISTS weight_endurance numeric DEFAULT 0;

-- ----------------------------------------------------------------------------
-- Constraints (HIGH/MED): owner uniqueness, auth FK cascade, delete behavior.
-- Guarded so re-runs and pre-existing constraints don't error.
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scout_preferences_scout_id_key') THEN
    ALTER TABLE public.scout_preferences ADD CONSTRAINT scout_preferences_scout_id_key UNIQUE (scout_id);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_stats_player_id_key') THEN
    ALTER TABLE public.player_stats ADD CONSTRAINT player_stats_player_id_key UNIQUE (player_id);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- profiles.id should reference auth.users(id) so deleting an auth user cascades
-- (GDPR/DPDP erasure). Only add if it isn't already an FK.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND contype = 'f'
      AND conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped profiles_id_fkey (pre-existing rows may violate it): %', SQLERRM;
END $$;

-- Dedupe pending verification requests (anti-spam) + serves the lookup index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vr_pending_unique
  ON public.verification_requests (test_result_id, coach_id)
  WHERE status = 'pending';

-- Sanity CHECKs so fabricated results can't feed scout rankings.
DO $$ BEGIN
  ALTER TABLE public.fitness_test_results
    ADD CONSTRAINT chk_sprint_time_pos CHECK (sprint_time IS NULL OR sprint_time > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.fitness_test_results
    ADD CONSTRAINT chk_jump_height_pos CHECK (jump_height IS NULL OR jump_height >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- Missing indexes (see audit §2). Plain CREATE INDEX here; use CONCURRENTLY on
-- populated prod tables (outside a transaction).
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread_status
  ON public.messages (receiver_id, sender_id) WHERE status <> 'read';
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_scout_score
  ON public.ai_recommendations (scout_id, fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_player_score
  ON public.ai_recommendations (player_id, fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_verification_requests_test_result
  ON public.verification_requests (test_result_id);
CREATE INDEX IF NOT EXISTS idx_messages_post_id
  ON public.messages (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fitness_test_verified_by
  ON public.fitness_test_results (verified_by) WHERE verified_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_stats_sport_updated
  ON public.player_stats (sport, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_athlete_created
  ON public.applications (athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created
  ON public.posts (user_id, created_at DESC);

-- Drop duplicate indexes if both canonical + final-migrations ran.
DROP INDEX IF EXISTS idx_ai_recs_scout;
DROP INDEX IF EXISTS idx_ai_recs_player;
DROP INDEX IF EXISTS idx_ai_recs_score;
