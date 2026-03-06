/**
 * Grafico de composicao financeira em formato de pizza (donut).
 */
'use client'

import { formatCurrencyInt, formatCurrencyCompact } from '@/lib/format'

interface ValorPipelineChartProps {
  valorTotal: number
  valorGanhos: number
  valorPerdidos: number
}

const composicaoConfig = [
  {
    key: 'aberto',
    label: 'Em aberto',
    color: '#06b6d4',
    dotClass: 'bg-cyan-400',
    textClass: 'text-cyan-600 dark:text-cyan-300',
    barClass: 'from-cyan-500 to-cyan-400',
    borderClass: 'border-cyan-400/25',
    bgClass: 'bg-cyan-500/8',
  },
  {
    key: 'ganhos',
    label: 'Vendas',
    color: '#10b981',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-600 dark:text-emerald-300',
    barClass: 'from-emerald-500 to-green-400',
    borderClass: 'border-emerald-400/25',
    bgClass: 'bg-emerald-500/8',
  },
  {
    key: 'perdidos',
    label: 'Orcamentos cancelados',
    color: '#f43f5e',
    dotClass: 'bg-rose-400',
    textClass: 'text-rose-600 dark:text-rose-300',
    barClass: 'from-rose-500 to-red-400',
    borderClass: 'border-rose-400/25',
    bgClass: 'bg-rose-500/8',
  },
] as const

export function ValorPipelineChart({
  valorTotal,
  valorGanhos,
  valorPerdidos,
}: ValorPipelineChartProps) {
  const valorEmAberto = Math.max(valorTotal, 0)
  const totalComposicao = valorEmAberto + valorGanhos + valorPerdidos

  const values: Record<string, number> = {
    aberto: valorEmAberto,
    ganhos: valorGanhos,
    perdidos: valorPerdidos,
  }

  const slices = composicaoConfig.map((item, index) => {
    const value = values[item.key] ?? 0
    const percent = totalComposicao > 0 ? (value / totalComposicao) * 100 : 0
    const start = composicaoConfig
      .slice(0, index)
      .reduce((sum, prev) => sum + (totalComposicao > 0 ? ((values[prev.key] ?? 0) / totalComposicao) * 100 : 0), 0)
    const end = start + percent
    return { ...item, value, percent, start, end }
  })

  const donutBackground =
    totalComposicao > 0
      ? `conic-gradient(${slices.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`
      : 'conic-gradient(#334155 0% 100%)'

  return (
    <div className="crm-card flex flex-col p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Composição de Valor</h3>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
        Relação entre em aberto, ganhos e perdas no período
      </p>

      <div className="mt-5 flex flex-1 flex-col justify-center gap-5 sm:grid sm:grid-cols-[200px_1fr] sm:items-center">
        {/* Donut */}
        <div className="relative mx-auto h-48 w-48">
          <div
            className="h-full w-full rounded-full"
            style={{ background: donutBackground }}
            aria-label="Gráfico de pizza da composição de valor"
          />
          {/* Buraco central do donut */}
          <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-[var(--background)] text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Total
            </span>
            <span className="mt-0.5 px-2 text-sm font-bold leading-tight text-gray-900 dark:text-gray-100">
              {formatCurrencyCompact(totalComposicao)}
            </span>
          </div>
        </div>

        {/* Legenda */}
        <div className="space-y-2">
          {slices.map((item) => (
            <div
              key={item.key}
              className={`flex items-center justify-between rounded-xl border ${item.borderClass} ${item.bgClass} px-3 py-2.5`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${item.dotClass} shrink-0`} />
                <span className={`text-sm font-medium ${item.textClass}`}>{item.label}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {formatCurrencyCompact(item.value)}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {item.percent.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
