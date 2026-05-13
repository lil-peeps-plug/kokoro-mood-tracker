-- ============================================================
-- Migration 002: enable Row Level Security on mood_entries
-- ============================================================
-- Without this, ANY authenticated user could read/write ANY row.
-- After this, each user can only touch rows where user_id = auth.uid().
--
-- Rule of thumb for Supabase: every user-facing table needs RLS on
-- AND at least one policy, or the table is unusable through the API.
-- ============================================================

alter table public.mood_entries enable row level security;

-- Drop-if-exists first so this migration is idempotent (safe to re-run).
-- CREATE POLICY does not support IF NOT EXISTS in PG<17, so we drop first.
drop policy if exists "mood_entries: select own" on public.mood_entries;
drop policy if exists "mood_entries: insert own" on public.mood_entries;
drop policy if exists "mood_entries: update own" on public.mood_entries;
drop policy if exists "mood_entries: delete own" on public.mood_entries;

-- Belt and braces: tables with RLS but no policies deny everything,
-- which is correct, but `force row level security` also blocks the
-- table owner from bypassing RLS. We intentionally do NOT force it,
-- because the service-role key (used by Edge Functions in Phase 2
-- and the admin panel in Phase 10) needs to bypass RLS for admin tasks.

-- ------------------------------------------------------------
-- Policies: one combined "users can manage their own rows".
-- Split into per-command policies because Postgres requires
-- separate WITH CHECK / USING clauses for INSERT vs UPDATE.
-- ------------------------------------------------------------

-- SELECT: only see your own rows
create policy "mood_entries: select own"
  on public.mood_entries
  for select
  to authenticated
  using (user_id = auth.uid());

-- INSERT: can only insert rows for yourself
create policy "mood_entries: insert own"
  on public.mood_entries
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE: can only update your own rows, and can't change the user_id
create policy "mood_entries: update own"
  on public.mood_entries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE: can only delete your own rows
create policy "mood_entries: delete own"
  on public.mood_entries
  for delete
  to authenticated
  using (user_id = auth.uid());

-- The `anon` role (unauthenticated) gets NO policies, so it can't
-- read or write a single row. This is the safe default.
