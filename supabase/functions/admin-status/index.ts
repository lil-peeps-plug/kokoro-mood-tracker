// ============================================================
//  Kokoro — admin-status
// ============================================================
//  Public endpoint (no JWT required). Tells the /admin login UI
//  whether a master admin has already been provisioned.
//
//  - true  → show the login form (username + password)
//  - false → show the one-time bootstrap form
//
//  Leaks one bit ("does an admin account exist?"), which is fine
//  for a 20-person private app: the URL itself is the secret.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment is not configured")
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // listUsers is fine here — Kokoro is capped at a couple dozen users
    // and we only need to know whether any one of them is an admin.
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (error) throw new Error(`listUsers failed: ${error.message}`)

    const adminExists = (data?.users ?? []).some(
      (u) => u.app_metadata?.role === "admin",
    )

    return jsonResponse({ adminExists })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("admin-status error:", message)
    return jsonResponse({ error: message }, 500)
  }
})
