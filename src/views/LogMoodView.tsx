import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

type Status = 'idle' | 'submitting' | 'saved' | 'error'
type Score = 1 | 2 | 3 | 4 | 5

const SCORES: readonly Score[] = [1, 2, 3, 4, 5]

export default function LogMoodView() {
  const { t } = useI18n()
  const [score, setScore] = useState<Score | null>(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2400)
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
          {status === 'submitting'
            ? t.logSaving
            : status === 'saved'
              ? t.logSaved
              : t.logSave}
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
