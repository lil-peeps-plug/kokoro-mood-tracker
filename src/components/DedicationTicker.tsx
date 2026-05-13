/**
 * Slow horizontal ticker between the banner and the active view.
 * Carries the personal dedication and the studio credit.
 *
 * The track contains the same content twice so the CSS animation can
 * translate by -50% and loop seamlessly.
 */
export default function DedicationTicker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        <span className="ticker__line">
          From Egor to Mariam{'  '}
          <em>სიყვარულით, ეგორისგან</em>
          {'  · ♥ ·  Sinoir Technologies  ·  '}
        </span>
        <span className="ticker__line">
          From Egor to Mariam{'  '}
          <em>სიყვარულით, ეგორისგან</em>
          {'  · ♥ ·  Sinoir Technologies  ·  '}
        </span>
      </div>
    </div>
  )
}
