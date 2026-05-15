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

  const setFromEvent = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      if (rect.width <= 0) return
      const ratio = (clientX - rect.left) / rect.width
      const clamped = Math.min(1, Math.max(0, ratio))
      onChange(Math.round(clamped * 100))
    },
    [onChange],
  )

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromEvent(e.clientX)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    setFromEvent(e.clientX)
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
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
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
