import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ADMIN_STATUS_ENDPOINT,
  SUPABASE_ANON_KEY,
  supabase,
} from '@/lib/supabase'
import MusicToggle from '@/components/MusicToggle'
import AdminLoading from './components/AdminLoading'
import AdminLogin from './views/AdminLogin'
import AdminDashboard from './views/AdminDashboard'
import './styles/admin.css'

// ============================================================
//  AdminApp — root of the /admin route
// ============================================================
//  On first paint we check two things in parallel — Supabase
//  session and admin-status — then settle into one of:
//
//    - admin session present → <AdminDashboard />
//    - no admin session      → <AdminLogin />
//
//  A non-admin session (e.g., a leftover Telegram user logged in
//  via the main app) is treated as "not signed in" here. We don't
//  sign them out — they may want to return to the main app.
//
//  The loading screen is held visible for at least MIN_LOADING_MS
//  so it has time to breathe. The whole page fades in over
//  --dur-slow once that window closes.
// ============================================================

const MIN_LOADING_MS = 1500

function isAdminSession(session: Session | null): session is Session {
  return session?.user?.app_metadata?.role === 'admin'
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [adminExists, setAdminExists] = useState<boolean>(true)
  const [checking, setChecking] = useState(true)
  const mountedAt = useRef(performance.now())

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    async function init() {
      const headers: HeadersInit = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      }
      const sessionPromise = supabase.auth.getSession()
      const statusPromise = fetch(ADMIN_STATUS_ENDPOINT, { method: 'GET', headers })
        .then(async (r) => {
          const body = (await r.json().catch(() => ({}))) as {
            adminExists?: boolean
          }
          return body
        })
        .catch(() => ({}) as { adminExists?: boolean })

      const [sessionResult, statusResult] = await Promise.all([
        sessionPromise,
        statusPromise,
      ])
      if (cancelled) return

      const s = isAdminSession(sessionResult.data.session)
        ? sessionResult.data.session
        : null
      const exists =
        typeof statusResult.adminExists === 'boolean'
          ? statusResult.adminExists
          : true // safer default: pretend admin exists rather than offer bootstrap

      const elapsed = performance.now() - mountedAt.current
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)

      timer = window.setTimeout(() => {
        if (cancelled) return
        setSession(s)
        setAdminExists(exists)
        setChecking(false)
      }, remaining)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return
      // After the initial check, session changes (sign-in / sign-out)
      // flip the UI immediately — no artificial delay.
      setSession(isAdminSession(s) ? s : null)
    })

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="admin">
      <div className="admin__backdrop" aria-hidden="true" />
      <MusicToggle />
      <header className="admin__header">
        <span className="admin__glow" aria-hidden="true" />
        <span className="admin__brand">
          <span className="admin__wordmark">KOKORO</span>
          <span className="admin__kanji" aria-hidden="true">
            心
          </span>
        </span>
        <span className="admin__subtitle">
          <span className="admin__subtitle-line" aria-hidden="true" />
          <span className="admin__subtitle-text">Admin Panel</span>
          <span className="admin__subtitle-line" aria-hidden="true" />
        </span>
        <span className="admin__divider" aria-hidden="true" />
      </header>

      <main className="admin__main">
        <div className="admin__swap" data-state={checking ? 'checking' : session ? 'dashboard' : 'login'}>
          {checking ? (
            <AdminLoading label="Connecting" />
          ) : session ? (
            <AdminDashboard session={session} />
          ) : (
            <AdminLogin adminExists={adminExists} onLogin={setSession} />
          )}
        </div>
      </main>
    </div>
  )
}
