-- ============================================================================
-- OnlyKrida — Fix infinite recursion in group_members RLS
--
-- Generated: 2026-04-26
-- Idempotent (DROP POLICY IF EXISTS before CREATE)
--
-- Apply via: Supabase Dashboard → SQL Editor at
-- https://supabase.com/dashboard/project/dcixlerneuuyhsftnifm/sql/new
--
-- WHY THIS EXISTS
-- ----------------------------------------------------------------------------
-- supabase-group-messaging.sql:112-120 has a policy on group_members.SELECT
-- whose USING clause queries group_members itself. Postgres re-evaluates the
-- same policy on the inner query → "infinite recursion detected in policy
-- for relation 'group_members'" → status 500 on every group-related read.
--
-- The fix is to wrap the membership check in a SECURITY DEFINER function
-- that bypasses RLS for its inner SELECT. The function runs with the
-- definer's privileges (postgres), so its query against group_members does
-- not re-trigger the policy. Standard Supabase RLS pattern.
--
-- WHAT THIS PATCH DOES
-- ----------------------------------------------------------------------------
-- 1. Defines is_group_member(group_id, user_id) helper function
-- 2. Drops + recreates all four policies that reference group_members from
--    inside its own / a related-table policy:
--    - Members can view group members  (the recursive one)
--    - Members can view their groups
--    - Group admins can update groups
--    - Group admins can delete groups
-- ============================================================================

-- ---------- Helper function ----------

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated, anon;

-- ---------- Replace the recursive group_members SELECT policy ----------

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;

CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

-- Allow users to add themselves to a group (e.g. accepting an invite)
-- and admins to add others. Insert policy.
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

-- Allow users to leave groups (delete their own membership) and admins
-- to remove others. Delete policy.
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

-- ---------- Refactor groups policies to use the helper ----------

DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can delete groups" ON public.groups;

CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id, auth.uid()));

CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE
  USING (public.is_group_admin(id, auth.uid()))
  WITH CHECK (public.is_group_admin(id, auth.uid()));

CREATE POLICY "Group admins can delete groups"
  ON public.groups FOR DELETE
  USING (public.is_group_admin(id, auth.uid()));

-- ---------- Refactor group_messages policies to use the helper ----------

DROP POLICY IF EXISTS "Members can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Members can send group messages" ON public.group_messages;

CREATE POLICY "Members can view group messages"
  ON public.group_messages FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can send group messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );
