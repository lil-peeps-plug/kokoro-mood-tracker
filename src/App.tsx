import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import AboutModal from '@/components/AboutModal'
import Banner from '@/components/Banner'
import DedicationTicker from '@/components/DedicationTicker'
import ErrorBoundary from '@/components/ErrorBoundary'
import LanternGlow from '@/components/LanternGlow'
import LoadingScreen from '@/components/LoadingScreen'
import SakuraCanvas from '@/components/SakuraCanvas'
import SoundVisualizer from '@/components/SoundVisualizer'
import TabBar, { type TabKey } from '@/components/TabBar'
import LogMoodView from '@/views/LogMoodView'
import StatsView from '@/views/StatsView'

// Dev login is only built into dev. In production builds the ternary is
// a constant-false branch and Vite removes the dynamic import.
const DevLogin = import.meta.env.DEV
  ? lazy(() => import('@/components/DevLogin'))
  : null

// Splash sequence (ms after mount):
//   0–600   blank
//   600     kanji begins fading in
//   1400    wordmark begins fading in
//   2400    quote begins fading in
//   2700    wordmark fully visible
//   3000    stack starts drifting upward (2200 ms, ends 5200)
//   3700    quote fully visible (drift already in progress)
//   4000    splash background begins fading (1500 ms, gone at 5500)
const MIN_SPLASH_MS = 4000
// Matches the CSS opacity transition on .loading.
const SPLASH_FADE_MS = 1500

export default function App() {
  const { loading, error, session, needsDevLogin } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState<TabKey>('log')

  // Three-phase splash: visible → exiting (fading) → unmounted.
  const [splash, setSplash] = useState<'visible' | 'exiting' | 'done'>(
    'visible',
  )

  useEffect(() => {
    if (splash === 'done') return
    // Wait for auth to resolve AND a minimum on-screen time before fading.
    if (loading) return
    const startElapsed = performance.now() - mountedAt
    const remaining = Math.max(0, MIN_SPLASH_MS - startElapsed)
    const fadeT = window.setTimeout(() => setSplash('exiting'), remaining)
    return () => window.clearTimeout(fadeT)
  }, [loading, splash])

  useEffect(() => {
    if (splash !== 'exiting') return
    const t = window.setTimeout(() => setSplash('done'), SPLASH_FADE_MS)
    return () => window.clearTimeout(t)
  }, [splash])

  return (
    <ErrorBoundary
      fallback={(reset) => (
        <Shell>
          <Centered>
            <div className="app-stack">
              <h1 className="app-title">Kokoro</h1>
              <p className="app-status app-status--error">{t.errorBoundary}</p>
              <button type="button" className="primary-btn" onClick={reset}>
                {t.errorRetry}
              </button>
            </div>
          </Centered>
        </Shell>
      )}
    >
      {renderApp({
        loading,
        error,
        session,
        needsDevLogin,
        tab,
        setTab,
        loadingLabel: t.loading,
      })}
      {/* About modal appears once the splash is gone and the user is signed in.
          First-run only by default; the dialog persists its own "don't show
          again" preference to localStorage. */}
      {splash === 'done' && session && <AboutModal />}
      {splash !== 'done' && <LoadingScreen exiting={splash === 'exiting'} />}
    </ErrorBoundary>
  )
}

// Record when App first mounted so we can compute remaining splash time
// even if React schedules the effect a few frames later.
const mountedAt = performance.now()

interface RenderArgs {
  loading: boolean
  error: string | null
  session: unknown
  needsDevLogin: boolean
  tab: TabKey
  setTab: (t: TabKey) => void
  loadingLabel: string
}

function renderApp({
  error,
  session,
  needsDevLogin,
  tab,
  setTab,
  loadingLabel,
}: RenderArgs) {
  if (error) {
    return (
      <Shell>
        <Centered>
          <div className="app-stack">
            <h1 className="app-title">Kokoro</h1>
            <p className="app-status app-status--error">{error}</p>
          </div>
        </Centered>
      </Shell>
    )
  }

  if (needsDevLogin && DevLogin) {
    return (
      <Shell>
        <Centered>
          <Suspense fallback={<p className="app-status">{loadingLabel}</p>}>
            <DevLogin />
          </Suspense>
        </Centered>
      </Shell>
    )
  }

  if (!session) {
    return (
      <Shell>
        <Centered>
          <p className="app-status">{loadingLabel}</p>
        </Centered>
      </Shell>
    )
  }

  return (
    <Shell>
      <header className="topbar">
        <Banner />
        <DedicationTicker />
      </header>
      <div className="viewstack">
        <div className={`view${tab === 'log' ? ' is-active' : ''}`}>
          <LogMoodView />
        </div>
        <div className={`view${tab === 'stats' ? ' is-active' : ''}`}>
          <StatsView />
        </div>
      </div>
      <SoundVisualizer />
      <TabBar active={tab} onChange={setTab} />
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <div className="app__bg" aria-hidden="true" />
      <div className="app__scrim" aria-hidden="true" />
      <LanternGlow />
      <SakuraCanvas />
      <div className="app__content">{children}</div>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="app__center">{children}</div>
}
