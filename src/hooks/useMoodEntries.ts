import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { rangeCutoffISO, type MoodEntry, type Range } from '@/utils/stats'

interface State {
  entries: MoodEntry[]
  loading: boolean
  error: string | null
}

/**
 * Fetches the signed-in user's mood entries for the given range,
 * newest first. Auto-refetches whenever `range` changes. RLS on
 * Supabase guarantees we only ever see our own rows.
 */
export function useMoodEntries(range: Range) {
  const [state, setState] = useState<State>({
    entries: [],
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    let query = supabase
      .from('mood_entries')
      .select('id, user_id, score, note, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)

    const cutoff = rangeCutoffISO(range)
    if (cutoff) query = query.gte('created_at', cutoff)

    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setState({ entries: [], loading: false, error: error.message })
      } else {
        setState({
          entries: (data ?? []) as MoodEntry[],
          loading: false,
          error: null,
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [range, tick])

  return { ...state, refetch }
}
