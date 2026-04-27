-- ============================================================================
-- OnlyKrida — claude_usage table for edge function rate-limiting + cost tracking
--
-- Generated: 2026-04-27
-- Idempotent (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS)
--
-- Apply via: Supabase Dashboard → SQL Editor at
-- https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- WHY THIS EXISTS
-- ----------------------------------------------------------------------------
-- The claude-proxy edge function (supabase/functions/claude-proxy/index.ts)
-- enforces a per-user rate limit (30 req/hour) by counting rows in this table
-- with `called_at >= now() - interval '1 hour'`. It also logs token usage so
-- we can:
--   - Monitor aggregate Claude API spend
--   - Spot abuse (one user hitting the limit consistently)
--   - Make data-driven model selection (Opus → Sonnet saves ~5×)
--
-- Apply BEFORE deploying the edge function. The function fails open if the
-- table is missing (so existing AI features keep working), but rate limiting
-- and usage tracking won't kick in until the table exists.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.claude_usage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model         text NOT NULL,
  input_tokens  integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  called_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claude_usage_user_called_at
  ON public.claude_usage(user_id, called_at DESC);

ALTER TABLE public.claude_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage rows (for in-app cost dashboards if added later)
DROP POLICY IF EXISTS claude_usage_self_read ON public.claude_usage;
CREATE POLICY claude_usage_self_read ON public.claude_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT path is service-role-only (the edge function). No INSERT policy for
-- authenticated/anon. Service role bypasses RLS by default.
