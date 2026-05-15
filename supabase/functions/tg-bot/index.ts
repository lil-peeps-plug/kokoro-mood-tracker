// ============================================================
//  Kokoro — Telegram bot webhook
// ============================================================
//  Handles incoming Telegram updates. The only command we
//  currently react to is /start: the bot answers with a tri-
//  lingual welcome message and an inline keyboard of three
//  WebApp buttons (English / Russian / Georgian). Tapping a
//  button opens the Mini App with `?lang=<code>` in the URL,
//  which i18n.tsx detects on first paint and uses as the
//  initial locale.
//
//  Other update types are acknowledged with a 200 OK and
//  otherwise ignored — keeps Telegram's webhook delivery
//  retries quiet.
//
//  Required env vars (set via `supabase secrets set NAME=...`):
//    BOT_SECRET    — the bot token from @BotFather
//    MINI_APP_URL  — the deployed Mini App URL (e.g. the
//                    Vercel production URL). No trailing slash.
//
//  Webhook setup, one-time:
//    curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
//         -d "url=https://<PROJECT>.supabase.co/functions/v1/tg-bot"
//
//  This function must have `verify_jwt = false` in config.toml
//  because Telegram does not send a Supabase JWT.
// ============================================================

const BOT_SECRET = Deno.env.get("BOT_SECRET")
const MINI_APP_URL = (Deno.env.get("MINI_APP_URL") ?? "").replace(/\/+$/, "")

// Ultra-minimal — title + a single greeting line in all three
// languages separated by middle dots, plus one quiet hint line so
// the user knows the buttons below are what opens the app. Detail
// is left to the app itself; the bot's only job is to launch it.
// HTML parse mode for the bold title (cheaper than MarkdownV2 here).
const WELCOME_TEXT = [
  "🌸 <b>Kokoro 心</b>",
  "",
  "Welcome · Добро пожаловать · მოგესალმებით",
  "",
  "<i>Tap a button below to open the app</i>",
].join("\n")

interface InlineKeyboardButton {
  text: string
  web_app?: { url: string }
}

interface SendMessagePayload {
  chat_id: number
  text: string
  parse_mode?: "MarkdownV2" | "HTML"
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][]
  }
}

async function tgApi(method: string, payload: unknown): Promise<void> {
  if (!BOT_SECRET) return
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_SECRET}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error(`tg api ${method} failed: ${res.status} ${text}`)
  }
}

function languageKeyboard(): InlineKeyboardButton[][] {
  // Stacked vertically — three short buttons read better on phones
  // than three cramped horizontal cells with non-Latin scripts.
  return [
    [{ text: "🇬🇧 English",  web_app: { url: `${MINI_APP_URL}/?lang=en` } }],
    [{ text: "🇷🇺 Русский",  web_app: { url: `${MINI_APP_URL}/?lang=ru` } }],
    [{ text: "🇬🇪 ქართული",  web_app: { url: `${MINI_APP_URL}/?lang=ka` } }],
  ]
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }
  if (!BOT_SECRET) {
    return new Response("BOT_SECRET not configured", { status: 500 })
  }
  if (!MINI_APP_URL) {
    return new Response("MINI_APP_URL not configured", { status: 500 })
  }

  let update: { message?: { chat?: { id?: number }; text?: string } }
  try {
    update = await req.json()
  } catch {
    return new Response("Bad JSON", { status: 400 })
  }

  const message = update.message
  const chatId = message?.chat?.id
  const text = message?.text ?? ""

  // /start (with or without a deep-link payload, e.g. "/start ref_foo")
  // is the canonical entry point. Anything else from the user gets
  // silently acked — we're not a chatbot, just a launcher.
  if (chatId !== undefined && text.startsWith("/start")) {
    const payload: SendMessagePayload = {
      chat_id: chatId,
      text: WELCOME_TEXT,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: languageKeyboard() },
    }
    await tgApi("sendMessage", payload)
  }

  return new Response("ok", { status: 200 })
})
