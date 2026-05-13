import { useMemo, useRef, useState } from 'react'
import { useI18n, type Locale } from '@/lib/i18n'
import { useMoodEntries } from '@/hooks/useMoodEntries'
import { computeStats, type Range } from '@/utils/stats'
import HistoryList from '@/components/HistoryList'
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

function rangeLabelFor(t: ReturnType<typeof useI18n>['t'], r: Range): string {
  return r === '7d' ? t.statsRange7d : r === '30d' ? t.statsRange30d : t.statsRangeAll
}

export default function StatsView() {
  const { t, locale } = useI18n()
  const [range, setRange] = useState<Range>('7d')
  const { entries, loading, error } = useMoodEntries(range)

  const stats = useMemo(() => computeStats(entries), [entries])

  const cardRef = useRef<HTMLElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function onExport() {
    if (!cardRef.current || exporting || entries.length === 0) return
    setExporting(true)
    setExportError(null)
    try {
      // Lazy import — keeps html2canvas + jsPDF (~250 KB) out of the
      // initial bundle. They load only the first time the user hits Export.
      const { exportMoodReport } = await import('@/utils/exportPdf')
      await exportMoodReport({
        element: cardRef.current,
        reportLabel: t.statsReportLabel,
        rangeLabel: rangeLabelFor(t, range),
        footerLabel: t.statsFooterLine,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setExportError(msg)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section ref={cardRef} className="card" aria-label={t.statsTitle}>
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

      <section className="stats-section" aria-label={t.statsHistory}>
        <h2 className="stats-section__title">{t.statsHistory}</h2>
        <HistoryList entries={entries} />
      </section>

      <div className="card__footer">
        <button
          type="button"
          className="primary-btn"
          disabled={entries.length === 0 || exporting}
          onClick={onExport}
          aria-busy={exporting}
        >
          {exporting ? t.statsExporting : t.statsExportPdf}
        </button>
        {exportError && (
          <p className="card__error" role="alert">
            {exportError}
          </p>
        )}
      </div>
    </section>
  )
}
