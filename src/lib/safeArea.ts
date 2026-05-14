// ============================================================
//  Kokoro — runtime safe-area sync
//  ----------------------------------------------------------
//  CSS env(safe-area-inset-*) works on standalone iOS Safari and
//  some Telegram modes, but on iPhone Telegram Mini Apps it can
//  report 0 even when the Dynamic Island / notch is visibly over
//  our content. Telegram WebApp v8.0+ exposes `safeAreaInset` and
//  `contentSafeAreaInset` so we read those and write them to CSS
//  variables. tokens.css picks the bigger of `env()` and the TG
//  value via max(), so the right one always wins.
// ============================================================

interface SafeAreaInset {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

interface TelegramWebAppLike {
  safeAreaInset?: SafeAreaInset
  contentSafeAreaInset?: SafeAreaInset
  onEvent?: (event: string, handler: () => void) => void
}

function getWebApp(): TelegramWebAppLike | undefined {
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebAppLike } })
    .Telegram?.WebApp
}

function setVar(name: string, value: number | undefined): void {
  if (typeof value !== 'number' || Number.isNaN(value)) return
  document.documentElement.style.setProperty(name, `${value}px`)
}

function syncFromTelegram(): void {
  const tg = getWebApp()
  if (!tg) return

  // contentSafeAreaInset = inset of Telegram-managed safe content area
  // (already accounts for TG's own header). safeAreaInset = system level.
  // We add them so our app, which sits inside TG's webview, gets pushed
  // below BOTH the system status bar AND any Telegram chrome.
  const sys = tg.safeAreaInset ?? {}
  const content = tg.contentSafeAreaInset ?? {}

  const top    = (sys.top    ?? 0) + (content.top    ?? 0)
  const bottom = (sys.bottom ?? 0) + (content.bottom ?? 0)
  const left   = (sys.left   ?? 0) + (content.left   ?? 0)
  const right  = (sys.right  ?? 0) + (content.right  ?? 0)

  setVar('--tg-safe-top',    top)
  setVar('--tg-safe-bottom', bottom)
  setVar('--tg-safe-left',   left)
  setVar('--tg-safe-right',  right)
}

let bound = false

export function bindSafeArea(): void {
  if (bound) return
  bound = true

  // Apply current values (no-op outside Telegram).
  syncFromTelegram()

  const tg = getWebApp()
  if (!tg?.onEvent) return

  // Telegram fires these events on rotation, fullscreen toggle, etc.
  try { tg.onEvent('safeAreaChanged',        syncFromTelegram) } catch { /* old SDK */ }
  try { tg.onEvent('contentSafeAreaChanged', syncFromTelegram) } catch { /* old SDK */ }
  try { tg.onEvent('viewportChanged',        syncFromTelegram) } catch { /* old SDK */ }
}
