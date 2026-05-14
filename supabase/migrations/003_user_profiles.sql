-- ============================================================
-- Migration 003: user_profiles
-- ============================================================
-- Mirrors a small slice of auth.users so the admin panel can
-- list "every Kokoro user" in one indexed read instead of paging
-- through auth.admin.listUsers() repeatedly.
--
-- Names + Telegram nickname only — no profile photos for now.
-- Mood data still lives in mood_entries.
-- ============================================================

create table if not exists public.user_profiles (
  id              uuid        primary key
                              references auth.users(id) on delete cascade,

  -- Telegram identifiers (null for the bootstrapped master admin,
  -- who logs in with username/password and isn't a Telegram user).
  telegram_id     bigint      unique,
  username        text,
  first_name      text,
  last_name       text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Admin panel reads user_profiles ordered by telegram_id /
-- newest first; a btree on telegram_id covers both.
create index if not exists user_profiles_telegram_id_idx
  on public.user_profiles (telegram_id);

create index if not exists user_profiles_updated_at_idx
  on public.user_profiles (updated_at desc);

-- updated_at auto-bump on UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute procedure public.set_updated_at();

comment on table public.user_profiles is
  'Kokoro: cached Telegram identity (name + nickname), populated by the auth-telegram Edge Function.';
