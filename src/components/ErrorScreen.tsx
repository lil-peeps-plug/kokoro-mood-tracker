import WebApp from '@twa-dev/sdk'
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
  const diag = collectTelegramDiagnostics()
  return (
    <div className="error-stack" role="alert" aria-live="polite">
      <div className="error-brand">
        <span className="error-brand__word">KOKORO</span>
        <span className="error-brand__kanji" aria-hidden="true">
          心
        </span>
      </div>
      <p className="error-stack__message">{message ?? t.errorBoundary}</p>
      <pre
        style={{
          textAlign: 'left',
          fontSize: '11px',
          lineHeight: 1.4,
          maxWidth: '320px',
          margin: '16px auto 0',
          padding: '12px',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '8px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {diag}
      </pre>
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

function collectTelegramDiagnostics(): string {
  try {
    const sdk = WebApp as unknown as {
      initData?: string
      version?: string
      platform?: string
      initDataUnsafe?: { user?: { id?: number; username?: string } }
    }
    const native = (
      typeof window !== 'undefined'
        ? (window as { Telegram?: { WebApp?: typeof sdk } }).Telegram?.WebApp
        : undefined
    ) as typeof sdk | undefined

    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
    const tgWebAppDataRaw = hashParams.get('tgWebAppData')

    const sdkInitData = sdk.initData ?? ''
    const nativeInitData = native?.initData ?? ''

    return [
      `href: ${typeof window !== 'undefined' ? window.location.href.slice(0, 80) : 'n/a'}`,
      `hash.tgWebAppData.len: ${tgWebAppDataRaw?.length ?? 0}`,
      `hash.tgWebAppPlatform: ${hashParams.get('tgWebAppPlatform') ?? '(none)'}`,
      `hash.tgWebAppVersion: ${hashParams.get('tgWebAppVersion') ?? '(none)'}`,
      `--- SDK (@twa-dev/sdk) ---`,
      `sdk.platform: ${sdk.platform ?? '(none)'}`,
      `sdk.version: ${sdk.version ?? '(none)'}`,
      `sdk.initData.len: ${sdkInitData.length}`,
      `sdk.user.id: ${sdk.initDataUnsafe?.user?.id ?? '(none)'}`,
      `--- native (window.Telegram.WebApp) ---`,
      `native present: ${native ? 'yes' : 'no'}`,
      `native.platform: ${native?.platform ?? '(none)'}`,
      `native.version: ${native?.version ?? '(none)'}`,
      `native.initData.len: ${nativeInitData.length}`,
      `native.user.id: ${native?.initDataUnsafe?.user?.id ?? '(none)'}`,
      `ua: ${typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 90) : 'n/a'}`,
    ].join('\n')
  } catch (e) {
    return `diag failed: ${e instanceof Error ? e.message : String(e)}`
  }
}
