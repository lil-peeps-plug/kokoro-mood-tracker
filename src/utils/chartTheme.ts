// ============================================================
//  Chart.js registration + shared theme. Imported once from the
//  app entry of any chart component; subsequent imports are no-ops.
// ============================================================

import {
  Chart,
  ArcElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
)

// Theme constants ------------------------------------------------------------

export const CHART_FONT_FAMILY =
  "'Noto Sans', 'Noto Sans JP', 'Noto Sans Georgian', system-ui"

export const CHART_TEXT = 'rgba(196, 186, 173, 0.92)' // warm muted
export const CHART_TEXT_FAINT = 'rgba(196, 186, 173, 0.55)'
export const CHART_GRID = 'rgba(255, 255, 255, 0.05)'
export const CHART_TOOLTIP_BG = 'rgba(16, 14, 22, 0.92)'
export const CHART_TOOLTIP_BORDER = 'rgba(255, 255, 255, 0.06)'

// Mood-line palette — soft cream against the dark card.
export const CHART_LINE = 'rgba(230, 195, 159, 0.95)' // warm cream (accent)
export const CHART_LINE_FILL = 'rgba(230, 195, 159, 0.12)'
export const CHART_POINT = 'rgba(230, 195, 159, 1)'
export const CHART_POINT_BORDER = 'rgba(20, 15, 28, 1)'

// Per-score doughnut palette — cool → warm spectrum 1 → 5.
export const SCORE_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#8a8fc4', // muted blue-purple
  2: '#a18cc8', // soft purple
  3: '#b693c1', // mauve
  4: '#d29bb1', // dusty rose
  5: '#e6c39f', // warm cream
}

// Apply global defaults once.
Chart.defaults.font.family = CHART_FONT_FAMILY
Chart.defaults.color = CHART_TEXT
Chart.defaults.borderColor = CHART_GRID
