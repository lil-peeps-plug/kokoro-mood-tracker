-- ============================================================
-- Migration 008: replace partial unique index with full unique
-- constraint on (user_id, entry_date, slot)
-- ============================================================
-- Migration 007 created a partial unique index:
--     ... (user_id, entry_date, slot) WHERE slot IS NOT NULL
--
-- This index works correctly at the database level, but PostgREST
-- (which Supabase clients talk to) does not forward the partial
-- WHERE clause when handling `on_conflict=user_id,entry_date,slot`.
-- The result is a 400 from the API:
--     "no unique or exclusion constraint matching the
--      ON CONFLICT specification"
--
-- Postgres treats NULL as distinct in unique constraints by
-- default (the standard, NULLS DISTINCT), so legacy rows with
-- slot = NULL and entry_date = NULL coexist freely — promoting
-- the partial index to a full constraint is a no-op for them.
--
-- Idempotent: safe to re-run.
-- ============================================================

drop index if exists public.mood_entries_user_date_slot_unique;

alter table public.mood_entries
  drop constraint if exists mood_entries_user_date_slot_unique;

alter table public.mood_entries
  add constraint mood_entries_user_date_slot_unique
    unique (user_id, entry_date, slot);
