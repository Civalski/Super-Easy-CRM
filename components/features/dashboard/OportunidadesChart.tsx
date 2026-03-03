/**
 * Grafico de distribuicao de orçamentos no funil comercial.
 */
'use client'

interface OportunidadesPorStatus {
  status: string
  _count: number
}

interface OportunidadesChartProps {
  data: OportunidadesPorStatus[]
  totalOportunidades: number
}

type StatusConfig = {
  label: string
  dot: string
  barClass: string
  badgeClass: string
}

const STATUS_ORDER = [
  'sem_contato',
  'em_potencial',
  'orcamento',
  'pedido',
  'fechada',
  'perdida',
] as const

const STATUS_CONFIG: Record<string, StatusConfig> = {
  sem_contato: {
    label: 'Sem contato',
    dot: 'bg-slate-400',
    barClass: 'from-slate-500 to-slate-400',
    badgeClass: 'bg-slate-500/10 text-slate-400 dark:text-slate-300',
  },
  em_potencial: {
    label: 'Em potencial',
    dot: 'bg-blue-400',
    barClass: 'from-blue-500 to-cyan-400',
    badgeClass: 'bg-blue-500/10 text-blue-500 dark:text-blue-300',
  },
  orcamento: {
    label: 'Orçamento',
    dot: 'bg-amber-400',
    barClass: 'from-amber-500 to-yellow-400',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  },
  pedido: {
    label: 'Pedido',
    dot: 'bg-indigo-400',
    barClass: 'from-indigo-500 to-blue-400',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  },
  fechada: {
    label: 'Fechada',
    dot: 'bg-emerald-400',
    barClass: 'from-emerald-500 to-green-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  },
  perdida: {
    label: 'Perdida',
    dot: 'bg-rose-400',
    barClass: 'from-rose-500 to-red-400',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  },
}

export function OportunidadesChart({ data, totalOportunidades }: OportunidadesChartProps) {
  const byStatus = new Map(data.map((item) => [item.status, item._count]))

  const normalizedData = STATUS_ORDER.map((status) => {
    const value = byStatus.get(status) ?? 0
    const config = STATUS_CONFIG[status]
    const percent = totalOportunidades > 0 ? (value / totalOportunidades) * 100 : 0
    return { status, value, percent, ...config }
  })

  const fechadas = byStatus.get('fechada') ?? 0
  const perdidas = byStatus.get('perdida') ?? 0
  const encerradas = fechadas + perdidas
  const taxaConversao = encerradas > 0 ? (fechadas / encerradas) * 100 : 0

  return (
    <div className="crm-card p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Funil de Orçamentos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Distribuição por etapa no período selecionado</p>
        </div>
        <div className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/8 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">
            Taxa de ganho
          </p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {taxaConversao.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {normalizedData.map((item) => (
          <div key={item.status} className="group">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${item.badgeClass}`}>
                  {item.value}
                </span>
                <span className="w-10 text-right text-xs text-gray-400 dark:text-gray-500">
                  {item.percent.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800/60">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${item.barClass} transition-all duration-700`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total na base */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100/80 pt-3 dark:border-slate-700/50">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total no período</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{totalOportunidades}</span>
      </div>
    </div>
  )
}
