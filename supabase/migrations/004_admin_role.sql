-- ============================================================
-- Migration 004: is_admin() helper + RLS for user_profiles
-- ============================================================
-- A row in auth.users is "admin" when its app_metadata.role is
-- the literal string 'admin'. app_metadata is server-controlled
-- (only the service-role key can write it), so it's safe to use
-- for authorization decisions — users cannot self-promote.
--
-- The is_admin() SQL helper lets RLS policies say
--   using (is_admin())
-- instead of repeating the JWT lookup everywhere.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

comment on function public.is_admin() is
  'Returns true if the current JWT carries app_metadata.role = "admin".';

-- ------------------------------------------------------------
-- RLS on user_profiles
-- ------------------------------------------------------------
-- Regular users: can SELECT their own row only.
-- Admins:        can SELECT every row.
-- Inserts and updates are reserved for the service role
-- (no policies for INSERT/UPDATE — Edge Functions with the
-- service-role key bypass RLS anyway).
-- ------------------------------------------------------------

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles: select own"   on public.user_profiles;
drop policy if exists "user_profiles: select admin" on public.user_profiles;

create policy "user_profiles: select own"
  on public.user_profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "user_profiles: select admin"
  on public.user_profiles
  for select
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- Admin-visibility policy on mood_entries
-- ------------------------------------------------------------
-- The admin graph needs to read everyone's mood scores to
-- compute correlations. The existing "select own" policy still
-- applies; this one adds the admin's read access on top.
-- ------------------------------------------------------------

drop policy if exists "mood_entries: select admin" on public.mood_entries;

create policy "mood_entries: select admin"
  on public.mood_entries
  for select
  to authenticated
  using (public.is_admin());
