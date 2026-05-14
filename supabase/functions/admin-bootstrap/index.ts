// ============================================================
//  Kokoro — admin-bootstrap
// ============================================================
//  One-shot endpoint that creates the master admin account on
//  the FIRST visit to /admin. After an admin exists, every call
//  returns 409 Conflict — there's no way to "re-bootstrap" or
//  promote a second admin through this endpoint.
//
//  Request:  POST { username: "master", password: string }
//  Response: { ok: true, email: "master@kokoro.local" }
//
//  The created user gets:
//    email                       = master@kokoro.local
//    password                    = <body.password>
//    email_confirm               = true (no verification email)
//    app_metadata.role           = "admin"      (gates is_admin())
//    app_metadata.username       = "master"     (display only)
//
//  app_metadata is server-controlled; users cannot self-promote.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const ADMIN_USERNAME = "master"
const ADMIN_EMAIL = "master@kokoro.local"
const MIN_PASSWORD_LENGTH = 8

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

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
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment is not configured")
    }

    const body = (await req.json().catch(() => ({}))) as {
      username?: unknown
      password?: unknown
    }
    const username = typeof body.username === "string" ? body.username.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (username !== ADMIN_USERNAME) {
      return jsonResponse(
        { error: `Username must be "${ADMIN_USERNAME}"` },
        400,
      )
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return jsonResponse(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        400,
      )
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Refuse if any admin already exists.
    const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (listErr) throw new Error(`listUsers failed: ${listErr.message}`)

    const alreadyHasAdmin = (existing?.users ?? []).some(
      (u) => u.app_metadata?.role === "admin",
    )
    if (alreadyHasAdmin) {
      return jsonResponse({ error: "An admin account already exists" }, 409)
    }

    const { error: createErr } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
      app_metadata: {
        role: "admin",
        username: ADMIN_USERNAME,
        provider: "kokoro-admin",
      },
    })
    if (createErr) {
      throw new Error(`createUser failed: ${createErr.message}`)
    }

    return jsonResponse({ ok: true, email: ADMIN_EMAIL })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("admin-bootstrap error:", message)
    return jsonResponse({ error: message }, 500)
  }
})
