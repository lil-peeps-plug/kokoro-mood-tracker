// ============================================================
//  Kokoro admin — mood-similarity math
// ============================================================
//  Edges in the admin graph connect users whose daily mood
//  averages move together. Pearson correlation over the days
//  both users logged something, with a minimum overlap to
//  avoid noise (3 shared days).
// ============================================================

export interface RawEntry {
  user_id: string
  score: number
  created_at: string
}

function localDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Group entries by user, then by day, averaging the score per day.
 * Returns: Map<userId, Map<YYYY-MM-DD, avg>>.
 */
export function dailyAveragesByUser(
  entries: readonly RawEntry[],
): Map<string, Map<string, number>> {
  const sums = new Map<string, Map<string, { sum: number; count: number }>>()
  for (const e of entries) {
    const day = localDayKey(new Date(e.created_at))
    const byDay = sums.get(e.user_id) ?? new Map()
    const cell = byDay.get(day) ?? { sum: 0, count: 0 }
    cell.sum += e.score
    cell.count += 1
    byDay.set(day, cell)
    sums.set(e.user_id, byDay)
  }
  const out = new Map<string, Map<string, number>>()
  for (const [uid, byDay] of sums) {
    const avgs = new Map<string, number>()
    for (const [day, c] of byDay) avgs.set(day, c.sum / c.count)
    out.set(uid, avgs)
  }
  return out
}

/** Pearson correlation. Returns 0 for short or degenerate inputs. */
export function pearson(a: readonly number[], b: readonly number[]): number {
  const n = a.length
  if (n !== b.length || n < 2) return 0
  let sumA = 0
  let sumB = 0
  for (let i = 0; i < n; i++) {
    sumA += a[i] ?? 0
    sumB += b[i] ?? 0
  }
  const meanA = sumA / n
  const meanB = sumB / n
  let num = 0
  let denA = 0
  let denB = 0
  for (let i = 0; i < n; i++) {
    const da = (a[i] ?? 0) - meanA
    const db = (b[i] ?? 0) - meanB
    num += da * db
    denA += da * da
    denB += db * db
  }
  if (denA === 0 || denB === 0) return 0
  return num / Math.sqrt(denA * denB)
}

export interface PairWeight {
  /** Pearson r, clamped to [-1, 1]. */
  weight: number
  /** Number of days both users logged a mood. */
  sharedDays: number
}

/** Compute similarity between two users' daily-average series. */
export function pairSimilarity(
  a: ReadonlyMap<string, number>,
  b: ReadonlyMap<string, number>,
): PairWeight {
  const shared: string[] = []
  for (const day of a.keys()) if (b.has(day)) shared.push(day)
  if (shared.length < 3) return { weight: 0, sharedDays: shared.length }
  const aArr: number[] = []
  const bArr: number[] = []
  for (const day of shared) {
    aArr.push(a.get(day)!)
    bArr.push(b.get(day)!)
  }
  return { weight: pearson(aArr, bArr), sharedDays: shared.length }
}
