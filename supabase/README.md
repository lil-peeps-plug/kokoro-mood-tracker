# Supabase

This folder holds Supabase-related code: SQL migrations now, an Edge Function in Phase 2.

## Migrations

Plain `.sql` files under `migrations/`. Run them **in order** against your Supabase project. The current set:

1. `001_create_mood_entries.sql` — creates the `public.mood_entries` table and its index.
2. `002_enable_rls.sql` — enables Row Level Security and adds the per-user CRUD policies.

### How to run them (dashboard route)

1. Open your project at <https://supabase.com/dashboard>.
2. Left sidebar → **SQL Editor**.
3. Click **+ New query**, paste the contents of `001_create_mood_entries.sql`, click **Run**.
4. Repeat with `002_enable_rls.sql`.

### How to verify

After running both:

- Sidebar → **Database → Tables** → you should see `public.mood_entries` with the columns listed and a shield icon (RLS on).
- Sidebar → **Authentication → Policies** → you should see 4 policies on `mood_entries` (select / insert / update / delete own).

Or, in the SQL Editor:

```sql
select tablename, rowsecurity
  from pg_tables
 where tablename = 'mood_entries';

select policyname, cmd
  from pg_policies
 where tablename = 'mood_entries';
```

Expect `rowsecurity = true` and four policies.

### When we switch to the Supabase CLI

In Phase 2 we deploy an Edge Function, which is easiest via the CLI. At that point we'll link this folder to your project and migrations can be applied with `supabase db push` instead of copy-paste.
