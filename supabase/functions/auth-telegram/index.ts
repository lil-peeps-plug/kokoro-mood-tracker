// ============================================================
//  Kokoro — Telegram auth Edge Function
// ============================================================
//  Trust model
//  -----------
//  The frontend (inside a Telegram Mini App) reads `Telegram.WebApp.initData`,
//  a query-string-style payload signed by Telegram using the bot token.
//  We POST that string here. This function:
//
//    1. Verifies the HMAC-SHA256 signature with BOT_SECRET (so we know
//       the data really came from Telegram and wasn't faked client-side).
//    2. Rejects payloads older than 5 minutes (replay protection).
//    3. Finds or provisions a Supabase auth.users row for that Telegram user.
//    4. Issues a magic-link OTP via supabase.auth.admin.generateLink, and
//       returns the hashed_token + email to the frontend. The frontend
//       calls supabase.auth.verifyOtp() to exchange it for a real session
//       (access_token + refresh_token).
//
//  Why magic-link OTP instead of passwords?
//  ----------------------------------------
//  No long-lived secret to store or derive; the OTP is single-use and short-
//  lived; sessions get standard Supabase refresh-token rotation. No coupling
//  between BOT_SECRET and user accounts, so the bot token can be rotated
//  without breaking logins.
//
//  Required env vars (set with `supabase secrets set NAME=value`)
//  --------------------------------------------------------------
//    BOT_SECRET                 — Telegram bot token from @BotFather
//
//  Auto-injected by Supabase (do NOT set manually)
//  -----------------------------------------------
//    SUPABASE_URL
//    SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2"

// --- Config ---------------------------------------------------------------

const BOT_SECRET = Deno.env.get("BOT_SECRET")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const MAX_AGE_SECONDS = 300 // 5 minutes — replay window per Telegram docs

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// --- Telegram initData verification --------------------------------------

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function hmacSha256(
  key: BufferSource,
  data: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(data),
  )
}

async function verifyInitData(
  initData: string,
  botToken: string,
): Promise<TelegramUser> {
  const params = new URLSearchParams(initData)
  const providedHash = params.get("hash")
  const authDateStr = params.get("auth_date")
  const userJson = params.get("user")

  if (!providedHash || !authDateStr || !userJson) {
    throw new Error("initData missing required fields (hash/auth_date/user)")
  }

  // Replay protection.
  const authDate = Number.parseInt(authDateStr, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Number.isNaN(authDate) || now - authDate > MAX_AGE_SECONDS) {
    throw new Error("initData expired (older than 5 minutes)")
  }

  // Build data_check_string: every field except `hash`, sorted by key,
  // joined as "key=value\nkey=value...".
  params.delete("hash")
  const lines: string[] = []
  for (const [key, value] of params.entries()) {
    lines.push(`${key}=${value}`)
  }
  lines.sort()
  const dataCheckString = lines.join("\n")

  // Per Telegram docs:
  //   secret_key   = HMAC_SHA256("WebAppData", bot_token)
  //   data_hash    = HMAC_SHA256(secret_key, data_check_string)
  const encoder = new TextEncoder()
  const secretKey = await hmacSha256(
    encoder.encode("WebAppData"),
    botToken,
  )
  const computedHash = await hmacSha256(secretKey, dataCheckString)

  if (bytesToHex(computedHash) !== providedHash) {
    throw new Error("initData signature does not match BOT_SECRET")
  }

  return JSON.parse(userJson) as TelegramUser
}

// --- User provisioning ---------------------------------------------------

function telegramEmail(telegramId: number): string {
  // .local is a reserved TLD that can never collide with a real email domain.
  // Supabase only validates email format, not deliverability.
  return `tg-${telegramId}@kokoro.local`
}

async function ensureUserExists(
  supabase: SupabaseClient,
  tgUser: TelegramUser,
  email: string,
): Promise<void> {
  const { error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    // app_metadata is server-controlled and the safe place for identifiers
    // that may inform authorization. user_metadata is user-editable and must
    // never be used for authz decisions.
    app_metadata: {
      provider: "telegram",
      telegram_id: tgUser.id,
    },
    user_metadata: {
      telegram_username: tgUser.username ?? null,
      telegram_first_name: tgUser.first_name ?? null,
      telegram_last_name: tgUser.last_name ?? null,
    },
  })

  if (!error) return

  // "User already registered" is the normal repeat-login case — treat as success.
  const message = error.message?.toLowerCase() ?? ""
  if (
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("duplicate")
  ) {
    return
  }

  throw new Error(`createUser failed: ${error.message}`)
}

// --- HTTP handler --------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  try {
    if (!BOT_SECRET) {
      throw new Error("BOT_SECRET is not configured on Supabase")
    }
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment is not configured")
    }

    const body = await req.json().catch(() => ({} as { initData?: unknown }))
    const initData = (body as { initData?: unknown }).initData
    if (typeof initData !== "string" || initData.length === 0) {
      throw new Error("Request body must include initData (string)")
    }

    // 1. Verify Telegram signature and replay window.
    const tgUser = await verifyInitData(initData, BOT_SECRET)

    // 2. Find or create the Supabase user.
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const email = telegramEmail(tgUser.id)
    await ensureUserExists(supabase, tgUser, email)

    // 3. Mint a single-use, short-lived magic-link token.
    //    The frontend swaps this for a real session via supabase.auth.verifyOtp().
    const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    })
    if (linkErr || !link?.properties?.hashed_token) {
      throw new Error(
        `generateLink failed: ${linkErr?.message ?? "no token returned"}`,
      )
    }

    return jsonResponse({
      email,
      hashed_token: link.properties.hashed_token,
      telegram: {
        id: tgUser.id,
        username: tgUser.username ?? null,
        first_name: tgUser.first_name ?? null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("auth-telegram error:", message)
    return jsonResponse({ error: message }, 400)
  }
})
