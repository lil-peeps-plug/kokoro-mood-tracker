// ============================================================
//  AdminLoading — slim spinner for /admin async states
// ============================================================
//  Two soft rings tracing in opposite directions around the
//  Kokoro kanji, plus a pulsing tracked-out label. Drops in
//  wherever the admin panel is waiting on a network call.
// ============================================================

interface Props {
  /** Optional label under the ring. Defaults to "Loading". */
  label?: string
}

export default function AdminLoading({ label = 'Loading' }: Props) {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <div className="admin-loading__ring" aria-hidden="true">
        <span className="admin-loading__ring-outer" />
        <span className="admin-loading__ring-inner" />
        <span className="admin-loading__kanji">心</span>
      </div>
      <span className="admin-loading__label">{label}</span>
    </div>
  )
}
