-- ============================================================================
-- Fix confirmed live production bugs found in dcixlerneuuyhsftnifm logs (2026-07-13)
--
-- Apply in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- BUG 1 (CRITICAL): "infinite recursion detected in policy for relation
-- group_members" — every GET /rest/v1/group_members returns 500 on app load.
-- Cause: the SELECT/INSERT/DELETE policies query group_members from inside a
-- policy ON group_members, re-invoking the same policy forever. SECURITY
-- DEFINER helpers query the table with RLS bypassed, breaking the cycle.
--
-- Current state is fully broken (500s), so this can only improve it. Reversible.
-- ============================================================================

create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from public.group_members
                 where group_id = gid and user_id = auth.uid());
$$;

create or replace function public.is_group_admin(gid uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from public.group_members
                 where group_id = gid and user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_group_creator(gid uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (select 1 from public.groups
                 where id = gid and created_by = auth.uid());
$$;

revoke all on function public.is_group_member(uuid)  from anon;
revoke all on function public.is_group_admin(uuid)   from anon;
revoke all on function public.is_group_creator(uuid) from anon;
grant execute on function public.is_group_member(uuid)  to authenticated;
grant execute on function public.is_group_admin(uuid)   to authenticated;
grant execute on function public.is_group_creator(uuid) to authenticated;

drop policy if exists "Members can view group members" on public.group_members;
create policy "Members can view group members"
  on public.group_members for select
  using (public.is_group_member(group_id));

drop policy if exists "Admins can add members" on public.group_members;
create policy "Admins can add members"
  on public.group_members for insert
  with check (public.is_group_admin(group_id) or public.is_group_creator(group_id));

drop policy if exists "Admins can remove members or self-leave" on public.group_members;
create policy "Admins can remove members or self-leave"
  on public.group_members for delete
  using (user_id = auth.uid() or public.is_group_admin(group_id));

-- ============================================================================
-- BUG 2 (MINOR): POST /rest/v1/analytics_events returns 403. The INSERT policy
-- is WITH CHECK (auth.uid() = user_id), but the client logs anonymous/pre-login
-- events with a null user_id. Allow null-user analytics (best-effort telemetry).
-- ============================================================================
drop policy if exists "Users can insert own events" on public.analytics_events;
create policy "Users can insert own events"
  on public.analytics_events for insert
  with check (user_id is null or auth.uid() = user_id);
