import { useCallback, useEffect, useRef, useState } from 'react'
import { useMusic } from '@/lib/music'
import { useI18n } from '@/lib/i18n'

/**
 * Music note pill in the top-left of the banner. Tap to open a popover
 * with a play/pause toggle and a volume slider.
 *
 * Visually mirrors the language picker on the right side of the banner.
 * Closes on outside-click and Escape.
 */
export default function MusicToggle() {
  const { playing, toggle, ready, volume, setVolume } = useMusic()
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

        <div className="music-menu__slider-row">
          <span className="music-menu__slider-label">{t.musicVolume}</span>
          <span className="music-menu__slider-value">{volume}%</span>
          <VolumeSlider
            value={volume}
            onChange={setVolume}
            label={t.musicVolume}
          />
        </div>

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

// Custom slider built on pointer events. The native <input type="range">
// is unreliable inside iOS Telegram's WebView — the thumb is small,
// touch hit-testing is finicky, and Telegram's swipe-down-to-close
// gesture intercepts drags before they ever reach the input. A
// div-based track with explicit pointer capture sidesteps every one
// of those issues and behaves identically on mouse + touch + pen.
interface VolumeSliderProps {
  value: number
  onChange: (next: number) => void
  label: string
}

function VolumeSlider({ value, onChange, label }: VolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Keep the latest onChange in a ref so the document-level listeners
  // attached on drag-start always call the current closure even if
  // React re-renders mid-drag.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const setFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = (clientX - rect.left) / rect.width
    const clamped = Math.min(1, Math.max(0, ratio))
    onChangeRef.current(Math.round(clamped * 100))
  }, [])

  // Drag handling lives on the document, not the element. iOS Telegram
  // WebView has been observed to silently drop setPointerCapture +
  // subsequent pointermove events on the captured element; binding to
  // the document instead sidesteps that whole class of bug.
  const startDrag = useCallback(
    (initialX: number) => {
      setFromClientX(initialX)

      function onPointerMove(ev: PointerEvent) {
        setFromClientX(ev.clientX)
      }
      function onTouchMove(ev: TouchEvent) {
        if (ev.touches.length === 0) return
        ev.preventDefault() // stop the page scrolling while dragging
        setFromClientX(ev.touches[0].clientX)
      }
      function onEnd() {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onEnd)
        document.removeEventListener('pointercancel', onEnd)
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onEnd)
        document.removeEventListener('touchcancel', onEnd)
      }
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onEnd)
      document.addEventListener('pointercancel', onEnd)
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onEnd)
      document.addEventListener('touchcancel', onEnd)
    },
    [setFromClientX],
  )

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    startDrag(e.clientX)
  }

  // Belt-and-braces for iOS Safari/Telegram where the initial pointer
  // sequence sometimes never fires. Touch events go first and are
  // honoured by every iOS WebView ever shipped.
  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 0) return
    startDrag(e.touches[0].clientX)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 5
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(Math.max(0, value - step))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(Math.min(100, value + step))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(100)
    }
  }

  const pct = Math.max(0, Math.min(100, value))

  return (
    <div
      ref={trackRef}
      className="music-slider"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      onKeyDown={onKeyDown}
    >
      <div className="music-slider__track" aria-hidden="true" />
      <div
        className="music-slider__fill"
        aria-hidden="true"
        style={{ width: `${pct}%` }}
      />
      <div
        className="music-slider__thumb"
        aria-hidden="true"
        style={{ left: `${pct}%` }}
      />
    </div>
  )
}
