import { useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import { MOOD_UPDATED_EVENT } from '@/hooks/useMoodEntries'

type Slot = 'morning' | 'afternoon' | 'night'
type Status = 'idle' | 'submitting' | 'error'
type Score = 1 | 2 | 3 | 4 | 5

const SCORES: readonly Score[] = [1, 2, 3, 4, 5]
const SLOTS: readonly Slot[] = ['morning', 'afternoon', 'night']

interface SlotEntry {
  id: string
  slot: Slot
  score: Score
  note: string | null
}

const SLOT_ICONS: Record<Slot, ReactNode> = {
  // Sun rising over a horizon — morning.
  morning: (
    <svg
      viewBox="0 0 32 32"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="22" x2="28" y2="22" />
      <path d="M 9 22 A 7 7 0 0 1 23 22" />
      <line x1="16" y1="9" x2="16" y2="5" />
      <line x1="7" y1="13" x2="4" y2="10" />
      <line x1="25" y1="13" x2="28" y2="10" />
    </svg>
  ),
  // Full sun with rays — afternoon.
  afternoon: (
    <svg
      viewBox="0 0 32 32"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="5" />
      <line x1="16" y1="3" x2="16" y2="6" />
      <line x1="16" y1="26" x2="16" y2="29" />
      <line x1="3" y1="16" x2="6" y2="16" />
      <line x1="26" y1="16" x2="29" y2="16" />
      <line x1="7" y1="7" x2="9" y2="9" />
      <line x1="23" y1="23" x2="25" y2="25" />
      <line x1="7" y1="25" x2="9" y2="23" />
      <line x1="23" y1="9" x2="25" y2="7" />
    </svg>
  ),
  // Crescent moon — night.
  night: (
    <svg
      viewBox="0 0 32 32"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M 23 6 A 11 11 0 1 0 26 23 A 9 9 0 0 1 23 6 Z" />
    </svg>
  ),
}

function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Slot windows for the auto-open hint only. Users can fill any slot at
// any time of day — these bounds just pick which one to open first.
function currentSlot(d: Date = new Date()): Slot {
  const h = d.getHours()
  if (h >= 4 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  return 'night'
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

// Duration of the banner→countdown morph animation. Kept in sync with
// the @keyframes step on .mood-thanks-card[data-arrival="from-banner"]
// in base.css. If you tweak one, tweak the other.
const ARRIVAL_ANIM_MS = 1100

export default function LogMoodView() {
  const { t } = useI18n()
  const today = localDateString()
  // null while initial fetch is in flight; Map afterwards (possibly empty).
  const [entries, setEntries] = useState<Map<Slot, SlotEntry> | null>(null)
  // True only on the *first* render after the initial fetch found every
  // slot already filled — drives the one-shot "banner logo flies down
  // into the countdown card" animation. We never re-trigger it within
  // the same session, even if the user toggles tabs or saves and the
  // countdown re-renders.
  const [arrivingFromBanner, setArrivingFromBanner] = useState(false)
  const didArrivalAnimRef = useRef(false)
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)
  const [score, setScore] = useState<Score | null>(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  // Two display modes for the editor of an active slot:
  //   editing = true  → score buttons + note are interactive, Save / Update button
  //   editing = false → score and note frozen at last-saved values, Edit button
  // A freshly-tapped empty slot starts editing=true; a slot with an
  // existing entry starts locked. After a successful save we drop back
  // into the locked state so the user can confirm what was stored.
  const [editing, setEditing] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('')

  // Initial load — today's slot rows, RLS filters to current user.
  useEffect(() => {
    let cancelled = false
    supabase
      .from('mood_entries')
      .select('id, slot, score, note')
      .eq('entry_date', today)
      .not('slot', 'is', null)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setEntries(new Map())
          return
        }
        const map = new Map<Slot, SlotEntry>()
        for (const row of data as Array<{
          id: string
          slot: Slot
          score: Score
          note: string | null
        }>) {
          map.set(row.slot, row)
        }
        setEntries(map)
        // First-load-all-filled? Kick off the one-shot banner-to-card
        // morph animation. didArrivalAnimRef gates it so the animation
        // never replays within the same session.
        if (
          !didArrivalAnimRef.current &&
          SLOTS.every((s) => map.has(s))
        ) {
          didArrivalAnimRef.current = true
          setArrivingFromBanner(true)
        }
        // Auto-open the slot for the current time of day, unless it's
        // already filled or every slot is done.
        const cur = currentSlot()
        if (!map.has(cur) && map.size < SLOTS.length) {
          setActiveSlot(cur)
          setScore(null)
          setNote('')
          setEditing(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [today])

  const allFilled = entries !== null && SLOTS.every((s) => entries.has(s))

  // When the arrival animation is active, the body wears
  // `kokoro-arriving-from-banner` so the banner's KOKORO + 心 fade out
  // and the countdown kanji animates up from the banner's vertical
  // band. Removed after the animation completes.
  useEffect(() => {
    if (!arrivingFromBanner) return
    document.body.classList.add('kokoro-arriving-from-banner')
    const id = window.setTimeout(() => {
      setArrivingFromBanner(false)
      document.body.classList.remove('kokoro-arriving-from-banner')
    }, ARRIVAL_ANIM_MS)
    return () => {
      window.clearTimeout(id)
      document.body.classList.remove('kokoro-arriving-from-banner')
    }
  }, [arrivingFromBanner])

  // While every slot for today is filled, the countdown view is the
  // user's whole world — the banner's KOKORO + 心 wordmark is
  // redundant (the big 心 in the card IS the logo for now). Toggle a
  // body class so the banner can hide its wordmark in CSS.
  useEffect(() => {
    if (allFilled) {
      document.body.classList.add('kokoro-all-filled')
      return () => document.body.classList.remove('kokoro-all-filled')
    }
  }, [allFilled])

  // Midnight countdown when all 3 slots are filled.
  useEffect(() => {
    if (!allFilled) return
    let tomorrow = startOfTomorrow().getTime()
    function tick() {
      const now = Date.now()
      const diff = tomorrow - now
      if (diff <= 0) {
        // Day rolled over — clear today's map. The `today` value
        // recomputed on the next render triggers the fetch effect.
        setEntries(new Map())
        tomorrow = startOfTomorrow().getTime()
        return
      }
      setCountdown(formatCountdown(diff))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [allFilled])

  function openSlot(slot: Slot) {
    setActiveSlot(slot)
    const existing = entries?.get(slot)
    setScore(existing?.score ?? null)
    setNote(existing?.note ?? '')
    setStatus('idle')
    setErrorMsg(null)
    // Existing entry → start locked (show the saved values + Edit button).
    // Empty slot → start editable so the user can pick a score right away.
    setEditing(!existing)
  }

  function startEditing() {
    setEditing(true)
    setStatus('idle')
    setErrorMsg(null)
  }


  async function onSubmit() {
    if (!activeSlot || score === null || status === 'submitting') return
    setStatus('submitting')
    setErrorMsg(null)

    const trimmedNote = note.trim() ? note.trim() : null

    const { data, error } = await supabase
      .from('mood_entries')
      .upsert(
        {
          slot: activeSlot,
          entry_date: today,
          score,
          note: trimmedNote,
        },
        { onConflict: 'user_id,entry_date,slot' },
      )
      .select('id, slot, score, note')
      .single()

    if (error || !data) {
      setStatus('error')
      setErrorMsg(error?.message ?? 'Save failed')
      return
    }

    // Update local state and drop straight into the locked view. The
    // Save button's own opacity transition (~480 ms) carries the
    // success feedback — no green flash, no checkmark text, just a
    // calm fade to inactive.
    setEntries((prev) => {
      const next = new Map(prev ?? new Map<Slot, SlotEntry>())
      next.set(activeSlot, data as SlotEntry)
      return next
    })
    setStatus('idle')
    setEditing(false)
    // Signal the stats hook (already mounted in StatsView under the
    // crossfade) to refetch — without this, the user has to flip the
    // range filter for new entries to appear in the charts.
    window.dispatchEvent(new Event(MOOD_UPDATED_EVENT))
  }

  if (entries === null) {
    return (
      <section
        key="log-loading"
        className="card"
        aria-busy="true"
        aria-label={t.logTitle}
      >
        <header className="card__head">
          <h1 className="card__title">{t.logTitle}</h1>
          <p className="card__sub">{t.logSubtitle}</p>
        </header>
      </section>
    )
  }

  if (allFilled) {
    return (
      <section
        key="log-thanks"
        className="card mood-thanks-card"
        data-arrival={arrivingFromBanner ? 'from-banner' : undefined}
        aria-label={t.logTitle}
      >
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

  const activeEntry = activeSlot ? entries.get(activeSlot) ?? null : null

  return (
    <section key="log-picker" className="card" aria-label={t.logTitle}>
      <header className="card__head">
        <h1 className="card__title">{t.logTitle}</h1>
        <p className="card__sub">{t.logSubtitle}</p>
      </header>

      <div
        className="slot-picker"
        role="radiogroup"
        aria-label={t.logTitle}
      >
        {SLOTS.map((slot) => {
          const filledEntry = entries.get(slot) ?? null
          const isActive = activeSlot === slot
          const filled = filledEntry !== null
          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={
                filledEntry
                  ? `${t.slotLabels[slot]} — ${filledEntry.score} ${t.logScoreLabels[filledEntry.score]}`
                  : t.slotLabels[slot]
              }
              className={
                'slot-pick-btn' +
                (isActive ? ' is-active' : '') +
                (filled ? ' is-filled' : '')
              }
              onClick={() => openSlot(slot)}
            >
              <span className="slot-pick-btn__icon">{SLOT_ICONS[slot]}</span>
              <span className="slot-pick-btn__label">
                {t.slotLabels[slot]}
              </span>
              {filled && (
                <span
                  className="slot-pick-btn__badge"
                  aria-hidden="true"
                >
                  {filledEntry.score}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeSlot && (
        <div className={`slot-editor${editing ? '' : ' is-locked'}`}>
          <div
            className="mood-grid"
            role="radiogroup"
            aria-label={t.slotLabels[activeSlot]}
          >
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
                  disabled={!editing}
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
              readOnly={!editing}
            />
            <span className="mood-note__count">{note.length}/280</span>
          </label>

          <div className="slot-actions">
            <button
              type="button"
              className="primary-btn"
              disabled={
                !editing || score === null || status === 'submitting'
              }
              onClick={onSubmit}
            >
              {/* Keyed span — when the verb changes (e.g. "Save mood"
                  → "Update mood" after the first save) the new label
                  remounts and fades in. No "Saving…" intermediate
                  label; the dimming of the button itself carries the
                  in-flight feedback. */}
              <span
                key={activeEntry ? 'update' : 'save'}
                className="primary-btn__label"
              >
                {activeEntry ? t.logUpdate : t.logSave}
              </span>
            </button>

            {activeEntry && (
              <button
                type="button"
                className="slot-edit-link"
                disabled={editing}
                onClick={startEditing}
              >
                {t.logEdit}
              </button>
            )}
          </div>

          {status === 'error' && errorMsg && (
            <p className="card__error" role="alert">
              {errorMsg}
            </p>
          )}
        </div>
      )}

    </section>
  )
}
