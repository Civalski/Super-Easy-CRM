/**
 * Gráfico de linha compacto para métricas dos últimos 7 dias
 * Exibe valor de cada dia e design aprimorado
 */
'use client'

import { useState } from 'react'
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
  const [, , month, day] = match
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

const formatValueDisplay = (value: number, type: 'valor' | 'count') => {
  if (type === 'valor') return formatCurrencyInt(value)
  return value.toString()
}

const CHART_W = 400
const CHART_H = 140
const PAD_X = 16
const PAD_Y = 16
const INNER_W = CHART_W - PAD_X * 2
const INNER_H = CHART_H - PAD_Y * 2

const COLOR_MAP = {
  green: {
    stroke: '#059669',
    strokeLight: '#10b981',
  },
  red: {
    stroke: '#dc2626',
    strokeLight: '#f43f5e',
  },
  blue: {
    stroke: '#2563eb',
    strokeLight: '#3b82f6',
  },
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
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
    <div className="crm-card group relative flex flex-col overflow-hidden border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/50">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-slate-700/50">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
          {title}
        </h3>
        <span
          className="rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
          style={{
            color: colors.stroke,
            backgroundColor: `${colors.stroke}15`,
          }}
        >
          {totalLabel}
        </span>
      </div>

      {safeData.length > 0 ? (
        <div className="flex flex-1 flex-col">
          <div className="relative">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="w-full"
              style={{ minHeight: '100px' }}
              role="img"
              aria-label={`Gráfico de linha: ${title} nos últimos 7 dias`}
            >
              <defs>
                <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.strokeLight} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((step) => {
                const y = PAD_Y + (step / 4) * INNER_H
                return (
                  <line
                    key={step}
                    x1={PAD_X}
                    y1={y}
                    x2={PAD_X + INNER_W}
                    y2={y}
                    stroke="currentColor"
                    className="text-gray-100 dark:text-slate-800"
                    strokeWidth="1"
                    strokeDasharray={step > 0 ? '4 4' : undefined}
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
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((point, index) => {
                const isHovered = hoveredIndex === index
                const value = getValue(safeData[index])
                return (
                  <g
                    key={index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isHovered ? 6 : 4}
                      fill={colors.stroke}
                      stroke="white"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      className="transition-all duration-150 dark:stroke-slate-900"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Tooltip no hover */}
            {hoveredIndex !== null && (
              <div
                className="pointer-events-none absolute right-0 top-0 z-10 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium shadow-lg dark:border-slate-600 dark:bg-slate-800"
              >
                <div className="text-gray-500 dark:text-slate-400">
                  {formatLabel(safeData[hoveredIndex].date, periodType)}
                </div>
                <div style={{ color: colors.stroke }} className="font-semibold">
                  {type === 'valor'
                    ? formatCurrencyInt(getValue(safeData[hoveredIndex]))
                    : getValue(safeData[hoveredIndex]).toString()}
                </div>
              </div>
            )}
          </div>

          {/* Eixo X: data + valor de cada dia */}
          <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${safeData.length}, minmax(0, 1fr))` }}>
            {safeData.map((item) => (
              <div
                key={item.date}
                className="flex min-w-0 flex-col items-center overflow-hidden text-center"
              >
                <span className="truncate text-[10px] font-medium text-gray-500 dark:text-slate-400">
                  {formatLabel(item.date, periodType)}
                </span>
                <span
                  className="mt-0.5 truncate text-[11px] font-semibold tabular-nums"
                  style={{ color: colors.stroke }}
                  title={type === 'valor' ? formatCurrencyInt(getValue(item)) : getValue(item).toString()}
                >
                  {formatValueDisplay(getValue(item), type)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
          Sem dados nos últimos 7 dias
        </p>
      )}
    </div>
  )
}
