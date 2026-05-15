import { useEffect, useRef, useState } from 'react'
import { useMusic } from '@/lib/music'
import { useI18n } from '@/lib/i18n'

/**
 * Music note pill in the top-left of the banner. Tap to open a popover
 * with a play/pause toggle. The volume slider was removed — the
 * default ambient level is intentionally quiet and the iOS Telegram
 * WebView made the slider unreliable. On/off only for now.
 *
 * Visually mirrors the language picker on the right side of the banner.
 * Closes on outside-click and Escape.
 */
export default function MusicToggle() {
  const { playing, toggle, ready } = useMusic()
  const { t } = useI18n()
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

  const triggerLabel = playing ? t.musicPause : t.musicPlay

  return (
    <div className="music" ref={rootRef}>
      <button
        type="button"
        className={`music-btn${playing ? ' is-playing' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        disabled={!ready}
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>

      <div
        className={`music-menu${open ? ' is-open' : ''}`}
        role="menu"
        aria-label={t.musicPlay}
      >
        <button
          type="button"
          className={`music-menu__toggle${playing ? ' is-playing' : ''}`}
          role="menuitemcheckbox"
          aria-checked={playing}
          onClick={toggle}
        >
          <span
            className="music-menu__toggle-icon"
            aria-hidden="true"
            data-state={playing ? 'pause' : 'play'}
          >
            <span className="music-menu__toggle-icon-glyph music-menu__toggle-icon-glyph--play">
              ▶
            </span>
            <span className="music-menu__toggle-icon-glyph music-menu__toggle-icon-glyph--pause">
              ❚❚
            </span>
          </span>
          <span className="music-menu__toggle-label">
            <span
              key={playing ? 'pause' : 'play'}
              className="music-menu__toggle-label-text"
            >
              {triggerLabel}
            </span>
          </span>
        </button>

        <p className="music-menu__legal">
          <a
            className="music-menu__legal-link"
            href="https://www.youtube.com/watch?v=xORCbIptqcc"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.musicSource} ↗
          </a>
          <span className="music-menu__legal-body">{t.musicLegal}</span>
        </p>
      </div>
    </div>
  )
}
