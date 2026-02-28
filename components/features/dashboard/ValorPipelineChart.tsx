/**
 * Grafico de composicao financeira em formato de pizza (donut).
 */
'use client'

interface ValorPipelineChartProps {
  valorTotal: number
  valorGanhos: number
  valorPerdidos: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value || 0)

export function ValorPipelineChart({
  valorTotal,
  valorGanhos,
  valorPerdidos,
}: ValorPipelineChartProps) {
  const valorEmAberto = Math.max(valorTotal - valorGanhos, 0)
  const totalComposicao = valorEmAberto + valorGanhos + valorPerdidos

  const composicao = [
    {
      key: 'aberto',
      label: 'Em aberto',
      value: valorEmAberto,
      color: '#06b6d4',
      textClass: 'text-cyan-700 dark:text-cyan-300',
      dotClass: 'bg-cyan-500',
    },
    {
      key: 'ganhos',
      label: 'Ganhos',
      value: valorGanhos,
      color: '#10b981',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      dotClass: 'bg-emerald-500',
    },
    {
      key: 'perdidos',
      label: 'Perdidos',
      value: valorPerdidos,
      color: '#f43f5e',
      textClass: 'text-rose-700 dark:text-rose-300',
      dotClass: 'bg-rose-500',
    },
  ] as const

  let acumulado = 0
  const slices = composicao.map((item) => {
    const percent = totalComposicao > 0 ? (item.value / totalComposicao) * 100 : 0
    const start = acumulado
    acumulado += percent

    return {
      ...item,
      percent,
      start,
      end: acumulado,
    }
  })

  const donutBackground = totalComposicao > 0
    ? `conic-gradient(${slices
      .map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`)
      .join(', ')})`
    : 'conic-gradient(#cbd5e1 0% 100%)'

  return (
    <div className="crm-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Composicao de Valor</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Relacao entre em aberto, ganhos e perdas no periodo
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr] sm:items-center">
        <div className="relative mx-auto h-52 w-52">
          <div
            className="h-full w-full rounded-full shadow-inner"
            style={{ background: donutBackground }}
            aria-label="Grafico de pizza da composicao de valor"
          />
          <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full border border-[color:var(--shell-border)] bg-[var(--background)] text-center">
            <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</span>
            <span className="px-2 text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalComposicao)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {slices.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
                <span className={`font-medium ${item.textClass}`}>{item.label}</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                {formatCurrency(item.value)} <span className="text-gray-500">({item.percent.toFixed(1)}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
