import { useI18n } from '@/lib/i18n'

// ============================================================
//  ErrorScreen — calm fallback for fatal app errors
// ============================================================
//  Shared between two paths in App.tsx:
//    - useAuth() returns an error → render ErrorScreen
//    - ErrorBoundary catches a render-time exception → fallback
//
//  Also rendered standalone when the URL hash is `#preview-error`,
//  which is how the developer eyeballs this design without having
//  to provoke an actual failure.
//
//  Wordmark is KOKORO in caps with the 心 kanji aside it to the
//  right — same shape as the banner header, just larger and
//  centered in the screen.
// ============================================================

interface Props {
  /** Error text. Defaults to the localized "errorBoundary" message. */
  message?: string
  /** Optional retry callback — renders a primary button if provided. */
  onRetry?: () => void
}

export default function ErrorScreen({ message, onRetry }: Props) {
  const { t } = useI18n()
  return (
    <div className="error-stack" role="alert" aria-live="polite">
      <div className="error-brand">
        <span className="error-brand__word">KOKORO</span>
        <span className="error-brand__kanji" aria-hidden="true">
          心
        </span>
      </div>
      <p className="error-stack__message">{message ?? t.errorBoundary}</p>
      {onRetry && (
        <button
          type="button"
          className="primary-btn error-stack__retry"
          onClick={onRetry}
        >
          {t.errorRetry}
        </button>
      )}
    </div>
  )
}
