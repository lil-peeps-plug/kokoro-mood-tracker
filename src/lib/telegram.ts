import WebApp from '@twa-dev/sdk'

// Thin wrapper around the Telegram WebApp SDK.
// The SDK is "safe" outside Telegram — it returns empty strings and
// no-op methods — so we don't need try/catch around basic access.

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

let didReady = false

/**
 * Idempotently calls Telegram.WebApp.ready() and expand().
 * Safe to call multiple times and safe outside Telegram (no-op).
 */
export function initTelegram(): void {
  if (didReady) return
  try {
    WebApp.ready()
    WebApp.expand()
  } catch {
    // Outside Telegram or stubbed environment — nothing to do.
  }
  didReady = true
}

/**
 * True if we're running inside a real Telegram WebApp container
 * (i.e. initData is present and non-empty).
 */
export function isInTelegram(): boolean {
  initTelegram()
  return typeof WebApp.initData === 'string' && WebApp.initData.length > 0
}

/**
 * The raw initData string Telegram sends. We forward this verbatim to
 * our Edge Function for HMAC verification. Returns null when not in
 * Telegram so callers can pick a fallback path.
 */
export function getInitData(): string | null {
  initTelegram()
  return WebApp.initData || null
}

/**
 * Parsed Telegram user from initDataUnsafe. Note: "unsafe" only means
 * the *client* hasn't verified the signature — our Edge Function does.
 * Use this for display only; never for authorization decisions.
 */
export function getTelegramUser(): TelegramUser | null {
  initTelegram()
  const u = WebApp.initDataUnsafe?.user
  if (!u) return null
  return {
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    username: u.username,
  }
}
