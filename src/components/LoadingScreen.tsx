import { useI18n } from '@/lib/i18n'

/**
 * First-paint splash.
 *
 * Simple flex-centred stack: kanji on top, KOKORO wordmark below it,
 * localized line at the bottom. Each fades in staggered; the whole
 * stack then drifts upward as the splash exits.
 */
interface Props {
  exiting: boolean
}

export default function LoadingScreen({ exiting }: Props) {
  const { t } = useI18n()
  return (
    <div
      className={`loading${exiting ? ' is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={t.loading}
    >
      <div className="loading__stack">
        <span className="loading__kanji" aria-hidden="true">
          心
        </span>
        <span className="loading__title">{t.bannerTitle}</span>
        <p className="loading__quote">{t.loadingQuote}</p>
      </div>
    </div>
  )
}
