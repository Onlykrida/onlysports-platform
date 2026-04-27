-- ============================================================================
-- OnlyKrida — Notification types for verification flow
--
-- Generated: 2026-04-27
-- Apply via: Supabase Dashboard → SQL Editor at
-- https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- WHY THIS EXISTS
-- ----------------------------------------------------------------------------
-- The notifications.type CHECK constraint currently allows 11 types but the
-- verification flow needs three more so we can deliver the right copy + tap
-- navigation:
--   verification_request   → coach/scout/trainer notified that an athlete
--                            wants them to verify a test result
--   verification_approved  → athlete notified their result was approved
--                            (data.mode tells them in_person vs remote_video)
--   verification_rejected  → athlete notified their request was declined
--
-- The data jsonb column already exists; we use it for:
--   { test_result_id, request_id, athlete_id?, verifier_id?, mode? }
-- The Notification.data shape lets the notifications screen deep-link to
-- /verify-result for verifiers and to /beep-test-history for athletes.
-- ============================================================================

DO $$
BEGIN
  -- Drop the old CHECK constraint by name (PG default name is
  -- notifications_type_check on a CHECK on column `type` of `notifications`)
  ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;
  -- Recreate with the verification trio added
  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'like',
      'follow',
      'comment',
      'opportunity',
      'message',
      'application',
      'connection_request',
      'connection_accepted',
      'profile_view',
      'mention',
      'system',
      'verification_request',
      'verification_approved',
      'verification_rejected'
    ));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'notifications_type_check: %', SQLERRM;
END $$;
