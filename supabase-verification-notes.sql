-- ============================================================================
-- OnlyKrida — Athlete notes + reject reason on verification_requests
--
-- Generated: 2026-04-27
-- Idempotent (ADD COLUMN IF NOT EXISTS)
--
-- Apply via: Supabase Dashboard → SQL Editor at
-- https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- WHY THIS EXISTS
-- ----------------------------------------------------------------------------
-- Two halves of the verification UX loop, both data-only:
--
-- 1. athlete_notes — athletes can add context to a verification request.
--    Today's modal is "pick a coach, send" with no message field. Real
--    requests need context: "Hi coach, I tested at LB Nagar ground on
--    Sunday, here's the video link." Without this column the conversation
--    has to happen in DMs after-the-fact, fragmenting the trail.
--
-- 2. reject_reason — when a verifier declines, the athlete currently sees
--    a generic "[Verifier] declined" notification with no reason. The
--    athlete then doesn't know whether to retry with better video, find
--    a different coach, or give up. A categorical reason (with optional
--    free-text detail in coach_notes) lets the notification message be
--    actionable: "Test Coach declined: video isn't clear. Try a higher-
--    quality recording with the test setup visible."
--
-- coach_notes column already exists; we use it for the free-text portion
-- of any reject reason.
-- ============================================================================

-- 1. Athlete-side request notes
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS athlete_notes text;

COMMENT ON COLUMN public.verification_requests.athlete_notes IS
  'Free-text context the athlete attaches when sending the request. '
  'E.g. "Tested at LB Nagar ground Sunday morning". NULL if athlete '
  'sent the request without a note.';

-- 2. Verifier-side categorical reject reason
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS reject_reason text
  CHECK (reject_reason IN (
    'not_present',
    'video_unclear',
    'video_missing',
    'wrong_athlete',
    'incomplete_test',
    'other'
  ));

COMMENT ON COLUMN public.verification_requests.reject_reason IS
  'Categorical reason for rejection. Free-text detail goes in coach_notes. '
  'NULL for non-rejected requests.';

-- 3. Index for analytics — "what reason are coaches rejecting most often?"
CREATE INDEX IF NOT EXISTS idx_vr_reject_reason
  ON public.verification_requests(reject_reason)
  WHERE reject_reason IS NOT NULL;
