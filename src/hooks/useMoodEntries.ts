import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { rangeCutoffISO, type MoodEntry, type Range } from '@/utils/stats'

interface State {
  entries: MoodEntry[]
  loading: boolean
  error: string | null
}

// Cross-component refresh signal. LogMoodView dispatches this after a
// successful save/upsert; useMoodEntries (in StatsView) listens for it
// and refetches so the charts, calendar, and history stay in sync.
export const MOOD_UPDATED_EVENT = 'kokoro:mood-updated'

/**
 * Fetches the signed-in user's mood entries for the given range,
 * newest first. Auto-refetches whenever `range` changes OR whenever
 * a `kokoro:mood-updated` window event fires (dispatched from
 * LogMoodView after a save). RLS guarantees we only see our own rows.
 */
export function useMoodEntries(range: Range) {
  const [state, setState] = useState<State>({
    entries: [],
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((n) => n + 1), [])

  // Listen for cross-component mood-changed signals. Attached once on
  // mount; refetches by bumping the same tick the manual refetch uses.
  useEffect(() => {
    function onMoodUpdated() {
      setTick((n) => n + 1)
    }
    window.addEventListener(MOOD_UPDATED_EVENT, onMoodUpdated)
    return () =>
      window.removeEventListener(MOOD_UPDATED_EVENT, onMoodUpdated)
  }, [])

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
