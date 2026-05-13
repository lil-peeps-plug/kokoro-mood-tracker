import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { LOCALES, useI18n, type Locale } from '@/lib/i18n'

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown
}

/**
 * Top-right pill in the banner. Tap to open a popover with the three
 * supported locales. Closes on outside-click and Escape.
 *
 * Exit / sign-out lives in its own button on the top-left now
 * (see ExitButton).
 */
export default function LanguagePicker() {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]!

  function changeLocale(next: Locale) {
    setOpen(false)
    const doc = document as DocWithVT
    if (doc.startViewTransition) {
      // View Transitions API with custom keyframes (see base.css):
      // both old and new animate with a short slide + fade, so the
      // brief transparent moment is masked by motion rather than read
      // as "the screen went blank".
      doc.startViewTransition(() => {
        flushSync(() => setLocale(next))
      })
    } else {
      setLocale(next)
    }
  }

  return (
    <div className="lang" ref={rootRef}>
      <button
        type="button"
        className="lang__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.languageMenuLabel}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        {current.short}
      </button>
      <ul
        className={`lang__menu${open ? ' is-open' : ''}`}
        role="menu"
        aria-label={t.languageMenuLabel}
      >
        {LOCALES.map((l) => {
          const isActive = l.code === locale
          return (
            <li key={l.code} role="none">
              <button
                type="button"
                role="menuitem"
                className={`lang__item${isActive ? ' is-active' : ''}`}
                onClick={() => changeLocale(l.code)}
              >
                <span className="lang__item-short">{l.short}</span>
                <span className="lang__item-label">{l.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
