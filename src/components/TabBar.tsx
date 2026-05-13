import { useI18n } from '@/lib/i18n'

export type TabKey = 'log' | 'stats'

interface Props {
  active: TabKey
  onChange: (tab: TabKey) => void
}

interface TabDef {
  key: TabKey
  icon: string
}

const TABS: readonly TabDef[] = [
  { key: 'log', icon: '♥' },
  { key: 'stats', icon: '◔' },
]

export default function TabBar({ active, onChange }: Props) {
  const { t } = useI18n()
  return (
    <nav className="tab-bar" data-active={active} aria-label="Primary">
      <span className="tab-bar__pill" aria-hidden="true" />
      {TABS.map((tab) => {
        const isActive = active === tab.key
        const label = tab.key === 'log' ? t.tabLog : t.tabStats
        return (
          <button
            key={tab.key}
            type="button"
            className={`tab-bar__btn${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(tab.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="tab-bar__icon" aria-hidden="true">
              {tab.icon}
            </span>
            {label}
          </button>
        )
      })}
    </nav>
  )
}
