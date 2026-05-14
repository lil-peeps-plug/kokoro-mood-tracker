import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ADMIN_BOOTSTRAP_ENDPOINT,
  SUPABASE_ANON_KEY,
  supabase,
} from '@/lib/supabase'

// ============================================================
//  AdminLogin — bootstrap on first visit, sign-in otherwise
// ============================================================
//  Mode is decided by the parent (AdminApp) using admin-status:
//    adminExists = false → render the bootstrap form (pick a password)
//    adminExists = true  → render the sign-in form (enter your password)
//
//  Username field is fixed to "master" (the only admin identity).
// ============================================================

const ADMIN_EMAIL = 'master@kokoro.local'
const ADMIN_USERNAME = 'master'
const MIN_PASSWORD = 8

interface Props {
  adminExists: boolean
  onLogin: (session: Session) => void
}

function anonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  }
}

export default function AdminLogin({ adminExists, onLogin }: Props) {
  const isBootstrap = !adminExists
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Any keystroke in the form should clear a previous error so the
  // message doesn't linger after the user starts correcting it.
  function handlePasswordChange(v: string) {
    setPassword(v)
    if (error) setError(null)
  }
  function handleConfirmChange(v: string) {
    setConfirmPassword(v)
    if (error) setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      if (isBootstrap) {
        if (password.length < MIN_PASSWORD) {
          throw new Error(`Password must be at least ${MIN_PASSWORD} characters`)
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        const res = await fetch(ADMIN_BOOTSTRAP_ENDPOINT, {
          method: 'POST',
          headers: anonHeaders(),
          body: JSON.stringify({
            username: ADMIN_USERNAME,
            password,
          }),
        })
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          error?: string
        }
        if (!res.ok || !body.ok) {
          throw new Error(body.error ?? `Bootstrap failed (${res.status})`)
        }
      }

      // Whether we just bootstrapped or this is a return visit, sign in
      // with the master credentials. signInWithPassword writes the session
      // into localStorage; AdminApp's onAuthStateChange handles the rest.
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      })
      if (signInErr) throw new Error(signInErr.message)
      if (!data.session) throw new Error('No session returned by Supabase')

      // Force-refresh so the new JWT carries the freshest app_metadata
      // (incl. role:'admin' for a just-bootstrapped account). Without
      // this, a stale token can hit RLS as a non-admin and trip a
      // "permission denied" on the dashboard's first query.
      const { data: refreshed } = await supabase.auth.refreshSession()
      onLogin(refreshed.session ?? data.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const title = isBootstrap ? 'Set up admin' : 'Sign in'
  const hint = isBootstrap
    ? 'No admin exists yet. Pick a password — you’ll use it every time you visit /admin.'
    : 'Enter your master password to continue.'
  const cta = submitting
    ? isBootstrap
      ? 'Creating…'
      : 'Signing in…'
    : isBootstrap
      ? 'Create admin'
      : 'Sign in'

  return (
    <form className="admin__login" onSubmit={onSubmit} noValidate>
      <h1 className="admin__login-title">{title}</h1>
      <p className="admin__login-hint">{hint}</p>

      <div className="admin__field">
        <label className="admin__label" htmlFor="admin-username">
          Username
        </label>
        <input
          id="admin-username"
          className="admin__input"
          type="text"
          value={ADMIN_USERNAME}
          readOnly
          autoComplete="username"
          aria-readonly="true"
        />
      </div>

      <div className="admin__field">
        <label className="admin__label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          className="admin__input"
          type="password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          autoComplete={isBootstrap ? 'new-password' : 'current-password'}
          autoFocus
          minLength={isBootstrap ? MIN_PASSWORD : undefined}
        />
      </div>

      {isBootstrap && (
        <div className="admin__field">
          <label className="admin__label" htmlFor="admin-password-confirm">
            Confirm password
          </label>
          <input
            id="admin-password-confirm"
            className="admin__input"
            type="password"
            value={confirmPassword}
            onChange={(e) => handleConfirmChange(e.target.value)}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
          />
        </div>
      )}

      <button
        type="submit"
        className="admin__submit"
        disabled={submitting || password.length === 0}
      >
        {cta}
      </button>

      {error && (
        <p className="admin__error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
