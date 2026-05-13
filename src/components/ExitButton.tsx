import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

/**
 * Small icon button in the top-left of the banner that closes the
 * Telegram Mini App if running inside Telegram, or signs the user out
 * of Supabase otherwise (dev / web fallback).
 *
 * Prompts for confirmation so a stray tap doesn't drop the session.
 */
export default function ExitButton() {
  const { t } = useI18n()

  async function onClick() {
    if (!window.confirm(t.exitConfirm)) return

    // 1. Inside Telegram, ask the WebApp to close.
    try {
      const tg = (window as unknown as {
        Telegram?: { WebApp?: { close?: () => void } }
      }).Telegram?.WebApp
      if (tg?.close) {
        tg.close()
        return
      }
    } catch {
      /* fall through to sign-out */
    }

    // 2. Outside Telegram (dev / web), sign out so we return to login.
    try {
      await supabase.auth.signOut()
    } catch {
      /* swallow */
    }
  }

  return (
    <button
      type="button"
      className="exit-btn"
      onClick={onClick}
      aria-label={t.exit}
      title={t.exit}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  )
}
