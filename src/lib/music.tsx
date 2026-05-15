import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// ============================================================
//  Kokoro — background music via YouTube IFrame API
//  ----------------------------------------------------------
//  Streams a YouTube video in a hidden iframe, exposing
//  play / pause / state through the IFrame API. Because the
//  audio is cross-origin and inside an iframe, we cannot attach
//  Web Audio AnalyserNode — the SoundVisualizer is synthetic
//  (time-driven sine bars) when this provider is used.
//
//  User's enabled/disabled preference is persisted to
//  localStorage. Autoplay still requires a user gesture; we
//  attempt playback on first pointerdown/keydown.
// ============================================================

const VIDEO_ID = 'xORCbIptqcc'
const STORAGE_KEY = 'kokoro:music'
const VOLUME_KEY = 'kokoro:volume'
const DEFAULT_VOLUME = 14 // 0–100 in YT API. Intentionally quiet so it
                          // pairs with the splash without overwhelming.

interface MusicValue {
  ready: boolean
  playing: boolean
  enabled: boolean
  /** Current volume, 0–100. Reflects YT's volume scale directly. */
  volume: number
  toggle: () => void
  setVolume: (v: number) => void
}

const MusicContext = createContext<MusicValue | null>(null)

// Minimal YT global typings — keeps the rest of the file ts-clean.
interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  setVolume: (v: number) => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  destroy?: () => void
}
interface YTPlayerEvent {
  data: number
}
interface YTPlayerConstructor {
  new (
    target: HTMLElement | string,
    options: {
      videoId: string
      width?: number | string
      height?: number | string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: () => void
        onStateChange?: (e: YTPlayerEvent) => void
      }
    },
  ): YTPlayer
}
type YTGlobal = { Player: YTPlayerConstructor }

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
    YT?: YTGlobal
  }
}

let apiPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise
  apiPromise = new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      resolve()
      return
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    document.head.appendChild(script)
  })
  return apiPromise
}

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function readVolume(): number {
  try {
    const raw = window.localStorage.getItem(VOLUME_KEY)
    if (raw === null) return DEFAULT_VOLUME
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n
  } catch {
    /* fall through */
  }
  return DEFAULT_VOLUME
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [enabled, setEnabled] = useState(readEnabled)
  const [volume, setVolumeState] = useState<number>(readVolume)

  // Create the YT player once.
  // Strategy for music-on-splash: we ask YT to autoplay MUTED. Browsers
  // (and Telegram WebView) allow muted autoplay without a user gesture,
  // so the video starts spinning right away. On the first real
  // interaction we unmute, and the audience hears the track. The play
  // toggle reflects audible state.
  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then(() => {
      if (cancelled || !mountRef.current || !window.YT) return
      const player = new window.YT.Player(mountRef.current, {
        videoId: VIDEO_ID,
        width: 0,
        height: 0,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: VIDEO_ID, // loop=1 requires `playlist` to be set
          controls: 0,
          modestbranding: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return
            playerRef.current = player
            try {
              // Zero the volume BEFORE unmuting so we don't blip at
              // YT's default (often 100) for a frame. Then unmute +
              // play silently, then ramp up to our target volume.
              // Same pattern as the toggle path uses for switching on.
              player.setVolume(0)
              player.unMute()
              player.playVideo()
              if (wantsAudibleRef.current && enabled) {
                player.unMute()
              }
              fadeVolume(0, volume, 900)
            } catch {
              /* swallow — some webviews are picky */
            }
            setReady(true)
          },
          onStateChange: (e) => {
            if (cancelled) return
            // YT.PlayerState: UNSTARTED -1, ENDED 0, PLAYING 1, PAUSED 2,
            // BUFFERING 3, CUED 5. Map "playing" to PLAYING and BUFFERING.
            setPlaying(e.data === 1 || e.data === 3)
          },
        },
      })
    })
    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy?.()
      } catch {
        /* destroy can race; safe to ignore */
      }
    }
  }, [])

  // First user gesture handler. Attached on mount (NOT waiting for
  // YT to be ready), so any tap during the splash counts as the
  // gesture browsers require for audible playback. If the player
  // exists at click time we unmute right then; otherwise the flag
  // is left and YT's onReady will pick it up the moment it fires.
  const wantsAudibleRef = useRef(false)
  useEffect(() => {
    let done = false
    const onInteract = () => {
      if (done) return
      done = true
      wantsAudibleRef.current = true
      const p = playerRef.current
      if (!p) return
      try {
        if (enabled) {
          p.unMute()
          p.playVideo()
        }
      } catch {
        /* swallow */
      }
    }
    document.addEventListener('pointerdown', onInteract, { once: true })
    document.addEventListener('keydown', onInteract, { once: true })
    return () => {
      document.removeEventListener('pointerdown', onInteract)
      document.removeEventListener('keydown', onInteract)
    }
  }, [enabled])

  // Linear volume ramp over `duration` ms. Used to fade in/out the
  // YouTube track so toggling music doesn't feel like a hard cut.
  const fadeRafRef = useRef<number | null>(null)
  const fadeVolume = useCallback(
    (
      from: number,
      to: number,
      duration: number,
      onDone?: () => void,
    ) => {
      const p = playerRef.current
      if (!p) {
        onDone?.()
        return
      }
      if (fadeRafRef.current !== null) {
        cancelAnimationFrame(fadeRafRef.current)
        fadeRafRef.current = null
      }
      const startTime = performance.now()
      const step = () => {
        const t = Math.min(1, (performance.now() - startTime) / duration)
        const v = Math.round(from + (to - from) * t)
        try {
          p.setVolume(v)
        } catch {
          /* swallow */
        }
        if (t < 1) {
          fadeRafRef.current = requestAnimationFrame(step)
        } else {
          fadeRafRef.current = null
          onDone?.()
        }
      }
      fadeRafRef.current = requestAnimationFrame(step)
    },
    [],
  )

  const toggle = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (playing) {
      // Fade volume to 0, then pause. Restore the user's volume after
      // pausing so the next play-on resumes at the same level.
      setEnabled(false)
      try {
        window.localStorage.setItem(STORAGE_KEY, 'off')
      } catch {
        /* localStorage blocked */
      }
      const restoreTo = volume
      fadeVolume(volume, 0, 900, () => {
        try {
          p.pauseVideo()
          p.setVolume(restoreTo)
        } catch {
          /* swallow */
        }
      })
    } else {
      setEnabled(true)
      try {
        window.localStorage.setItem(STORAGE_KEY, 'on')
      } catch {
        /* localStorage blocked */
      }
      try {
        // Zero the volume BEFORE unmuting so we never briefly play at
        // the previous (potentially loud) level. Then unmute + play,
        // then ramp up smoothly. Avoids the "disappears for a sec"
        // blip where the first frame was audible before the silence.
        p.setVolume(0)
        p.unMute()
        p.playVideo()
      } catch {
        /* swallow */
      }
      fadeVolume(0, volume, 900)
    }
  }, [playing, volume, fadeVolume])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    setVolumeState(clamped)
    try {
      playerRef.current?.setVolume(clamped)
      // Volume > 0 implies the listener wants audio; make sure we're unmuted.
      if (clamped > 0) playerRef.current?.unMute()
    } catch {
      /* swallow */
    }
    try {
      window.localStorage.setItem(VOLUME_KEY, String(clamped))
    } catch {
      /* localStorage blocked */
    }
  }, [])

  const value = useMemo<MusicValue>(
    () => ({ ready, playing, enabled, volume, toggle, setVolume }),
    [ready, playing, enabled, volume, toggle, setVolume],
  )

  return (
    <MusicContext.Provider value={value}>
      {/* Hidden mount point for the YouTube iframe. Absolutely positioned
          off-screen with zero size so it never affects layout. */}
      <div
        ref={mountRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          width: 0,
          height: 0,
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          left: 0,
          top: 0,
        }}
      />
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic(): MusicValue {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used inside <MusicProvider>')
  return ctx
}
