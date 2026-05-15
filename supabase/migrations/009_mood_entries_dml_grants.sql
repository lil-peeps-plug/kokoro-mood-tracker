-- ============================================================
-- Migration 009: re-grant DML on mood_entries to authenticated
-- ============================================================
-- Migration 006 reinstated only SELECT on mood_entries. Upserting
-- a row (INSERT ... ON CONFLICT DO UPDATE) needs INSERT *and*
-- UPDATE privileges before RLS is consulted; without them the
-- API rejects the write with:
--
--     permission denied for table mood_entries
--
-- These grants are the Supabase defaults for tables in the
-- `public` schema. Re-applying them is a no-op if they were
-- never revoked.
--
-- RLS still gates which rows the user can actually touch (see
-- migration 002). These grants just put authenticated back at
-- the table level so RLS gets a chance to run.
--
-- Idempotent: safe to re-run.
-- ============================================================

grant select, insert, update, delete
  on public.mood_entries
  to authenticated;
