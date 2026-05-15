// Thin wrapper around window.Telegram.WebApp (the global injected by
// https://telegram.org/js/telegram-web-app.js — see index.html).
//
// We used to import `WebApp` from `@twa-dev/sdk`, but that wrapper
// snapshotted the global at module-load time and ended up holding an
// empty stub on iOS Telegram — `initData` was always "" even when the
// real `window.Telegram.WebApp.initData` had a valid 500+ char payload.
// Reading the live global on every call is the simplest fix and avoids
// any timing race with the Telegram script.

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

// Minimal shape of the parts of the SDK we actually touch. The real
// object has many more methods; we deliberately keep this small so
// nothing depends on the upstream type drift.
interface TelegramWebApp {
  initData?: string
  initDataUnsafe?: { user?: TelegramUser }
  platform?: string
  version?: string
  ready?: () => void
  expand?: () => void
}

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  const tg = (window as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram
  return tg?.WebApp ?? null
}

let didReady = false

/**
 * Idempotently calls Telegram.WebApp.ready() and expand().
 * Safe to call multiple times and safe outside Telegram (no-op).
 */
export function initTelegram(): void {
  if (didReady) return
  const w = getWebApp()
  try {
    w?.ready?.()
    w?.expand?.()
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
  const data = getWebApp()?.initData
  return typeof data === 'string' && data.length > 0
}

/**
 * The raw initData string Telegram sends. We forward this verbatim to
 * our Edge Function for HMAC verification. Returns null when not in
 * Telegram so callers can pick a fallback path.
 */
export function getInitData(): string | null {
  initTelegram()
  const data = getWebApp()?.initData
  return data && data.length > 0 ? data : null
}

/**
 * Parsed Telegram user from initDataUnsafe. Note: "unsafe" only means
 * the *client* hasn't verified the signature — our Edge Function does.
 * Use this for display only; never for authorization decisions.
 */
export function getTelegramUser(): TelegramUser | null {
  initTelegram()
  const u = getWebApp()?.initDataUnsafe?.user
  if (!u) return null
  return {
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    username: u.username,
  }
}
