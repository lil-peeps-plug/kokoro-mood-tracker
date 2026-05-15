import { useEffect, useState } from 'react'
import { LOCALES, useI18n } from '@/lib/i18n'
import LegalModal from '@/components/LegalModal'

const STORAGE_KEY = 'kokoro:about-dismissed'
const EXIT_MS = 620 // matches the CSS transition on .about-backdrop / .about-card

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Welcome / about modal that appears on first launch.
 *   - app description (localized)
 *   - 3-way language picker (pill segmented control)
 *   - "Don't show this again" checkbox (checked by default)
 *   - OK button
 *
 * Dismissal eases out smoothly: a `closing` flag flips on click, the
 * CSS transitions fade the backdrop + card to invisible, and the
 * component unmounts after the transition matches EXIT_MS.
 */
export default function AboutModal() {
  const { t, locale, setLocale } = useI18n()
  const [mounted, setMounted] = useState(() => !readDismissed())
  const [closing, setClosing] = useState(false)
  const [skipNext, setSkipNext] = useState(true)
  const [legalOpen, setLegalOpen] = useState(false)

  useEffect(() => {
    if (!mounted || closing) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') startClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, closing])

  useEffect(() => {
    if (!closing) return
    const t = window.setTimeout(() => setMounted(false), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [closing])

  function startClose() {
    if (closing) return
    if (skipNext) {
      try {
        window.localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* localStorage blocked */
      }
    }
    setClosing(true)
  }

  if (!mounted) return null

  return (
    <div
      className={`about-backdrop${closing ? ' is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <div className={`about-card${closing ? ' is-exiting' : ''}`}>
        <div className="about-card__head" key={locale}>
          <h2 id="about-title" className="about-card__title">
            {t.aboutTitle}
          </h2>
          <p className="about-card__body">{t.aboutBody}</p>
        </div>

        <div
          className="about-langs"
          role="radiogroup"
          aria-label={t.languageMenuLabel}
          data-active={locale}
        >
          <span className="about-langs__pill" aria-hidden="true" />
          {LOCALES.map((l) => {
            const isActive = l.code === locale
            return (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={l.label}
                className={`about-langs__btn${isActive ? ' is-active' : ''}`}
                onClick={() => setLocale(l.code)}
              >
                {l.short}
              </button>
            )
          })}
        </div>

        <label className="about-card__check">
          <input
            type="checkbox"
            checked={skipNext}
            onChange={(e) => setSkipNext(e.currentTarget.checked)}
          />
          <span>{t.aboutDontShow}</span>
        </label>

        <button
          type="button"
          className="primary-btn about-card__ok"
          onClick={startClose}
        >
          {t.aboutOk}
        </button>

        <button
          type="button"
          className="about-card__legal-link"
          onClick={() => setLegalOpen(true)}
        >
          {t.legalLink}
        </button>
      </div>

      <LegalModal open={legalOpen} onClose={() => setLegalOpen(false)} />
    </div>
  )
}
