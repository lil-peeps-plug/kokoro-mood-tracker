-- ============================================================
-- Migration 006: admin role + grant repair
-- ============================================================
-- "Permission denied" on /admin can be caused by three distinct
-- things; this migration closes each, idempotently.
--
--  1. The master account exists but its raw_app_meta_data is
--     missing role='admin' (e.g. it was created before migration
--     004 introduced the is_admin() helper). is_admin() then
--     evaluates to false even on a fresh JWT.
--  2. is_admin() exists but the authenticated role can't EXECUTE
--     it. The function returns nothing, RLS denies the query.
--  3. The authenticated role doesn't have base SELECT on the
--     tables. RLS is never even reached — Postgres rejects at
--     the GRANT layer.
--
-- All three are safe to re-apply.
-- ============================================================

-- 1. Force role='admin' on the master user. Merging with the
--    existing app_metadata so any other keys (provider, username)
--    survive. After running this the admin must sign out and
--    sign in again (or just hit "Refresh session & retry") so
--    Supabase mints a JWT that includes the new claim.
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'role',     'admin',
    'username', 'master',
    'provider', 'kokoro-admin'
  )
where email = 'master@kokoro.local';

-- 2. Make sure authenticated can call is_admin() from RLS.
--    Anon never has a session that would satisfy it, but
--    granting both keeps grants symmetric with the policies.
grant execute on function public.is_admin() to authenticated, anon;

-- 3. Belt-and-braces table grants. Supabase usually gives
--    authenticated all DML on public tables by default, but if
--    a `revoke` ever fired in setup history these reinstate it.
--    RLS still gates which rows the user sees.
grant select on public.user_profiles to authenticated;
grant select on public.mood_entries  to authenticated;
