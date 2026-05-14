import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ============================================================
//  useAdminData — admin-side fetcher for the graph view
// ============================================================
//  Pulls all user_profiles + all mood entries from the last
//  30 days, in parallel. RLS policies (is_admin()) grant the
//  admin read access; non-admin sessions would just see their
//  own rows.
// ============================================================

const RANGE_DAYS = 30

export interface AdminUser {
  id: string
  telegram_id: number | null
  username: string | null
  first_name: string | null
  last_name: string | null
}

export interface AdminMoodEntry {
  id: string
  user_id: string
  score: number
  created_at: string
}

interface State {
  loading: boolean
  error: string | null
  users: AdminUser[]
  entries: AdminMoodEntry[]
}

export function useAdminData() {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    users: [],
    entries: [],
  })
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setReloadKey((k) => k + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    const cutoff = new Date(
      Date.now() - RANGE_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    async function load() {
      const [usersRes, entriesRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, telegram_id, username, first_name, last_name')
          .order('updated_at', { ascending: false }),
        supabase
          .from('mood_entries')
          .select('id, user_id, score, created_at')
          .gte('created_at', cutoff)
          .order('created_at', { ascending: false })
          .limit(5000),
      ])
      if (cancelled) return

      const err = usersRes.error?.message ?? entriesRes.error?.message ?? null
      setState({
        loading: false,
        error: err,
        users: err ? [] : ((usersRes.data ?? []) as AdminUser[]),
        entries: err ? [] : ((entriesRes.data ?? []) as AdminMoodEntry[]),
      })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return { ...state, refetch }
}
