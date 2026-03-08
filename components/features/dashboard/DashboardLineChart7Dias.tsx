/**
 * Gráfico de linha compacto para métricas dos últimos 7 dias
 */
'use client'

import { formatCurrencyInt } from '@/lib/format'

interface SerieItem {
  date: string
  valor?: number
  count?: number
}

interface DashboardLineChart7DiasProps {
  title: string
  data: SerieItem[]
  color: 'green' | 'red' | 'blue'
  type: 'valor' | 'count'
  periodType?: 'day' | 'week'
}

const formatDay = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}`
}

const formatLabel = (value: string, periodType: 'day' | 'week') => {
  if (periodType === 'week') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (!match) return value
    const day = parseInt(match[3], 10)
    const weekNum = Math.floor((day - 1) / 7) + 1
    return `Sem ${weekNum}`
  }
  return formatDay(value)
}

const CHART_W = 400
const CHART_H = 120
const PAD_X = 12
const PAD_Y = 12
const INNER_W = CHART_W - PAD_X * 2
const INNER_H = CHART_H - PAD_Y * 2

const COLOR_MAP = {
  green: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' },
  red: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' },
  blue: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
} as const

function linePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  return points.reduce((d, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`), '')
}

function areaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return ''
  const linePathStr = linePath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${linePathStr} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}

function getValue(item: SerieItem): number {
  if (item.valor !== undefined) return item.valor
  if (item.count !== undefined) return item.count
  return 0
}

export function DashboardLineChart7Dias({
  title,
  data,
  color,
  type,
  periodType = 'day',
}: DashboardLineChart7DiasProps) {
  const safeData = Array.isArray(data) ? data : []
  const values = safeData.map(getValue)
  const maxValue = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)

  const points = safeData.map((item, index) => ({
    x: PAD_X + (safeData.length > 1 ? (index / (safeData.length - 1)) * INNER_W : INNER_W / 2),
    y: PAD_Y + INNER_H - (getValue(item) / maxValue) * INNER_H,
  }))

  const baselineY = PAD_Y + INNER_H
  const colors = COLOR_MAP[color]

  const totalLabel =
    type === 'valor' ? formatCurrencyInt(total) : total.toString()

  return (
    <div className="crm-card flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span
          className="text-xs font-semibold"
          style={{ color: colors.stroke }}
        >
          {totalLabel}
        </span>
      </div>

      {safeData.length > 0 ? (
        <div className="flex flex-1 flex-col">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full flex-1"
            style={{ minHeight: '80px' }}
            role="img"
            aria-label={`Gráfico de linha: ${title} nos últimos 7 dias`}
          >
            <defs>
              <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.25" />
                <stop offset="100%" stopColor={colors.stroke} stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3].map((step) => {
              const y = PAD_Y + (step / 3) * INNER_H
              return (
                <line
                  key={step}
                  x1={PAD_X}
                  y1={y}
                  x2={PAD_X + INNER_W}
                  y2={y}
                  stroke="currentColor"
                  className="text-gray-200 dark:text-slate-700/70"
                  strokeWidth="1"
                  strokeDasharray={step > 0 ? '3 3' : undefined}
                />
              )
            })}

            <path
              d={areaPath(points, baselineY)}
              fill={`url(#area-${color})`}
            />

            <path
              d={linePath(points)}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={colors.stroke}
                  stroke="white"
                  strokeWidth="1"
                />
              </g>
            ))}
          </svg>

          <div className="mt-2 flex justify-between gap-1 text-[10px] text-gray-500 dark:text-gray-400">
            {safeData.map((item) => (
              <span key={item.date} className="flex-1 truncate text-center">
                {formatLabel(item.date, periodType)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Sem dados nos últimos 7 dias
        </p>
      )}
    </div>
  )
}
