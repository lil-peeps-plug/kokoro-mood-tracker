-- ============================================================
-- Migration 001: create mood_entries table
-- ============================================================
-- Stores one row per "I logged my mood" event for each user.
-- Linked to Supabase's built-in auth.users table.
-- Index optimised for "this user's entries, newest first" reads.
-- ============================================================

-- pgcrypto provides gen_random_uuid(). Supabase usually has it enabled
-- already, but `if not exists` makes this safe to re-run.
create extension if not exists pgcrypto;

create table if not exists public.mood_entries (
  id          uuid        primary key default gen_random_uuid(),

  -- Linked to the logged-in Supabase user. Default to auth.uid() so the
  -- frontend never has to send it explicitly — combined with the RLS
  -- policy in migration 002, this makes it impossible to insert a row
  -- as a different user, even by mistake.
  user_id     uuid        not null
                          default auth.uid()
                          references auth.users (id) on delete cascade,

  -- Mood score 1..5 enforced at the DB layer (frontend will also validate).
  score       smallint    not null check (score between 1 and 5),

  -- Optional note, capped at 280 chars (Twitter-style soft cap).
  note        text                 check (note is null or char_length(note) <= 280),

  created_at  timestamptz not null default now()
);

-- Most stats queries are: "give me this user's recent entries."
-- A composite index on (user_id, created_at desc) makes those fast.
create index if not exists mood_entries_user_created_idx
  on public.mood_entries (user_id, created_at desc);

-- Lightweight comment so future-you (or pg_dump) knows why the table exists.
comment on table public.mood_entries is
  'Kokoro: one row per user-logged mood reading (1-5) with optional note.';
