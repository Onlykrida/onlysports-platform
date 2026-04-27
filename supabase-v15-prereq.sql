-- ============================================================================
-- OnlyKrida — v1.5 fitness battery prereq migration
--
-- Generated: 2026-04-27
-- Idempotent (DROP CONSTRAINT IF EXISTS, CREATE TABLE IF NOT EXISTS)
--
-- Apply via: Supabase Dashboard → SQL Editor at
-- https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- WHY THIS EXISTS
-- ----------------------------------------------------------------------------
-- Two P0 issues from /code-reviewer (2026-04-26) block any v1.5 save:
--
-- 1. fitness_test_results.test_type has a CHECK constraint hard-coded to 5
--    values (yoyo, sprint_20m, sprint_40m, agility_ttest, vertical_jump).
--    Every v1.5 test save (sprint_10m, gps_time_trial, juggling_count,
--    spot_shooting_pct, etc.) will reject with PG 23514 check_violation.
--
-- 2. scout_shortlist table is referenced by hooks/scouting-context.tsx
--    (lines 651, 696, 737) but doesn't exist in any SQL file in the repo.
--    Currently silently no-ops via the isTableMissing helper.
--
-- This migration fixes both. Apply BEFORE any v1.5 screen code lands.
-- ============================================================================

-- ---------- 1. Expand fitness_test_results.test_type for v1.5 wedge ----------

-- The v1.5 superset (10 new values + 5 existing = 15 total):
--   Existing: yoyo, sprint_20m, sprint_40m, agility_ttest, vertical_jump
--   NEW:      sprint_10m, sprint_30m       (sprint splits per design D2)
--             gps_time_trial               (cricket 2km, athletics Cooper, badminton AIR-BT pace)
--             juggling_count               (football)
--             wall_volley_count            (badminton)
--             dribble_cones_count          (basketball)
--             spot_shooting_pct            (basketball)
--             drag_flick_accuracy          (hockey)
--             crossing_accuracy            (football)
--             bowling_accuracy             (cricket — line + length zones)
--
-- v1.6 will add: standing_long_jump, agility_505, agility_5_10_5, bowling_speed,
-- pitch_reaction_test, toe_touch_precision, single_leg_balance, raid_loop_30s,
-- shadow_footwork. Those land in their own migration when v1.6 ships.

DO $$
BEGIN
  ALTER TABLE public.fitness_test_results
    DROP CONSTRAINT IF EXISTS fitness_test_results_test_type_check;
  ALTER TABLE public.fitness_test_results
    ADD CONSTRAINT fitness_test_results_test_type_check
    CHECK (test_type IN (
      -- existing (v1.0)
      'yoyo',
      'sprint_20m',
      'sprint_40m',
      'agility_ttest',
      'vertical_jump',
      -- v1.5 wedge
      'sprint_10m',
      'sprint_30m',
      'gps_time_trial',
      'juggling_count',
      'wall_volley_count',
      'dribble_cones_count',
      'spot_shooting_pct',
      'drag_flick_accuracy',
      'crossing_accuracy',
      'bowling_accuracy'
    ));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'fitness_test_results_test_type_check: %', SQLERRM;
END $$;

-- ---------- 2. scout_shortlist table (was missing from all SQL files) ----------

-- Code reference: hooks/scouting-context.tsx:651,696,737
-- Columns derived from upsert payload + select projections in that file.

CREATE TABLE IF NOT EXISTS public.scout_shortlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scout_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_scout_shortlist_scout
  ON public.scout_shortlist(scout_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scout_shortlist_athlete
  ON public.scout_shortlist(athlete_id);

ALTER TABLE public.scout_shortlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scout_shortlist_self_read   ON public.scout_shortlist;
DROP POLICY IF EXISTS scout_shortlist_self_write  ON public.scout_shortlist;
DROP POLICY IF EXISTS scout_shortlist_self_update ON public.scout_shortlist;
DROP POLICY IF EXISTS scout_shortlist_self_delete ON public.scout_shortlist;

-- Scouts read + manage their own shortlist
CREATE POLICY scout_shortlist_self_read ON public.scout_shortlist
  FOR SELECT TO authenticated
  USING (auth.uid() = scout_id);

CREATE POLICY scout_shortlist_self_write ON public.scout_shortlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY scout_shortlist_self_update ON public.scout_shortlist
  FOR UPDATE TO authenticated
  USING (auth.uid() = scout_id)
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY scout_shortlist_self_delete ON public.scout_shortlist
  FOR DELETE TO authenticated
  USING (auth.uid() = scout_id);

-- Auto-update updated_at timestamp on UPDATE (mirrors pattern from canonical schema)
CREATE OR REPLACE FUNCTION public.scout_shortlist_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scout_shortlist_updated_at_trg ON public.scout_shortlist;
CREATE TRIGGER scout_shortlist_updated_at_trg
  BEFORE UPDATE ON public.scout_shortlist
  FOR EACH ROW
  EXECUTE FUNCTION public.scout_shortlist_set_updated_at();
