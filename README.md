# Kokoro

A Telegram Mini App built with React + Vite + TypeScript.

## Stack

- **React 18** — UI
- **Vite** — dev server / bundler
- **TypeScript** (strict) — type safety

## Folder structure

```
public/
  assets/          static assets served as-is
src/
  components/      reusable presentational components
  views/           top-level screens / routes
  hooks/           custom React hooks
  lib/             third-party client wrappers (supabase, telegram, etc.)
  utils/           pure helpers
  styles/          design tokens + base styles
  App.tsx          root component
  main.tsx         entry
```

## Getting started

```bash
npm install
cp .env.example .env   # fill in values
npm run dev
```

Build: `npm run build` · Typecheck: `npm run typecheck`

## Dependencies

| Package | Purpose |
| --- | --- |
| `@supabase/supabase-js` | Backend client — auth, database, storage, realtime. Used to persist user data and sync state across sessions. |
| `@twa-dev/sdk` | Typed wrapper around the Telegram Web App API. Used for theme params, haptics, main/back buttons, viewport, init data, and other Mini App integrations. |
| `chart.js` | Canvas-based charting library. Used to render data visualizations inside the app. |
| `jspdf` | Client-side PDF generation. Used to export reports / summaries as downloadable PDFs. |
| `html2canvas` | Renders a DOM node to a canvas. Paired with `jspdf` to snapshot styled UI into the exported PDF. |
| `tone` | Web Audio framework. Used for in-app sounds, ambience, or interaction feedback. |

## Environment

See `.env.example`. All client-exposed vars must be prefixed `VITE_`.
