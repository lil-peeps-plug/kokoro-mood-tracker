import { createClient } from '@supabase/supabase-js'

// Single Supabase client shared by the whole app.
// Import this from anywhere; never call createClient again.

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in real values.',
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // We never use email-link redirects; verifyOtp is called manually
    // from useAuth.ts, so this would only confuse the SDK.
    detectSessionInUrl: false,
  },
})

// Re-export the endpoints our Edge Functions listen on. Co-locating them
// here means the URLs are derived from the same env var the client uses.
export const AUTH_TELEGRAM_ENDPOINT   = `${url}/functions/v1/auth-telegram`
export const ADMIN_STATUS_ENDPOINT    = `${url}/functions/v1/admin-status`
export const ADMIN_BOOTSTRAP_ENDPOINT = `${url}/functions/v1/admin-bootstrap`

// Anon key is needed in the Authorization/apikey header when calling
// Edge Functions from the browser, even for endpoints with
// verify_jwt = false. Re-exporting avoids importing import.meta in
// useAuth.ts.
export const SUPABASE_ANON_KEY = anonKey
