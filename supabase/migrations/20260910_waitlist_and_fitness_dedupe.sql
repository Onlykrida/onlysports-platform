-- ============================================================================
-- OnlyKrida — waitlist table + fitness duplicate guard  (v2, corrected)
--
-- Supersedes 20260910_waitlist_and_fitness_dedupe.sql, which FAILED with:
--   ERROR 42P17: functions in index expression must be marked IMMUTABLE
--
-- Cause: date_trunc('day', test_date) on a timestamptz is STABLE, not
-- IMMUTABLE — its result depends on the session TimeZone, so Postgres refuses
-- it in an index expression. `test_date::date` and `AT TIME ZONE 'x'` are
-- STABLE for the same reason and fail identically.
--
-- Fix: store the IST calendar day in a real column maintained by a trigger,
-- then build a plain (immutable) unique index over that column.
--
-- RUN PART 1 AND PART 2 SEPARATELY. Part 1 has no dependency on existing data.
-- ============================================================================


-- ─── PART 1: waitlist ───────────────────────────────────────────────────────
-- Safe to run on its own. Nothing here can fail on existing data.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  created_at  timestamptz not null default now()
);

create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists "Allow service role reads" on public.waitlist;
drop policy if exists "waitlist_anon_insert"     on public.waitlist;
drop policy if exists "waitlist_service_read"    on public.waitlist;

-- Anonymous visitors may INSERT (that is the entire point of a public CTA)
-- but must never read the list back.
create policy "waitlist_anon_insert" on public.waitlist
  for insert to anon, authenticated
  with check (true);

create policy "waitlist_service_read" on public.waitlist
  for select
  using (auth.role() = 'service_role');

grant insert on public.waitlist to anon, authenticated;
revoke select, update, delete on public.waitlist from anon, authenticated;


-- ─── PART 2: fitness duplicate guard ────────────────────────────────────────
-- Run ONLY after the 3 same-day duplicate rows are removed, otherwise the
-- unique index cannot be built.

-- IST calendar day of the test, maintained by trigger so the index expression
-- stays immutable.
alter table public.fitness_test_results
  add column if not exists test_day date;

create or replace function public.set_fitness_test_day()
returns trigger
language plpgsql
as $$
begin
  -- Asia/Kolkata: athletes' local day is the unit a "same-day re-save" means.
  new.test_day := (new.test_date at time zone 'Asia/Kolkata')::date;
  return new;
end;
$$;

drop trigger if exists trg_fitness_test_day on public.fitness_test_results;
create trigger trg_fitness_test_day
  before insert or update of test_date on public.fitness_test_results
  for each row execute function public.set_fitness_test_day();

-- Backfill existing rows.
update public.fitness_test_results
   set test_day = (test_date at time zone 'Asia/Kolkata')::date
 where test_day is null;

-- Collapse an identical same-day re-save. Distinct values, and the same value
-- on a different day, both still insert normally — verified against live data:
-- the 4x yoyo L5S1 rows span four separate days and are legitimate re-tests.
create unique index if not exists fitness_test_results_no_same_day_dupe
  on public.fitness_test_results (
    athlete_id,
    test_type,
    test_day,
    (coalesce(level::text, '')            || '|' ||
     coalesce(shuttle::text, '')          || '|' ||
     coalesce(sprint_time::text, '')      || '|' ||
     coalesce(sprint_distance::text, '')  || '|' ||
     coalesce(agility_time::text, '')     || '|' ||
     coalesce(jump_height::text, ''))
  );
