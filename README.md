# Kokoro 心

A private Telegram Mini App for daily mood tracking among a small circle (~10–20 people). Log how you feel from 1 to 5, jot a short note, see your trends over time, export it all as a PDF.

> _A quiet mood diary, made with care by Egor. Built by Sinoir Technologies._

## Stack

- **Frontend** — React 18 + Vite + TypeScript, hosted on **Vercel**
- **Telegram** — `@twa-dev/sdk`, opens inside a Telegram Mini App
- **Auth / DB** — **Supabase** Postgres with Row Level Security; `auth-telegram` Edge Function validates `initData` HMAC and mints magic-link sessions
- **Charts** — Chart.js (line + doughnut)
- **PDF export** — html2canvas + jsPDF, lazy-loaded
- **Sound** — Tone.js for the sakura tap chime; YouTube IFrame Player for the ambient track
- **Fonts** — Noto Sans + Noto Sans JP + Noto Sans Georgian

## Develop locally

```sh
npm install
cp .env.example .env.local           # fill in your Supabase URL + anon key
npm run dev                          # http://localhost:5173
```

Required `.env.local` values:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

The `service_role` key and `BOT_SECRET` are **never** in this repo — they live only as Supabase Edge Function secrets.

## Project layout

```
public/assets/         bg.webp (Studio Ghibli–style background)
src/
  components/          UI building blocks (Banner, TabBar, AboutModal, SakuraCanvas, …)
  views/               LogMoodView, StatsView
  hooks/               useAuth, useMoodEntries
  lib/                 supabase, telegram, music (YouTube), i18n (EN/RU/KA)
  utils/               stats, exportPdf, chartTheme
  styles/              tokens.css (design tokens), base.css
supabase/
  config.toml          local CLI config; auth-telegram has verify_jwt = false
  functions/
    auth-telegram/     HMAC-verified initData → magic-link OTP
  migrations/          001_create_mood_entries.sql, 002_enable_rls.sql
```

## Useful scripts

```sh
npm run dev          # Vite dev server
npm run build        # type-check + production build → dist/
npm run preview      # serve the build locally
npm run typecheck    # tsc without emit
```

## Deploying

### Frontend → Vercel

1. Push this repo to GitHub
2. Sign in to <https://vercel.com> with GitHub
3. **Add New → Project → Import** the kokoro repo
4. Framework preset: **Vite** (auto-detected)
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon (public) key
6. Deploy. Note the production URL (e.g. `https://kokoro-xxx.vercel.app`).

### Telegram Mini App → BotFather

1. Open `@BotFather` in Telegram
2. `/mybots` → choose your bot → **Bot Settings → Menu Button → Configure menu button**
3. Set the URL to your Vercel URL
4. Optional: also set a Mini App via **/newapp** to get a `t.me/<bot>/<app>` deep link

### Supabase (already done by you)

- Migrations under `supabase/migrations/` were run via the SQL Editor on first setup
- `auth-telegram` Edge Function is deployed; `BOT_SECRET` is set as a Supabase secret
- RLS protects `mood_entries`; only the row owner can read/write their entries

## License

Private. Not for redistribution.
