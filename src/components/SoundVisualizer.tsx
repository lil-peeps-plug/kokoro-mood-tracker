import { useEffect, useRef } from 'react'
import { useMusic } from '@/lib/music'

/**
 * Thin row of frequency bars above the tab bar.
 *
 * Since the audio is streamed inside a cross-origin YouTube iframe,
 * the browser will not let us read real frequency data — instead we
 * generate a time-driven pseudo-spectrum from a layered sine field.
 * Visually it reads as a calm spectrum; it just isn't synchronised
 * to the actual track. Bars fade in when music starts and gently
 * decay back out when it stops.
 */
const BAR_COUNT = 36
// Warm cream — matches --color-accent. Hard-coded as rgb for Canvas2D
// compatibility across older webviews.
const BAR_R = 240
const BAR_G = 220
const BAR_B = 190

export default function SoundVisualizer() {
  // `enabled` flips synchronously the moment the user toggles the
  // music button — `playing` from the music provider only flips
  // after YouTube's state machine catches up ~900 ms later. Reading
  // `enabled` makes the visualizer respond instantly to user intent.
  const { enabled } = useMusic()
  const playing = enabled
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Envelope value (0..1) — bars are drawn at this fraction of their
  // synthetic height. Snaps up quickly when music starts, decays slowly
  // when it stops. Lives in a ref so it survives the effect re-running
  // each time `playing` toggles.
  const decayRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If the decay is already at rest AND we're not playing, there's
    // nothing to draw — skip starting an animation frame at all.
    if (!playing && decayRef.current < 0.005) return

    const dpr = window.devicePixelRatio || 1
    let width = 0
    let height = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width * dpr))
      height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.width = width
      canvas.height = height
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (!startRef.current) startRef.current = performance.now()
    lastFrameRef.current = performance.now()

    let raf = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now
      const t = (now - startRef.current) * 0.001

      // Approach the target envelope value. Attack is brisk so the
      // visualizer pops up the moment music starts; release is slow
      // enough that the user clearly sees the bars shrink down over
      // ~2 seconds when music stops.
      const target = playing ? 1 : 0
      const rate = target > decayRef.current ? 8 : 0.5
      decayRef.current += (target - decayRef.current) * Math.min(1, dt * rate)

      ctx.clearRect(0, 0, width, height)

      if (decayRef.current > 0.005) {
        const env = decayRef.current
        const gap = 2 * dpr
        const barWidth = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT
        const radius = barWidth / 2

        for (let i = 0; i < BAR_COUNT; i++) {
          // Same three-sine pseudo-spectrum as before, scaled by the
          // current envelope so bars shrink uniformly toward zero.
          const phase = i * 0.42
          const v =
            0.45 +
            0.20 * Math.sin(t * 0.3 + phase) +
            0.15 * Math.sin(t * 0.75 + phase * 1.8) +
            0.10 * Math.sin(t * 1.55 + phase * 0.7)
          const norm = Math.max(0, Math.min(1, v)) * env
          const barH = norm * height
          if (barH < 0.5) continue
          const x = i * (barWidth + gap)
          const y = height - barH
          const alpha = (0.32 + Math.max(0, Math.min(1, v)) * 0.50) * env

          ctx.fillStyle = `rgba(${BAR_R}, ${BAR_G}, ${BAR_B}, ${alpha})`
          const r = Math.min(radius, barH / 2)
          ctx.beginPath()
          ctx.moveTo(x, height)
          ctx.lineTo(x, y + r)
          ctx.quadraticCurveTo(x, y, x + r, y)
          ctx.lineTo(x + barWidth - r, y)
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r)
          ctx.lineTo(x + barWidth, height)
          ctx.closePath()
          ctx.fill()
        }
      }

      // Stop the loop once the envelope is at rest AND we're not
      // currently playing — saves a frame per tick while idle.
      if (!playing && decayRef.current < 0.005) {
        decayRef.current = 0
        raf = 0
        return
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [playing])

  return (
    <div className="visualizer" aria-hidden="true">
      {/* Visibility is driven entirely by the canvas content: when the
          envelope is at rest the canvas is empty and nothing is shown,
          when bars are decaying the user clearly sees them shrink. The
          container itself no longer fades — it's just a static slot. */}
      <canvas ref={canvasRef} className="visualizer__canvas" />
    </div>
  )
}
