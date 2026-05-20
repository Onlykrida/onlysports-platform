-- ============================================================================
-- OnlyKrida — Security Hotfix Migration (2026-04-29)
--
-- Apply this against the production Supabase project AFTER rotating the
-- service_role key (the leaked-history finding from the /cso audit).
--
-- This file captures the schema deltas only. The canonical schema
-- (supabase-canonical-schema.sql) and the team-dashboard migration
-- (supabase-team-dashboard.sql) have been updated to match — re-running
-- those files on a fresh project will produce the same final state.
--
-- Apply via the Supabase SQL editor or the supabase CLI:
--   supabase db execute --file supabase-security-fixes-2026-04-29.sql
--
-- This migration is idempotent: it can be re-run safely.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Finding #2 — Tighten profiles INSERT policy (CRITICAL)
--
-- Old: WITH CHECK (true)  — allowed any anon-key caller to fabricate profiles
-- New: WITH CHECK (auth.uid()::text = id::text)  — only the owner may insert
--
-- service_role and the handle_new_user() SECURITY DEFINER trigger both bypass
-- RLS regardless of policy, so the auth-trigger flow continues to work.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid()::text = id::text);


-- ----------------------------------------------------------------------------
-- Finding #7 — Cap profile_views engagement-metric fraud (MEDIUM)
--
-- One row per (profile, viewer, day) plus a tighter INSERT policy that
-- forbids self-views and forbids inserting on behalf of another viewer.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_views_unique_daily
    ON public.profile_views(profile_id, viewer_id, (created_at::date));

DROP POLICY IF EXISTS "Authenticated users can insert profile views" ON public.profile_views;

CREATE POLICY "Authenticated users can insert profile views"
    ON public.profile_views
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = viewer_id AND viewer_id != profile_id);

COMMIT;

-- ----------------------------------------------------------------------------
-- Verification queries — run these AFTER applying the migration to confirm
-- the policies are in place. Each should return exactly one row.
-- ----------------------------------------------------------------------------
-- SELECT polname, pg_get_expr(polqual, polrelid) AS using_expr,
--        pg_get_expr(polwithcheck, polrelid) AS check_expr
--   FROM pg_policy
--  WHERE polrelid = 'public.profiles'::regclass
--    AND polname  = 'Users can insert their own profile';
--
-- Expected check_expr: ((auth.uid())::text = (id)::text)
--
-- SELECT polname, pg_get_expr(polwithcheck, polrelid) AS check_expr
--   FROM pg_policy
--  WHERE polrelid = 'public.profile_views'::regclass
--    AND polname  = 'Authenticated users can insert profile views';
--
-- Expected check_expr: ((auth.uid() = viewer_id) AND (viewer_id <> profile_id))
--
-- SELECT indexname FROM pg_indexes
--  WHERE tablename = 'profile_views'
--    AND indexname = 'idx_profile_views_unique_daily';
