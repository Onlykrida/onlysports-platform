-- ============================================================================
-- Security hardening — corrected rework of the pulled 20260713_audit_security_fixes.sql
-- (that file was removed from the repo after 5 reviewers confirmed it would
-- break coach approval, follow/post counters, login profile loads, and
-- Discover if applied; findings in gstack artifacts
-- security/audit-migration-rework-findings.md).
--
-- STATUS: applied to dcixlerneuuyhsftnifm on 2026-07-16 via MCP.
-- Ships together with app changes in the same PR:
--   hooks/auth-context.tsx  — explicit profile columns (email from session)
--   hooks/fitness-test-context.tsx — approveVerification via RPC w/ fallback
-- ============================================================================

-- ── 0. Service-role / admin detection that works on current PostgREST ───────
-- The pulled file read request.jwt.claim.role (legacy per-claim GUC), which
-- modern PostgREST doesn't set — its bypass never fired, so seed scripts and
-- admin paths would have been rejected. Read the claims JSON, keep the legacy
-- GUC as fallback, and allow direct-DB admins (SQL editor).
create or replace function public.is_privileged_writer()
returns boolean language plpgsql stable as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return true;
  end if;
  begin
    if coalesce(
         nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
         current_setting('request.jwt.claim.role', true)
       ) = 'service_role' then
      return true;
    end if;
  exception when others then
    -- malformed/absent claims — fall through to false
    null;
  end;
  return false;
end $$;

revoke all on function public.is_privileged_writer() from public, anon;
grant execute on function public.is_privileged_writer() to authenticated, service_role;

-- ── 1. Guard: privileged profile columns ────────────────────────────────────
-- Users must not set their own verified flag, role, or counters. The pulled
-- version broke follow/unfollow and post create/delete because the platform's
-- own counter triggers (update_follow_counts, update_posts_count) update
-- profiles inside authenticated requests: pg_trigger_depth() > 1 exempts
-- trigger-driven writes (the guard itself runs at depth 1).
create or replace function public.guard_profile_privileged_cols()
returns trigger language plpgsql as $$
begin
  if public.is_privileged_writer() or pg_trigger_depth() > 1 then
    return new;
  end if;
  if new.verified is distinct from old.verified
     or new.role is distinct from old.role
     or new.followers_count is distinct from old.followers_count
     or new.following_count is distinct from old.following_count
     or new.posts_count is distinct from old.posts_count then
    raise exception 'privileged profile columns are not user-editable';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_privileged on public.profiles;
create trigger trg_guard_profile_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_cols();

-- ── 2. Guard: fitness verification columns + sanctioned approval path ──────
-- Verification tier/verified_by/verified_at/mode may only change via the
-- approve_verification RPC (which sets a transaction-local flag), triggers,
-- or privileged writers. Athletes keep INSERT freedom for self/app tiers —
-- the INSERT guard blocks self-inserting coach/center tiers.
create or replace function public.guard_fitness_verification_cols()
returns trigger language plpgsql as $$
begin
  if public.is_privileged_writer()
     or pg_trigger_depth() > 1
     or current_setting('app.verification_approval', true) = '1' then
    return new;
  end if;
  if new.verification_tier is distinct from old.verification_tier
     or new.verified_by  is distinct from old.verified_by
     or new.verified_at  is distinct from old.verified_at
     or new.verification_mode is distinct from old.verification_mode then
    raise exception 'verification columns can only change through coach approval';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_fitness_verification on public.fitness_test_results;
create trigger trg_guard_fitness_verification
  before update on public.fitness_test_results
  for each row execute function public.guard_fitness_verification_cols();

create or replace function public.guard_fitness_insert_tier()
returns trigger language plpgsql as $$
begin
  if public.is_privileged_writer() or pg_trigger_depth() > 1 then
    return new;
  end if;
  if new.verification_tier in ('coach_verified', 'center_tested') then
    raise exception 'coach/center tiers can only be granted through verification';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_fitness_insert on public.fitness_test_results;
create trigger trg_guard_fitness_insert
  before insert on public.fitness_test_results
  for each row execute function public.guard_fitness_insert_tier();

-- ── 3. approve_verification RPC — the sanctioned upgrade path ───────────────
-- Anti-collusion (pulled version let ANY self-signed-up coach verify ANY
-- result, straight to center_tested):
--   * a pending verification_requests row must pair THIS caller with the result
--   * self-verification is rejected
--   * grants coach_verified only — center_tested stays service-role-only
--   * verifier must hold a verifier role
create or replace function public.approve_verification(
  p_request_id uuid,
  p_test_result_id uuid,
  p_mode text,
  p_notes text default null
) returns void
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_req record;
  v_athlete uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_mode not in ('in_person', 'remote_video', 'sensor_only') then
    raise exception 'invalid verification mode';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('coach','trainer','scout','team','academy')
  ) then
    raise exception 'only coaches, trainers, scouts, teams, or academies can verify results';
  end if;

  select * into v_req
    from public.verification_requests
   where id = p_request_id
     and coach_id = auth.uid()
     and test_result_id = p_test_result_id
     and status = 'pending'
   for update;
  if not found then
    raise exception 'no pending verification request addressed to you for this result';
  end if;

  select athlete_id into v_athlete
    from public.fitness_test_results where id = p_test_result_id;
  if v_athlete is null then
    raise exception 'test result not found';
  end if;
  if v_athlete = auth.uid() then
    raise exception 'you cannot verify your own result';
  end if;

  -- transaction-local flag: lets the guard trigger admit exactly this write
  perform set_config('app.verification_approval', '1', true);

  update public.fitness_test_results
     set verification_tier = 'coach_verified',
         verification_mode = p_mode,
         verified_by = auth.uid(),
         verified_at = now(),
         verification_notes = p_notes
   where id = p_test_result_id;

  update public.verification_requests
     set status = 'approved',
         coach_notes = p_notes,
         resolved_at = now()
   where id = p_request_id;

  insert into public.notifications (user_id, type, title, message, data, read)
  values (
    v_athlete,
    'verification_approved',
    'Verification approved!',
    (select name from public.profiles where id = auth.uid())
      || ' verified your fitness test '
      || case when p_mode = 'in_person' then 'in-person' else 'via video review' end
      || '. Tier upgraded to Coach-Verified.',
    jsonb_build_object(
      'test_result_id', p_test_result_id,
      'request_id', p_request_id,
      'verifier_id', auth.uid(),
      'mode', p_mode
    ),
    false
  );
end $$;

revoke all on function public.approve_verification(uuid, uuid, text, text) from public, anon;
grant execute on function public.approve_verification(uuid, uuid, text, text) to authenticated;

-- ── 4. Profiles column-level SELECT grants ──────────────────────────────────
-- Deny-list design: email and push_token are the sensitive columns; everything
-- else the product displays (date_of_birth/gender feed age/gender zone math —
-- DPDP follow-up in Wave B replaces raw DOB with a computed age_group).
-- The pulled version's allow-list omitted location/city/state/gender/dob and
-- would have 42501'd login (select *), Discover, and zone calculations.
revoke select on public.profiles from anon, authenticated;
grant select (
  id, name, role, avatar, cover_photo, bio, location, city, state,
  verified, sport, position, achievements, stats, role_specific_data,
  gender, date_of_birth,
  followers_count, following_count, posts_count,
  created_at, updated_at
) on public.profiles to authenticated;
-- own-row full access for updates the app performs (email/push_token stay
-- readable only via auth.getUser()/session, not via profile queries)
grant update (
  name, avatar, cover_photo, bio, location, city, state, sport, position,
  achievements, stats, role_specific_data, gender, date_of_birth, push_token,
  updated_at
) on public.profiles to authenticated;

-- ── 5. F1: kill the DM-preview leak overload ───────────────────────────────
-- get_conversations(user_uuid) let any caller read anyone's conversation
-- previews. The app doesn't call it (messages-context queries tables under
-- RLS directly) — drop the leak and install the auth.uid()-scoped version so
-- prod matches the canonical schema.
drop function if exists public.get_conversations(uuid);

create or replace function public.get_conversations()
returns table (
  participant_id uuid, participant_name text, participant_avatar text,
  participant_role text, last_message text, last_message_time timestamptz,
  unread_count bigint
) language plpgsql security definer set search_path = public as $$
declare
  user_uuid uuid := auth.uid();
begin
  if user_uuid is null then raise exception 'not authenticated'; end if;
  return query
  with convos as (
    select distinct
      case when m.sender_id = user_uuid then m.receiver_id else m.sender_id end as other_user_id,
      max(m.created_at) as last_msg_time
    from public.messages m
    where m.sender_id = user_uuid or m.receiver_id = user_uuid
    group by other_user_id
  )
  select
    c.other_user_id, p.name, p.avatar, p.role,
    (select content from public.messages
      where (sender_id = user_uuid and receiver_id = c.other_user_id)
         or (sender_id = c.other_user_id and receiver_id = user_uuid)
      order by created_at desc limit 1),
    c.last_msg_time,
    (select count(*) from public.messages
      where sender_id = c.other_user_id and receiver_id = user_uuid and read = false)
  from convos c
  join public.profiles p on p.id = c.other_user_id
  order by c.last_msg_time desc;
end $$;

revoke all on function public.get_conversations() from public, anon;
grant execute on function public.get_conversations() to authenticated;

-- ── 6a. Anon lockdown ────────────────────────────────────────────────────────
-- The canonical GRANT ALL included anon on every table and function — the
-- root enabler of the /cso findings (any anon-key holder could call
-- SECURITY DEFINER helpers and read PII columns). The app is auth-gated;
-- anon legitimately writes exactly two things.
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon;
grant insert on public.analytics_events to anon;  -- pre-login telemetry (null-user policy)
do $$
begin
  if to_regclass('public.waitlist') is not null then
    grant insert on public.waitlist to anon;      -- public waitlist form
  end if;
end $$;

-- ── 6b. Search performance (keyset + trigram) ───────────────────────────────
create extension if not exists pg_trgm;
create index if not exists idx_profiles_created_at_id
  on public.profiles (created_at desc, id desc);
create index if not exists idx_profiles_bio_trgm
  on public.profiles using gin (bio gin_trgm_ops);
create index if not exists idx_profiles_location_trgm
  on public.profiles using gin (location gin_trgm_ops);
create index if not exists idx_profiles_city_trgm
  on public.profiles using gin (city gin_trgm_ops);
create index if not exists idx_profiles_state_trgm
  on public.profiles using gin (state gin_trgm_ops);
