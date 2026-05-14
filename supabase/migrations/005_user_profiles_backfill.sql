-- ============================================================
-- Migration 005: backfill user_profiles
-- ============================================================
-- Anyone who logged in via auth-telegram BEFORE migration 003
-- created the user_profiles table is missing a row. Going
-- forward the Edge Function upserts them on every login, but
-- the existing users won't show up in the admin graph until
-- they happen to log in again. This one-shot backfill copies
-- whatever identity we already have on auth.users into the
-- new table.
--
-- Idempotent (ON CONFLICT DO NOTHING) so it's safe to re-run.
-- ============================================================

insert into public.user_profiles
  (id, telegram_id, username, first_name, last_name)
select
  id,
  nullif(raw_app_meta_data->>'telegram_id', '')::bigint,
  nullif(raw_user_meta_data->>'telegram_username', ''),
  nullif(raw_user_meta_data->>'telegram_first_name', ''),
  nullif(raw_user_meta_data->>'telegram_last_name', '')
from auth.users
where raw_app_meta_data->>'provider' = 'telegram'
on conflict (id) do nothing;
