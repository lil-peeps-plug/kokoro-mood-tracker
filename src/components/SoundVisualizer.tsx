import { useEffect, useRef } from 'react'
import { useMusic } from '@/lib/music'

/**
 * Thin row of frequency bars above the tab bar.
 *
 * Since the audio is streamed inside a cross-origin YouTube iframe,
 * the browser will not let us read real frequency data — instead we
 * generate a time-driven pseudo-spectrum from a layered sine field.
 * Visually it reads as a calm spectrum; it just isn't synchronised
 * to the actual track.
 *
 * Only renders / animates while music is playing.
 */
const BAR_COUNT = 36
// Warm cream — matches --color-accent. Hard-coded as rgb for Canvas2D
// compatibility across older webviews.
const BAR_R = 240
const BAR_G = 220
const BAR_B = 190

export default function SoundVisualizer() {
  const { playing } = useMusic()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !playing) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

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

    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = (now - start) * 0.001 // seconds since mount
      ctx.clearRect(0, 0, width, height)

      const gap = 2 * dpr
      const barWidth = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT
      const radius = barWidth / 2

      for (let i = 0; i < BAR_COUNT; i++) {
        // Sum three sine waves at different frequencies + per-bar phase.
        // Produces calm, organic motion across the row without obvious
        // banding or periodicity.
        // Halved sine frequencies versus the first pass — visibly calmer.
        const phase = i * 0.42
        const v =
          0.45 +
          0.20 * Math.sin(t * 0.3 + phase) +
          0.15 * Math.sin(t * 0.75 + phase * 1.8) +
          0.10 * Math.sin(t * 1.55 + phase * 0.7)
        const norm = Math.max(0, Math.min(1, v))
        const barH = norm * height
        const x = i * (barWidth + gap)
        const y = height - barH
        const alpha = 0.32 + norm * 0.50

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

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      ctx.clearRect(0, 0, width, height)
    }
  }, [playing])

  return (
    <div
      className={`visualizer${playing ? ' is-active' : ''}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="visualizer__canvas" />
    </div>
  )
}
