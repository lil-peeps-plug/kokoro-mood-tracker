import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

type Status = 'idle' | 'submitting' | 'saved' | 'error'
type Score = 1 | 2 | 3 | 4 | 5

const SCORES: readonly Score[] = [1, 2, 3, 4, 5]

function startOfTodayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function startOfTomorrow(): Date {
  const d = new Date()
  d.setHours(24, 0, 0, 0)
  return d
}

function formatCountdown(ms: number): string {
  const safe = Math.max(0, ms)
  const h = Math.floor(safe / 3_600_000)
  const m = Math.floor((safe / 60_000) % 60)
  const s = Math.floor((safe / 1000) % 60)
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':')
}

export default function LogMoodView() {
  const { t } = useI18n()
  const [score, setScore] = useState<Score | null>(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // null while we're still checking; true / false once Supabase replies.
  const [loggedToday, setLoggedToday] = useState<boolean | null>(null)
  const [countdown, setCountdown] = useState('')

  // Check whether the user already logged a mood today.
  useEffect(() => {
    let cancelled = false
    supabase
      .from('mood_entries')
      .select('id')
      .gte('created_at', startOfTodayISO())
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return
        setLoggedToday(!error && (data?.length ?? 0) > 0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Tick the HH:MM:SS countdown while we're on the "see you tomorrow"
  // screen. When the clock crosses midnight, the day-key flips so we
  // re-enable the form by clearing loggedToday.
  useEffect(() => {
    if (!loggedToday) return
    let tomorrow = startOfTomorrow().getTime()
    function tick() {
      const now = Date.now()
      const diff = tomorrow - now
      if (diff <= 0) {
        // Day rolled over — open the form back up and reset the target.
        setLoggedToday(false)
        tomorrow = startOfTomorrow().getTime()
        return
      }
      setCountdown(formatCountdown(diff))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [loggedToday])

  async function onSubmit() {
    if (score === null || status === 'submitting') return
    setStatus('submitting')
    setErrorMsg(null)

    const { error } = await supabase.from('mood_entries').insert({
      score,
      note: note.trim() ? note.trim() : null,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setStatus('saved')
    setScore(null)
    setNote('')
    // After this save the user has logged for today — flip the flag so
    // when the thank-you fades out, the "see you tomorrow" view takes
    // over rather than the empty form.
    setLoggedToday(true)
    // Longer than the old 2400 ms so the thank-you interlude is readable.
    window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 3600)
  }

  if (status === 'saved') {
    return (
      <section className="card mood-thanks-card" aria-label={t.logTitle}>
        <div className="mood-thanks" role="status" aria-live="polite">
          <span className="mood-thanks__kanji" aria-hidden="true">
            心
          </span>
          <h1 className="mood-thanks__title">{t.logThanksTitle}</h1>
          <p className="mood-thanks__body">{t.logThanksBody}</p>
          <p className="mood-thanks__reminder">{t.logThanksReminder}</p>
        </div>
      </section>
    )
  }

  if (loggedToday) {
    return (
      <section className="card mood-thanks-card" aria-label={t.logTitle}>
        <div className="mood-thanks" role="status" aria-live="polite">
          <span className="mood-thanks__kanji" aria-hidden="true">
            心
          </span>
          <h1 className="mood-thanks__title">{t.logAlreadyTitle}</h1>
          <p className="mood-thanks__body">{t.logAlreadyBody}</p>
          <span className="mood-thanks__countdown-label">
            {t.logCountdownLabel}
          </span>
          <span
            className="mood-thanks__countdown"
            aria-label={t.logCountdownLabel}
          >
            {countdown || '—'}
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className="card" aria-label={t.logTitle}>
      <header className="card__head">
        <h1 className="card__title">{t.logTitle}</h1>
        <p className="card__sub">{t.logSubtitle}</p>
      </header>

      <div className="mood-grid" role="radiogroup" aria-label={t.logTitle}>
        {SCORES.map((n) => {
          const selected = score === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n} — ${t.logScoreLabels[n]}`}
              className={`mood-btn${selected ? ' is-active' : ''}`}
              onClick={() => setScore(n)}
            >
              <span className="mood-btn__num">{n}</span>
            </button>
          )
        })}
      </div>

      <p
        className="mood-grid__label"
        aria-live="polite"
        data-empty={score === null ? 'true' : 'false'}
      >
        {score === null ? t.logPick : t.logScoreLabels[score]}
      </p>

      <label className="mood-note">
        <textarea
          className="mood-note__input"
          placeholder={t.logNotePlaceholder}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          maxLength={280}
          rows={3}
        />
        <span className="mood-note__count">{note.length}/280</span>
      </label>

      <div className="card__footer">
        <button
          type="button"
          className="primary-btn"
          disabled={score === null || status === 'submitting'}
          onClick={onSubmit}
          data-status={status}
        >
          {status === 'submitting' ? t.logSaving : t.logSave}
        </button>
        {status === 'error' && errorMsg && (
          <p className="card__error" role="alert">
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  )
}
