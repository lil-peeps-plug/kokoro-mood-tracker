import { useEffect } from 'react'
import { useI18n } from '@/lib/i18n'

// ============================================================
//  LegalModal — Privacy + Terms in one scrollable modal
// ============================================================
//  Opened from the About modal. Static English text (the full
//  policy lives in PRIVACY.md / TERMS.md at the repo root and
//  this is the in-app mirror). Labels around it are localized.
// ============================================================

interface Props {
  open: boolean
  onClose: () => void
}

const EXIT_MS = 480

export default function LegalModal({ open, onClose }: Props) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="legal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-title"
      onClick={onClose}
    >
      <div
        className="legal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="legal-card__head">
          <h2 id="legal-title" className="legal-card__title">
            {t.legalTitle}
          </h2>
          <p className="legal-card__sub">{t.legalUpdated} 2026-05-14</p>
        </header>

        <div className="legal-card__body">
          <section>
            <h3>Privacy notice</h3>
            <p>
              Kokoro is a small, private mood diary built for a circle of
              friends. It is not a commercial service.
            </p>

            <h4>What we collect</h4>
            <ul>
              <li>Your Telegram user ID, username, and first / last name (sent to us by Telegram when you open the Mini App)</li>
              <li>The mood scores (1–5) you choose</li>
              <li>Any short notes you write</li>
              <li>Timestamps of your entries</li>
              <li>Your chosen interface language (stored only in your browser)</li>
            </ul>
            <p>We do <strong>not</strong> collect profile photos, contacts, location, device sensors, or any browsing activity outside the app.</p>

            <h4>Where it is stored</h4>
            <ul>
              <li>Supabase PostgreSQL, EU region (Ireland)</li>
              <li>Row-Level Security: by default only you can read or write your own entries</li>
              <li>An administrator (Egor) has elevated access via a private admin panel</li>
            </ul>

            <h4>Third-party services</h4>
            <ul>
              <li><strong>Telegram WebApp SDK</strong> — sign-in</li>
              <li><strong>YouTube IFrame Player</strong> — ambient music. Subject to YouTube's Terms and Google's Privacy Policy. All audio rights belong to the respective owners; Kokoro claims none</li>
              <li><strong>Supabase</strong> — authentication, database, Edge Functions</li>
              <li><strong>Vercel</strong> — hosts the static frontend</li>
            </ul>

            <h4>Cookies &amp; local storage</h4>
            <p>Kokoro stores in your browser only: the Supabase session token, music preferences, selected language, and whether you've dismissed this welcome dialog. Clearing browser storage resets them.</p>

            <h4>Your rights</h4>
            <p>Message Egor on Telegram to see your data, delete some or all of your entries, or remove your account entirely.</p>

            <h4>Not medical advice</h4>
            <p>
              Kokoro is a personal reflection tool. Mood scores here are not
              diagnoses, and the app cannot replace professional support.
              If you are in crisis, please contact a qualified professional
              or a local crisis line:
            </p>
            <ul>
              <li>International — <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline.com</a></li>
              <li>EU 24/7 — 116 123</li>
              <li>United States — 988</li>
              <li>United Kingdom — 116 123</li>
            </ul>
          </section>

          <section>
            <h3>Terms of use</h3>
            <p>
              Kokoro is provided <strong>free of charge</strong> and
              <strong> as-is</strong>, with no warranty of any kind. It is
              intended for the invited members of a small private circle.
              You should be at least 13 years old (the Telegram minimum) —
              and 16 or older where local law (e.g. GDPR) requires it.
            </p>
            <p>Please don't try to access another user's entries, abuse the admin panel, or submit illegal, threatening, or harassing content.</p>
            <p>The author is not responsible for any loss of data, downtime, or damages arising from your use of the app.</p>
          </section>

          <section>
            <h3>Contact</h3>
            <p>For any privacy question or data request, message <strong>Egor</strong> on Telegram.</p>
          </section>
        </div>

        <footer className="legal-card__foot">
          <button
            type="button"
            className="primary-btn legal-card__close"
            onClick={onClose}
          >
            {t.legalDismiss}
          </button>
        </footer>
      </div>
    </div>
  )
}

// Re-export EXIT_MS so AboutModal could schedule fade-out if needed.
export { EXIT_MS as LEGAL_EXIT_MS }
