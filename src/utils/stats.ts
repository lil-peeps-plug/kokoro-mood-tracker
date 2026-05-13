// ============================================================
//  Pure functions for the StatsView. No React, no Supabase —
//  just deterministic transforms over MoodEntry[].
// ============================================================

export type Score = 1 | 2 | 3 | 4 | 5

export interface MoodEntry {
  id: string
  user_id: string
  score: Score
  note: string | null
  created_at: string // ISO 8601
}

export interface MoodStats {
  total: number
  /** Mean score, rounded to one decimal. 0 when no entries. */
  average: number
  /** Consecutive days (counting back from today, local time) with ≥ 1 entry. */
  streak: number
  /** Count per score, 1..5. */
  distribution: Record<Score, number>
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function localDayKey(d: Date): string {
  // YYYY-MM-DD in the user's local timezone.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function computeStats(entries: readonly MoodEntry[]): MoodStats {
  const distribution: Record<Score, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  for (const e of entries) {
    sum += e.score
    distribution[e.score] = (distribution[e.score] ?? 0) + 1
  }
  const total = entries.length
  const average = total === 0 ? 0 : Math.round((sum / total) * 10) / 10

  // Streak: walk back from today, day-by-day in local time, until we hit
  // a day with no entries.
  const days = new Set<string>()
  for (const e of entries) days.add(localDayKey(new Date(e.created_at)))

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (days.has(localDayKey(cursor))) {
    streak++
    cursor.setTime(cursor.getTime() - ONE_DAY_MS)
  }

  return { total, average, streak, distribution }
}

export interface DailyPoint {
  /** YYYY-MM-DD in the user's local timezone. */
  date: string
  /** Mean score for that day, raw (not rounded). */
  avg: number
  /** Entries logged that day. */
  count: number
}

export function aggregateByDay(entries: readonly MoodEntry[]): DailyPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>()
  for (const e of entries) {
    const key = localDayKey(new Date(e.created_at))
    const b = buckets.get(key) ?? { sum: 0, count: 0 }
    b.sum += e.score
    b.count++
    buckets.set(key, b)
  }
  return Array.from(buckets.entries())
    .map(([date, { sum, count }]) => ({
      date,
      avg: sum / count,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export type Range = '7d' | '30d' | 'all'

export function rangeCutoffISO(range: Range): string | null {
  if (range === 'all') return null
  const days = range === '7d' ? 7 : 30
  return new Date(Date.now() - days * ONE_DAY_MS).toISOString()
}
