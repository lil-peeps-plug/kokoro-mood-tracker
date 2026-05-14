#!/usr/bin/env node
// ============================================================
//  Kokoro — UI screenshot helper
// ============================================================
//  Usage:
//    node scripts/screenshot.mjs [path] [out] [--width=1440] [--height=900] [--wait=2500]
//
//  Defaults:
//    path   = /admin
//    out    = screenshots/<sanitised-path>.png
//    width  = 1440  (laptop reference)
//    height = 900
//    wait   = 2500ms after networkidle (lets admin loader + animations settle)
//
//  Assumes a Vite dev server is running on SCREENSHOT_URL or
//  http://localhost:5173. Pass --url=... to override.
// ============================================================

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      flags[k] = v ?? true
    } else {
      positional.push(a)
    }
  }
  return { positional, flags }
}

const { positional, flags } = parseArgs(process.argv.slice(2))
const urlPath = positional[0] ?? '/admin'
const baseUrl = flags.url ?? process.env.SCREENSHOT_URL ?? 'http://localhost:5173'

// --mobile shorthand: iPhone 15 Pro CSS viewport (393×852) at 3× DPR,
// so we can verify safe-area + Dynamic Island layout decisions.
const mobile = flags.mobile === true || flags.mobile === 'true'
const defaultW = mobile ? 393 : 1440
const defaultH = mobile ? 852 : 900
const defaultDPR = mobile ? 3 : 2

const width = Number.parseInt(flags.width ?? String(defaultW), 10)
const height = Number.parseInt(flags.height ?? String(defaultH), 10)
const waitMs = Number.parseInt(flags.wait ?? '2500', 10)
const fullPage = flags.fullPage === true || flags.fullPage === 'true'
const deviceScaleFactor = Number.parseFloat(flags.dpr ?? String(defaultDPR))

function safeName(p) {
  const cleaned = p.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'root'
  return cleaned
}
const defaultOut = path.join(root, 'screenshots', `${safeName(urlPath)}.png`)
const outPath = positional[1] ?? defaultOut

await mkdir(path.dirname(outPath), { recursive: true })

const target = baseUrl + (urlPath.startsWith('/') ? urlPath : `/${urlPath}`)
console.log(`→ ${target}`)
console.log(`  viewport ${width}×${height} @ ${deviceScaleFactor}x, wait ${waitMs}ms`)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor,
})
const page = await context.newPage()

try {
  await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 })
} catch (err) {
  console.error(`failed to load ${target}: ${err instanceof Error ? err.message : err}`)
  console.error('is the Vite dev server running?  (npm run dev)')
  await browser.close()
  process.exit(1)
}

// Let animations settle (loader spin, swap-in fade, glow breathe).
await page.waitForTimeout(waitMs)

// Optional admin sign-in for /admin so we can capture the dashboard state.
// Usage:  node scripts/screenshot.mjs /admin --signin=YOUR_PASSWORD
if (flags.signin) {
  try {
    await page.fill('#admin-password', String(flags.signin))
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(waitMs)
  } catch (err) {
    console.error('sign-in step failed:', err instanceof Error ? err.message : err)
  }
}

// Optional dev sign-in for the main app's DevLogin form.
// Usage:  node scripts/screenshot.mjs / --devsignin=EMAIL,PASSWORD --wait=5500
// (extra wait covers the 4 s splash + auth handshake.)
if (flags.devsignin) {
  const [devEmail, devPass] = String(flags.devsignin).split(',')
  if (!devEmail || !devPass) {
    console.error('--devsignin needs "email,password"')
  } else {
    try {
      await page.fill('input[type="email"]', devEmail)
      await page.fill('input[type="password"]', devPass)
      await page.click('button[type="submit"]')
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(waitMs)
    } catch (err) {
      console.error('dev-signin step failed:', err instanceof Error ? err.message : err)
    }
  }
}

await page.screenshot({ path: outPath, fullPage })
await browser.close()

console.log(`saved → ${path.relative(root, outPath)}`)
