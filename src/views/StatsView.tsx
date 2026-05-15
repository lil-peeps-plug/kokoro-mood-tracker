import { useMemo, useState } from 'react'
import { useI18n, type Locale } from '@/lib/i18n'
import { useMoodEntries } from '@/hooks/useMoodEntries'
import { computeStats, type Range } from '@/utils/stats'
import HistoryList from '@/components/HistoryList'
import MoodCalendar from '@/components/MoodCalendar'
import MoodDistributionChart from '@/components/MoodDistributionChart'
import MoodTrendChart from '@/components/MoodTrendChart'
import RangeFilter from '@/components/RangeFilter'
import StatTile from '@/components/StatTile'

function formatDays(n: number, locale: Locale): string {
  if (locale === 'ru') {
    const lastTwo = n % 100
    const last = n % 10
    if (lastTwo >= 11 && lastTwo <= 14) return `${n} дней`
    if (last === 1) return `${n} день`
    if (last >= 2 && last <= 4) return `${n} дня`
    return `${n} дней`
  }
  if (locale === 'ka') return `${n} დღე`
  return n === 1 ? '1 day' : `${n} days`
}

export default function StatsView() {
  const { t, locale } = useI18n()
  const [range, setRange] = useState<Range>('7d')
  const { entries, loading, error } = useMoodEntries(range)

  const stats = useMemo(() => computeStats(entries), [entries])

  return (
    <section className="card" aria-label={t.statsTitle}>
      <header className="card__head">
        <h1 className="card__title">{t.statsTitle}</h1>
        <p className="card__sub">{t.statsSubtitle}</p>
      </header>

      <RangeFilter value={range} onChange={setRange} />

      {error && (
        <p className="card__error" role="alert">
          {t.statsError}: {error}
        </p>
      )}

      <div className="stats-summary">
        <StatTile
          label={t.statsAverage}
          value={stats.total === 0 ? '—' : stats.average.toFixed(1)}
          hint={stats.total === 0 ? undefined : '/ 5'}
        />
        <StatTile
          label={t.statsStreak}
          value={String(stats.streak)}
          hint={stats.streak === 0 ? undefined : formatDays(stats.streak, locale)}
        />
        <StatTile label={t.statsTotal} value={String(stats.total)} />
      </div>

      <section className="stats-section" aria-label={t.statsTrend}>
        <h2 className="stats-section__title">{t.statsTrend}</h2>
        {entries.length > 0 ? (
          <MoodTrendChart entries={entries} />
        ) : (
          <div className="card__stub">
            {loading ? t.loading : t.statsHistoryEmpty}
          </div>
        )}
      </section>

      <section className="stats-section" aria-label={t.statsDistribution}>
        <h2 className="stats-section__title">{t.statsDistribution}</h2>
        {entries.length > 0 ? (
          <MoodDistributionChart entries={entries} />
        ) : (
          <div className="card__stub">
            {loading ? t.loading : t.statsHistoryEmpty}
          </div>
        )}
      </section>

      <section className="stats-section" aria-label={t.statsCalendar}>
        <h2 className="stats-section__title">{t.statsCalendar}</h2>
        <MoodCalendar entries={entries} />
      </section>

      <section className="stats-section" aria-label={t.statsHistory}>
        <h2 className="stats-section__title">{t.statsHistory}</h2>
        <HistoryList entries={entries} />
      </section>
    </section>
  )
}
