import { useEffect, useRef } from 'react'
import { Chart, type ChartConfiguration } from 'chart.js'
import {
  CHART_GRID,
  CHART_LINE,
  CHART_LINE_FILL,
  CHART_POINT,
  CHART_POINT_BORDER,
  CHART_TEXT,
  CHART_TEXT_FAINT,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
} from '@/utils/chartTheme'
import { aggregateByDay, type MoodEntry } from '@/utils/stats'
import { useI18n, type Locale } from '@/lib/i18n'

interface Props {
  entries: readonly MoodEntry[]
}

function formatDayLabel(isoDate: string, locale: Locale): string {
  // isoDate is YYYY-MM-DD in local timezone (from aggregateByDay).
  const [yStr, mStr, dStr] = isoDate.split('-')
  const y = Number(yStr)
  const m = Number(mStr)
  const d = Number(dStr)
  const date = new Date(y, (m || 1) - 1, d || 1)
  const tag = locale === 'ru' ? 'ru-RU' : locale === 'ka' ? 'ka-GE' : 'en-US'
  return new Intl.DateTimeFormat(tag, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function MoodTrendChart({ entries }: Props) {
  const { locale } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const points = aggregateByDay(entries)

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: points.map((p) => formatDayLabel(p.date, locale)),
        datasets: [
          {
            label: 'mood',
            data: points.map((p) => p.avg),
            borderColor: CHART_LINE,
            backgroundColor: CHART_LINE_FILL,
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: CHART_POINT,
            pointBorderColor: CHART_POINT_BORDER,
            pointBorderWidth: 1.5,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
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
              label: (ctx) => `${Number(ctx.parsed.y).toFixed(1)} / 5`,
            },
          },
        },
        scales: {
          y: {
            min: 1,
            max: 5,
            ticks: {
              stepSize: 1,
              color: CHART_TEXT_FAINT,
              font: { size: 11 },
            },
            grid: { color: CHART_GRID },
            border: { display: false },
          },
          x: {
            ticks: {
              color: CHART_TEXT_FAINT,
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    }

    const chart = new Chart(canvasRef.current, config)
    return () => chart.destroy()
  }, [entries, locale])

  return (
    <div className="chart">
      <canvas ref={canvasRef} className="chart__canvas" />
    </div>
  )
}
