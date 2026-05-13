import { useEffect, useRef } from 'react'
import { Chart, type ChartConfiguration } from 'chart.js'
import {
  CHART_TEXT,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  SCORE_COLORS,
} from '@/utils/chartTheme'
import { computeStats, type MoodEntry, type Score } from '@/utils/stats'
import { useI18n } from '@/lib/i18n'

interface Props {
  entries: readonly MoodEntry[]
}

const SCORES: readonly Score[] = [1, 2, 3, 4, 5]

export default function MoodDistributionChart({ entries }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const { distribution } = computeStats(entries)
    const data = SCORES.map((s) => distribution[s])

    const labels = SCORES.map((s) => `${s} · ${t.logScoreLabels[s]}`)

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: SCORES.map((s) => SCORE_COLORS[s]),
            borderColor: 'rgba(20, 15, 28, 0.9)',
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        animation: { duration: 600 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: CHART_TEXT,
              boxWidth: 10,
              boxHeight: 10,
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: CHART_TOOLTIP_BG,
            borderColor: CHART_TOOLTIP_BORDER,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            titleColor: CHART_TEXT,
            bodyColor: CHART_TEXT,
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.parsed)
                return `${v}`
              },
            },
          },
        },
      },
    }

    const chart = new Chart(canvasRef.current, config)
    return () => chart.destroy()
  }, [entries, t])

  return (
    <div className="chart chart--doughnut">
      <canvas ref={canvasRef} className="chart__canvas" />
    </div>
  )
}
