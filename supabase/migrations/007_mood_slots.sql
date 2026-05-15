-- ============================================================
-- Migration 007: per-day mood slots (morning / afternoon / night)
-- ============================================================
-- Adds two columns to mood_entries:
--
--   slot         text — 'morning' | 'afternoon' | 'night', nullable
--   entry_date   date — the user's *local* calendar date, computed
--                       client-side at insert time
--
-- Plus a unique partial index that guarantees a user can have at most
-- one row per (date, slot). Editing a slot is therefore a clean upsert
-- with onConflict = 'user_id,entry_date,slot' — no delete/insert dance.
--
-- Legacy rows from before this migration keep slot = NULL and
-- entry_date = NULL. They still count in stats (which aggregate by
-- created_at) but don't appear in the new daily slot view.
--
-- Idempotent: safe to re-run.
-- ============================================================

alter table public.mood_entries
  add column if not exists slot text
    check (slot is null or slot in ('morning','afternoon','night')),
  add column if not exists entry_date date;

-- One row per user per (date, slot). Partial so legacy NULL rows are
-- exempt from the constraint.
create unique index if not exists mood_entries_user_date_slot_unique
  on public.mood_entries (user_id, entry_date, slot)
  where slot is not null;

-- Covers the LogMoodView fetch ("today's slots for me"). Partial so it
-- only indexes rows that actually have an entry_date.
create index if not exists mood_entries_user_entry_date_idx
  on public.mood_entries (user_id, entry_date desc)
  where entry_date is not null;

comment on column public.mood_entries.slot is
  'Which third of the day the entry belongs to: morning, afternoon, or night.';
comment on column public.mood_entries.entry_date is
  'User-local calendar date for the entry. Decoupled from created_at so timezone-edge entries don''t collide with the next day.';
