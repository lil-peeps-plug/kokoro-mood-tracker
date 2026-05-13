import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  AUTH_TELEGRAM_ENDPOINT,
  SUPABASE_ANON_KEY,
  supabase,
} from '@/lib/supabase'
import { getInitData, isInTelegram } from '@/lib/telegram'

export interface AuthState {
  /** True while the initial auth flow is in flight. */
  loading: boolean
  /** Human-readable error message if auth failed. */
  error: string | null
  /** Active session, or null if not signed in. */
  session: Session | null
  /**
   * True when we're running locally and outside Telegram. UI can render
   * a dev login form in this case. Always false in production builds.
   */
  needsDevLogin: boolean
}

/**
 * Runs the Telegram → Supabase auth flow once on mount, and stays
 * subscribed to Supabase auth state changes for the lifetime of the
 * component. Designed to be used at the root of <App />.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    error: null,
    session: null,
    needsDevLogin: false,
  })

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        // 1. Reuse an existing session if Supabase already has one in
        //    localStorage. Avoids hitting the Edge Function every reload.
        const { data: existing } = await supabase.auth.getSession()
        if (existing.session) {
          if (!cancelled) {
            setState({
              loading: false,
              error: null,
              session: existing.session,
              needsDevLogin: false,
            })
          }
          return
        }

        // 2. Fresh login. Telegram path or dev fallback.
        if (isInTelegram()) {
          await loginViaTelegram()
        } else if (import.meta.env.DEV) {
          // Surface the dev login form. The form itself calls
          // supabase.auth.signInWithPassword, which fires
          // onAuthStateChange below and updates state.
          if (!cancelled) {
            setState({
              loading: false,
              error: null,
              session: null,
              needsDevLogin: true,
            })
          }
          return
        } else {
          throw new Error('This app must be opened inside Telegram.')
        }

        const { data: fresh } = await supabase.auth.getSession()
        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            session: fresh.session,
            needsDevLogin: false,
          })
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setState({
          loading: false,
          error: message,
          session: null,
          needsDevLogin: false,
        })
      }
    }

    run()

    // Keep state in sync with token refreshes, manual signOut, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setState((prev) => ({
        ...prev,
        session,
        // If we got a session, we're definitely past the dev-login screen.
        needsDevLogin: session ? false : prev.needsDevLogin,
        loading: false,
      }))
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}

// --- Internals -----------------------------------------------------------

async function loginViaTelegram(): Promise<void> {
  const initData = getInitData()
  if (!initData) throw new Error('Telegram initData is missing')

  const res = await fetch(AUTH_TELEGRAM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ initData }),
  })

  const payload = (await res.json().catch(() => ({}))) as {
    email?: string
    hashed_token?: string
    error?: string
  }

  if (!res.ok) {
    throw new Error(payload.error ?? `Login failed (HTTP ${res.status})`)
  }
  if (!payload.email || !payload.hashed_token) {
    throw new Error('Edge Function returned an incomplete response.')
  }

  // Exchange the magic-link token for a real Supabase session.
  // verifyOtp writes the session into localStorage on success.
  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: payload.hashed_token,
    type: 'magiclink',
  })
  if (otpError) {
    throw new Error(`verifyOtp failed: ${otpError.message}`)
  }
}
