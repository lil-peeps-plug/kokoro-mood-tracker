import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

/**
 * Tiny email/password form shown ONLY in dev mode when the app is not
 * running inside Telegram. The form fires supabase.auth.signInWithPassword;
 * useAuth's onAuthStateChange picks up the resulting session.
 *
 * Build-time: this entire file is dead-code-eliminated from production
 * builds because the only place it's imported wraps it in
 * `import.meta.env.DEV && ...`.
 */
export default function DevLogin() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setSubmitting(false)
    if (signInError) setError(signInError.message)
  }

  return (
    <form className="dev-login" onSubmit={onSubmit}>
      <h2 className="dev-login__title">{t.devLoginTitle}</h2>
      <p className="dev-login__hint">{t.devLoginHint}</p>
      <label className="dev-login__field">
        <span>{t.devLoginEmail}</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="dev-login__field">
        <span>{t.devLoginPassword}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? t.devLoginSubmitting : t.devLoginSubmit}
      </button>
      {error && <p className="dev-login__error">{error}</p>}
    </form>
  )
}
