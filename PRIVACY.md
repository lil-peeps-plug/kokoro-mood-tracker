# Kokoro — Privacy Notice

_Last updated: 14 May 2026_

Kokoro is a small, private mood diary built for a circle of friends. It is **not** a commercial service, and it is **not** a medical or therapeutic tool.

## What we collect

- Your Telegram user ID, username, and first / last name (sent to us by Telegram when you open the Mini App and sign in)
- The mood scores (1–5) you choose
- Any short notes you type alongside a mood
- Timestamps of your entries
- Your chosen interface language (stored only in your own browser via `localStorage`)

We do **not** collect:
- Profile photos
- Contacts, location, device sensors
- Any browsing activity outside the app

## Where it is stored

- A PostgreSQL database hosted by [Supabase](https://supabase.com) in the EU region (Ireland, `eu-west-1`)
- Row-Level Security ensures that, by default, **only you can read or write your own entries**
- An administrator (Egor) has elevated access via a separate, password-protected admin panel — used to monitor app health and respond to data requests

## Third-party services

- **Telegram WebApp SDK** — used to verify your identity when you open the Mini App
- **YouTube IFrame Player** — used to stream the ambient background track. Audio rights belong to the respective owners; Kokoro claims none. Your use of the player is subject to the [YouTube Terms of Service](https://www.youtube.com/t/terms) and the [Google Privacy Policy](https://policies.google.com/privacy)
- **Supabase** — handles authentication, database, and Edge Functions
- **Vercel** — hosts the static frontend bundle

## Cookies & local storage

Kokoro stores a small amount of data in your browser's `localStorage`:
- Supabase session token (so you don't have to sign in every time)
- Music on / off and volume preference
- Selected language
- Whether you've dismissed the welcome dialog

These never leave your device, and clearing your browser's storage will reset them.

## Your rights

You can ask Egor on Telegram to:
- Show you what data we hold about you
- Delete some or all of your entries
- Delete your account entirely

There is no automated deletion endpoint; please just ask.

## Not medical advice

Kokoro is a personal reflection tool. The mood scores recorded here are **not diagnoses** and the app **cannot replace professional support**.

If you are in crisis or struggling with your mental health, please contact a qualified professional or a local emergency / crisis line:

- **International:** [findahelpline.com](https://findahelpline.com)
- **EU 24/7:** 116 123
- **United States:** 988
- **United Kingdom:** 116 123

## Contact

For privacy questions or data requests, message **Egor** on Telegram.
