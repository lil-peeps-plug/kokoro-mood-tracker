import { useEffect, useRef } from 'react'

// ============================================================
//  Sakura petal canvas
//  ----------------------------------------------------------
//  Decorative drifting petals behind the app content.
//    - Wind bursts every 8–15s: 5–10 petals from one edge,
//      following a sine-wave arc across the screen.
//    - Between bursts: 1–2 petals drift down slowly from the top.
//    - Petals drawn with bezier curves, soft pink, slight rotation.
//    - Tap a petal → 6–8 spark particles burst outward + a soft
//      Tone.js sine chime at C6.
//    - prefers-reduced-motion → render nothing, animate nothing.
//
//  The canvas itself is pointer-events: none. Tap detection happens
//  via a document-level click listener that hit-tests the petal
//  positions; if no petal is at the click point, the event passes
//  through normally so UI controls keep working.
// ============================================================

const MAX_PETALS = 18
const BURST_MIN_S = 8
const BURST_MAX_S = 15

interface Petal {
  x: number
  y: number
  vy: number          // downward speed (px / s)
  baseVx: number      // background horizontal drift
  swayAmp: number     // sine sway amplitude
  swayFreq: number    // sway angular frequency
  swayPhase: number   // current sway phase
  size: number        // 6–12 px
  rotation: number
  rotSpeed: number
  alpha: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number        // 1 → 0
  size: number
}

function randomBetween(a: number, b: number): number {
  return a + Math.random() * (b - a)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// Lazy Tone.js — loaded on the first petal tap. Glassy chime: sine
// synth through reverb, random pentatonic note for windchime variety.
let tonePromise: Promise<typeof import('tone')> | null = null
let toneSynth: import('tone').Synth | null = null
let toneStarted = false

const CHIME_NOTES = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7']

async function playChime() {
  if (!tonePromise) tonePromise = import('tone')
  const Tone = await tonePromise
  if (!toneStarted) {
    await Tone.start()
    toneStarted = true
  }
  if (!toneSynth) {
    // Long-tail reverb gives the strike its glassy ring.
    const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.55 }).toDestination()
    toneSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001, // instant strike, like a glass tap
        decay: 0.8,
        sustain: 0,
        release: 0.4,
      },
    }).connect(reverb)
    // Dialled-down chime — barely there, just a wisp. Sits well below
    // the YouTube music; only audible in quiet rooms / with headphones.
    toneSynth.volume.value = -54
  }
  const note = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)]
  toneSynth.triggerAttackRelease(note ?? 'C6', '8n')
}

export default function SakuraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const petalsRef = useRef<Petal[]>([])
  const sparksRef = useRef<Spark[]>([])
  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const burstTimerRef = useRef<number>(0)
  const ambientTimerRef = useRef<number>(0)
  const sizeRef = useRef<{ w: number; h: number; dpr: number }>({
    w: 0,
    h: 0,
    dpr: 1,
  })

  useEffect(() => {
    if (prefersReducedMotion()) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    sizeRef.current.dpr = dpr

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width * dpr))
      const h = Math.max(1, Math.floor(rect.height * dpr))
      canvas!.width = w
      canvas!.height = h
      sizeRef.current.w = w
      sizeRef.current.h = h
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function spawnPetal(opts: Partial<Petal> = {}) {
      if (petalsRef.current.length >= MAX_PETALS) return
      const { w, dpr: d } = sizeRef.current
      const baseSize = randomBetween(6, 12) * d
      petalsRef.current.push({
        x: opts.x ?? randomBetween(0, w),
        y: opts.y ?? -baseSize * 2,
        vy: opts.vy ?? randomBetween(20, 40) * d,
        baseVx: opts.baseVx ?? randomBetween(-8, 8) * d,
        swayAmp: opts.swayAmp ?? randomBetween(15, 35) * d,
        swayFreq: opts.swayFreq ?? randomBetween(0.6, 1.4),
        swayPhase: Math.random() * Math.PI * 2,
        size: opts.size ?? baseSize,
        rotation: opts.rotation ?? Math.random() * Math.PI * 2,
        rotSpeed: opts.rotSpeed ?? randomBetween(-1.2, 1.2),
        alpha: opts.alpha ?? randomBetween(0.55, 0.85),
        ...opts,
      })
    }

    function spawnBurst() {
      const count = Math.floor(randomBetween(5, 11))
      const { w, h, dpr: d } = sizeRef.current
      const fromLeft = Math.random() < 0.5
      const startX = fromLeft ? -20 * d : w + 20 * d
      const driftDir = fromLeft ? 1 : -1
      for (let i = 0; i < count; i++) {
        spawnPetal({
          x: startX + randomBetween(-30, 30) * d,
          y: randomBetween(0, h * 0.4),
          vy: randomBetween(30, 55) * d,
          baseVx: driftDir * randomBetween(35, 60) * d,
          swayAmp: randomBetween(20, 45) * d,
          swayFreq: randomBetween(0.6, 1.2),
        })
      }
    }

    function spawnSparks(x: number, y: number) {
      // More particles, faster outward velocities, brighter cores.
      const count = Math.floor(randomBetween(12, 18))
      const d = sizeRef.current.dpr
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + randomBetween(-0.3, 0.3)
        const speed = randomBetween(110, 220) * d
        sparksRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: randomBetween(1.8, 3.2) * d,
        })
      }
    }

    function drawPetal(p: Petal) {
      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate(p.rotation)
      ctx!.globalAlpha = p.alpha * 0.85
      ctx!.fillStyle = '#ffc8d4'
      ctx!.beginPath()
      const s = p.size
      ctx!.moveTo(0, -s)
      ctx!.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.9, s * 0.6, 0, s)
      ctx!.bezierCurveTo(-s * 0.9, s * 0.6, -s * 0.9, -s * 0.6, 0, -s)
      ctx!.fill()
      // Inner highlight
      ctx!.globalAlpha = p.alpha * 0.45
      ctx!.fillStyle = '#ffe8ee'
      ctx!.beginPath()
      ctx!.ellipse(0, 0, s * 0.25, s * 0.6, 0, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.restore()
    }

    function drawSpark(s: Spark) {
      const a = Math.max(0, s.life)
      ctx!.save()
      ctx!.globalAlpha = a
      // Pure-white spark — bright core + white glow halo + faint white
      // outer ring. Three white layers at different alphas give depth
      // without going pink.
      ctx!.shadowBlur = 12 * sizeRef.current.dpr
      ctx!.shadowColor = '#ffffff'
      ctx!.fillStyle = '#ffffff'
      ctx!.beginPath()
      ctx!.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx!.fill()
      // Soft white outer ring at half opacity for extra sparkle.
      ctx!.shadowBlur = 0
      ctx!.globalAlpha = a * 0.45
      ctx!.fillStyle = '#ffffff'
      ctx!.beginPath()
      ctx!.arc(s.x, s.y, s.size * 1.8, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.restore()
    }

    function tick(now: number) {
      const last = lastFrameRef.current || now
      const dt = Math.min((now - last) / 1000, 0.05) // clamp 50ms
      lastFrameRef.current = now

      const { w, h } = sizeRef.current

      // --- Scheduled spawns ---
      burstTimerRef.current -= dt
      if (burstTimerRef.current <= 0) {
        spawnBurst()
        burstTimerRef.current = randomBetween(BURST_MIN_S, BURST_MAX_S)
      }
      ambientTimerRef.current -= dt
      if (ambientTimerRef.current <= 0) {
        spawnPetal()
        ambientTimerRef.current = randomBetween(2.5, 5)
      }

      // --- Update + draw ---
      ctx!.clearRect(0, 0, w, h)

      // Petals
      const surviving: Petal[] = []
      for (const p of petalsRef.current) {
        p.swayPhase += p.swayFreq * dt
        const vx = p.baseVx + Math.sin(p.swayPhase) * p.swayAmp
        p.x += vx * dt
        p.y += p.vy * dt
        p.rotation += p.rotSpeed * dt
        if (p.y > h + p.size * 3) continue
        if (p.x < -p.size * 4 - 50 || p.x > w + p.size * 4 + 50) continue
        surviving.push(p)
        drawPetal(p)
      }
      petalsRef.current = surviving

      // Sparks
      const survivingSparks: Spark[] = []
      for (const s of sparksRef.current) {
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vx *= 0.94
        s.vy *= 0.94
        s.vy += 30 * dt // tiny gravity
        s.life -= dt / 0.4 // ~400ms life
        if (s.life > 0) {
          survivingSparks.push(s)
          drawSpark(s)
        }
      }
      sparksRef.current = survivingSparks

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    // --- Tap detection (document-level since canvas is pointer-events: none) ---
    function onDocumentClick(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const x = (e.clientX - rect.left) * sizeRef.current.dpr
      const y = (e.clientY - rect.top) * sizeRef.current.dpr
      // Hit-test from topmost (latest) petal first
      for (let i = petalsRef.current.length - 1; i >= 0; i--) {
        const p = petalsRef.current[i]!
        const dx = p.x - x
        const dy = p.y - y
        // Hit-test radius is much larger than the visible petal so the
        // small drawn shape stays delicate while the tap target is
        // forgiving for fingertips. Minimum 24 px (DPR-scaled) ensures
        // even the tiniest petals are easy to tap.
        const r = Math.max(p.size * 3, 24 * sizeRef.current.dpr)
        if (dx * dx + dy * dy <= r * r) {
          // Hit. Remove + spark + chime.
          spawnSparks(p.x, p.y)
          petalsRef.current.splice(i, 1)
          playChime().catch(() => {
            /* swallow */
          })
          break
        }
      }
    }
    document.addEventListener('click', onDocumentClick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      document.removeEventListener('click', onDocumentClick)
    }
  }, [])

  return (
    <div className="sakura" aria-hidden="true">
      <canvas ref={canvasRef} className="sakura__canvas" />
    </div>
  )
}
