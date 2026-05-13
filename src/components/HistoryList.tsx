import { useI18n, type Locale } from '@/lib/i18n'
import { SCORE_COLORS } from '@/utils/chartTheme'
import type { MoodEntry } from '@/utils/stats'

interface Props {
  entries: readonly MoodEntry[]
}

function formatEntryDate(iso: string, locale: Locale): string {
  const tag = locale === 'ru' ? 'ru-RU' : locale === 'ka' ? 'ka-GE' : 'en-US'
  return new Intl.DateTimeFormat(tag, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function HistoryList({ entries }: Props) {
  const { t, locale } = useI18n()

  if (entries.length === 0) {
    return <div className="card__stub">{t.statsHistoryEmpty}</div>
  }

  return (
    <ol className="history" aria-label={t.statsHistory}>
      {entries.map((e) => (
        <li className="history__item" key={e.id}>
          <span
            className="history__badge"
            style={{ background: SCORE_COLORS[e.score] }}
            aria-label={`${e.score} — ${t.logScoreLabels[e.score]}`}
          >
            {e.score}
          </span>
          <div className="history__body">
            <span className="history__date">
              {formatEntryDate(e.created_at, locale)}
            </span>
            {e.note && <p className="history__note">{e.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
