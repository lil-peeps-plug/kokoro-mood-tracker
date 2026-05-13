interface Props {
  label: string
  value: string
  hint?: string
}

export default function StatTile({ label, value, hint }: Props) {
  return (
    <div className="stat-tile" role="group" aria-label={label}>
      <span className="stat-tile__label">{label}</span>
      <span className="stat-tile__value">{value}</span>
      {hint && <span className="stat-tile__hint">{hint}</span>}
    </div>
  )
}
