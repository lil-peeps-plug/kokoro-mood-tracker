import { useMemo } from 'react'
import { useI18n, type Locale } from '@/lib/i18n'
import type { MoodEntry } from '@/utils/stats'

// ============================================================
//  MoodCalendar — current-month grid, mood gradient by day
//  ----------------------------------------------------------
//  Colors are intentionally inline hex (not CSS variables) so
//  html2canvas captures them as-is for the PDF export. Same
//  reasoning as the existing .is-printing oklch swap-out.
//  ----------------------------------------------------------
//  Gradient goes super-pale → soft dusty rose, matching the
//  primary palette (oklch ~0.95→0.62, chroma 0.05).
// ============================================================

const SCORE_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#f5ebe2', // super-pale cream-pink
  2: '#ecd0c8', // very pale pink
  3: '#dba8a8', // soft pink
  4: '#c08484', // dusty rose
  5: '#a76868', // primary dusty rose (matches --color-primary)
}

const EMPTY_BG = '#231b2b'        // dark, matches card surface
const TODAY_RING = '#e6c39f'      // warm cream accent
const TEXT_ON_DARK = 'rgba(243, 238, 221, 0.85)'
const TEXT_ON_PALE = '#3a2a30'
const TEXT_ON_ROSE = '#f3eedd'

function localDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function avgByDay(entries: readonly MoodEntry[]): Map<string, number> {
  const buckets = new Map<string, { sum: number; count: number }>()
  for (const e of entries) {
    const key = localDayKey(new Date(e.created_at))
    const b = buckets.get(key) ?? { sum: 0, count: 0 }
    b.sum += e.score
    b.count++
    buckets.set(key, b)
  }
  const out = new Map<string, number>()
  for (const [key, b] of buckets) out.set(key, b.sum / b.count)
  return out
}

// Single-character weekday labels (Mon-first across all locales — matches
// ISO week and the RU/KA convention; EN users read it fine).
const WEEKDAYS: Record<Locale, readonly string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ru: ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'],
  ka: ['ო', 'ს', 'ო', 'ხ', 'პ', 'შ', 'კ'],
}

const MONTH_NAMES: Record<Locale, readonly string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
       'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
}

interface Props {
  entries: readonly MoodEntry[]
}

interface Cell {
  day: number | null
  key: string
  isToday: boolean
  score: 1 | 2 | 3 | 4 | 5 | null
}

function textColorFor(score: 1 | 2 | 3 | 4 | 5 | null): string {
  if (score === null) return TEXT_ON_DARK
  if (score >= 4) return TEXT_ON_ROSE
  return TEXT_ON_PALE
}

export default function MoodCalendar({ entries }: Props) {
  const { locale, t } = useI18n()

  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth()

  const cells: Cell[] = useMemo(() => {
    const avgs = avgByDay(entries)
    const first = new Date(year, month, 1)
    // Convert JS Sun=0 → Mon=0 by shifting.
    const firstWeekday = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayKey = localDayKey(now)

    const out: Cell[] = []
    for (let i = 0; i < firstWeekday; i++) {
      out.push({ day: null, key: `lead-${i}`, isToday: false, score: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const key = localDayKey(date)
      const avg = avgs.get(key)
      const score = avg === undefined
        ? null
        : (Math.min(5, Math.max(1, Math.round(avg))) as 1 | 2 | 3 | 4 | 5)
      out.push({ day: d, key, isToday: key === todayKey, score })
    }
    // Pad to a full week so the grid never wraps awkwardly.
    while (out.length % 7 !== 0) {
      out.push({ day: null, key: `tail-${out.length}`, isToday: false, score: null })
    }
    return out
  }, [entries, year, month, now])

  const monthLabel = `${MONTH_NAMES[locale][month]} ${year}`

  return (
    <div className="mood-calendar">
      <div className="mood-calendar__head">{monthLabel}</div>
      <div className="mood-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS[locale].map((w, i) => (
          <span key={i} className="mood-calendar__weekday">
            {w}
          </span>
        ))}
      </div>
      <div className="mood-calendar__grid" role="grid">
        {cells.map((c) => {
          if (c.day === null) {
            return (
              <span
                key={c.key}
                className="mood-calendar__cell mood-calendar__cell--blank"
                aria-hidden="true"
              />
            )
          }
          const bg = c.score !== null ? SCORE_COLORS[c.score] : EMPTY_BG
          const fg = textColorFor(c.score)
          const aria = c.score !== null
            ? `${monthLabel} ${c.day}, ${t.statsAverage} ${c.score}/5`
            : `${monthLabel} ${c.day}`
          return (
            <span
              key={c.key}
              role="gridcell"
              className={
                'mood-calendar__cell' +
                (c.score !== null ? ' has-score' : '') +
                (c.isToday ? ' is-today' : '')
              }
              style={{
                backgroundColor: bg,
                color: fg,
                boxShadow: c.isToday
                  ? `inset 0 0 0 1.5px ${TODAY_RING}`
                  : undefined,
              }}
              aria-label={aria}
            >
              {c.day}
            </span>
          )
        })}
      </div>
      <div className="mood-calendar__legend" aria-hidden="true">
        <span className="mood-calendar__legend-label">{t.statsCalendarLow}</span>
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            className="mood-calendar__legend-swatch"
            style={{ backgroundColor: SCORE_COLORS[s as 1 | 2 | 3 | 4 | 5] }}
          />
        ))}
        <span className="mood-calendar__legend-label">{t.statsCalendarHigh}</span>
      </div>
    </div>
  )
}
