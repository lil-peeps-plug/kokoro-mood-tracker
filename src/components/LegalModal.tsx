import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import LegalContent from '@/components/LegalContent'

// ============================================================
//  LegalModal — Privacy + Terms in one scrollable modal
// ============================================================
//  Opened from the About modal. Closes with a smooth exit
//  animation — clicking the backdrop, the dismiss button, or
//  pressing Escape flips an internal `closing` flag that adds
//  `is-exiting` to the backdrop + card; the parent unmounts the
//  component after the matching transition has played.
// ============================================================

interface Props {
  open: boolean
  onClose: () => void
}

const EXIT_MS = 620

export default function LegalModal({ open, onClose }: Props) {
  const { t, locale } = useI18n()
  const [closing, setClosing] = useState(false)

  // Reset the exit-state flag each time the modal is freshly opened
  // so a remount doesn't start mid-fade.
  useEffect(() => {
    if (open) setClosing(false)
  }, [open])

  useEffect(() => {
    if (!open || closing) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') beginClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing])

  function beginClose() {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, EXIT_MS)
  }

  if (!open) return null

  return (
    <div
      className={`legal-backdrop${closing ? ' is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-title"
      onClick={beginClose}
    >
      <div
        className={`legal-card${closing ? ' is-exiting' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="legal-card__head">
          <h2 id="legal-title" className="legal-card__title">
            {t.legalTitle}
          </h2>
          <p className="legal-card__sub">{t.legalUpdated} 2026-05-14</p>
        </header>

        <div className="legal-card__body">
          <LegalContent locale={locale} />
        </div>

        <footer className="legal-card__foot">
          <button
            type="button"
            className="primary-btn legal-card__close"
            onClick={beginClose}
          >
            {t.legalDismiss}
          </button>
        </footer>
      </div>
    </div>
  )
}

// Re-export EXIT_MS so AboutModal could schedule fade-out if needed.
export { EXIT_MS as LEGAL_EXIT_MS }
