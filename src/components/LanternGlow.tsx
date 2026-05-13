/**
 * LanternGlow
 * -----------
 * Decorative overlay that radiates a warm light around the lantern in
 * the background image. Two stacked layers:
 *
 *   - `__core`  — a small bright flame-like centre that flickers
 *   - `__halo`  — a large soft radial bloom that breathes
 *
 * Both layers blend onto the bg via mix-blend-mode: screen (set on the
 * parent), so they only add light — they never darken anything.
 *
 * To reposition the glow on a different background image, tweak
 * --lantern-top / --lantern-left / --lantern-size in tokens.css.
 *
 * Animation is disabled under prefers-reduced-motion (see base.css).
 */
export default function LanternGlow() {
  return (
    <div className="lantern-glow" aria-hidden="true">
      <div className="lantern-glow__halo" />
      <div className="lantern-glow__core" />
    </div>
  )
}
