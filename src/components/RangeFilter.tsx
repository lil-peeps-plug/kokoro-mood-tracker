import { useI18n } from '@/lib/i18n'
import type { Range } from '@/utils/stats'

interface Props {
  value: Range
  onChange: (next: Range) => void
}

const OPTIONS: ReadonlyArray<Range> = ['7d', '30d', 'all']

export default function RangeFilter({ value, onChange }: Props) {
  const { t } = useI18n()
  return (
    <div
      className="range-filter"
      role="radiogroup"
      aria-label={t.statsRangeLabel}
      data-active={value}
    >
      <span className="range-filter__pill" aria-hidden="true" />
      {OPTIONS.map((opt) => {
        const isActive = value === opt
        const label =
          opt === '7d' ? t.statsRange7d : opt === '30d' ? t.statsRange30d : t.statsRangeAll
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`range-filter__btn${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(opt)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
