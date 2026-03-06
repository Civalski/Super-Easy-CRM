'use client'

import { formatCurrencyInt } from '@/lib/format'

interface FaturamentoPerdaItem {
  month: string
  faturamento: number
  perda: number
}

interface FaturamentoPerdaLineChartProps {
  data: FaturamentoPerdaItem[]
}

const formatMonth = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return value
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthIndex = Number(match[2]) - 1
  return `${monthNames[monthIndex] ?? match[2]}/${match[1].slice(2)}`
}

const CHART_W = 640
const CHART_H = 200
const PAD_X = 16
const PAD_Y = 16
const INNER_W = CHART_W - PAD_X * 2
const INNER_H = CHART_H - PAD_Y * 2

function smoothCurvePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x} ${p2.y}`
  }
  return d
}

function areaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return ''
  const linePath = smoothCurvePath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}

export function FaturamentoPerdaLineChart({ data }: FaturamentoPerdaLineChartProps) {
  const safeData = Array.isArray(data) ? data : []
  const maxValue = Math.max(1, ...safeData.map((item) => Math.max(item.faturamento, item.perda)))

  const faturamentoPoints = safeData.map((item, index) => ({
    x: PAD_X + (safeData.length > 1 ? (index / (safeData.length - 1)) * INNER_W : INNER_W / 2),
    y: PAD_Y + INNER_H - (item.faturamento / maxValue) * INNER_H,
  }))

  const perdaPoints = safeData.map((item, index) => ({
    x: PAD_X + (safeData.length > 1 ? (index / (safeData.length - 1)) * INNER_W : INNER_W / 2),
    y: PAD_Y + INNER_H - (item.perda / maxValue) * INNER_H,
  }))

  const baselineY = PAD_Y + INNER_H

  const totalFaturamento = safeData.reduce((acc, item) => acc + item.faturamento, 0)
  const totalPerda = safeData.reduce((acc, item) => acc + item.perda, 0)

  return (
    <div className="crm-card flex flex-col p-6">
      <div className="mb-5 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Faturamento x Perda</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Comparativo dos últimos 6 meses</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">{formatCurrencyInt(totalFaturamento)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">{formatCurrencyInt(totalPerda)}</span>
          </div>
        </div>
      </div>

      {safeData.length > 0 ? (
        <div className="flex flex-1 flex-col">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full flex-1"
            style={{ minHeight: '120px' }}
            role="img"
            aria-label="Gráfico de área comparando faturamento e perda nos últimos 6 meses"
          >
            <defs>
              <linearGradient id="fat-area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="perda-area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grade horizontal */}
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
                  className="text-gray-200 dark:text-slate-700/70"
                  strokeWidth="1"
                  strokeDasharray={step > 0 ? '4 4' : undefined}
                />
              )
            })}

            {/* Área de preenchimento - faturamento */}
            <path
              d={areaPath(faturamentoPoints, baselineY)}
              fill="url(#fat-area-gradient)"
            />

            {/* Área de preenchimento - perda */}
            <path
              d={areaPath(perdaPoints, baselineY)}
              fill="url(#perda-area-gradient)"
            />

            {/* Linha suave - faturamento */}
            <path
              d={smoothCurvePath(faturamentoPoints)}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Linha suave - perda */}
            <path
              d={smoothCurvePath(perdaPoints)}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pontos - faturamento */}
            {faturamentoPoints.map((point, index) => (
              <g key={`f-${index}`}>
                <circle cx={point.x} cy={point.y} r="5" fill="#10b981" opacity="0.25" />
                <circle cx={point.x} cy={point.y} r="3" fill="#10b981" stroke="white" strokeWidth="1.5" />
              </g>
            ))}

            {/* Pontos - perda */}
            {perdaPoints.map((point, index) => (
              <g key={`p-${index}`}>
                <circle cx={point.x} cy={point.y} r="5" fill="#f43f5e" opacity="0.25" />
                <circle cx={point.x} cy={point.y} r="3" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
              </g>
            ))}
          </svg>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="h-2 w-4 rounded-full bg-emerald-500" />
                Faturamento
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="h-2 w-4 rounded-full bg-rose-500" />
                Perda
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {safeData.map((item) => (
                <span
                  key={item.month}
                  className="rounded-md bg-gray-100/80 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-slate-800/80 dark:text-gray-400"
                >
                  {formatMonth(item.month)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados para os últimos 6 meses.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span className="h-2 w-4 rounded-full bg-emerald-500" />
              Faturamento
            </span>
            <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span className="h-2 w-4 rounded-full bg-rose-500" />
              Perda
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
