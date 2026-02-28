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
  colorClass: string
  barClass: string
}

const STATUS_ORDER = [
  'sem_contato',
  'em_potencial',
  'orcamento',
  'fechada',
  'perdida',
] as const

const STATUS_CONFIG: Record<string, StatusConfig> = {
  sem_contato: {
    label: 'Sem contato',
    colorClass: 'text-slate-700 dark:text-slate-300',
    barClass: 'from-slate-500 to-slate-400',
  },
  em_potencial: {
    label: 'Em potencial',
    colorClass: 'text-blue-700 dark:text-blue-300',
    barClass: 'from-blue-500 to-cyan-400',
  },
  orcamento: {
    label: 'Orçamento',
    colorClass: 'text-amber-700 dark:text-amber-300',
    barClass: 'from-amber-500 to-yellow-400',
  },
  fechada: {
    label: 'Fechada',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    barClass: 'from-emerald-500 to-green-400',
  },
  perdida: {
    label: 'Perdida',
    colorClass: 'text-rose-700 dark:text-rose-300',
    barClass: 'from-rose-500 to-red-400',
  },
}

export function OportunidadesChart({ data, totalOportunidades }: OportunidadesChartProps) {
  const byStatus = new Map(data.map((item) => [item.status, item._count]))

  const getStatusCount = (status: (typeof STATUS_ORDER)[number]) => {
    return byStatus.get(status) ?? 0
  }

  const normalizedData = STATUS_ORDER.map((status) => {
    const value = getStatusCount(status)
    const config = STATUS_CONFIG[status]
    const percent = totalOportunidades > 0 ? (value / totalOportunidades) * 100 : 0

    return {
      status,
      value,
      percent,
      ...config,
    }
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Distribuicao por etapa no periodo selecionado</p>
        </div>
        <div className="rounded-xl border border-emerald-300/60 bg-emerald-100/50 px-3 py-2 text-right dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-xs uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">Taxa de ganho</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{taxaConversao.toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {normalizedData.map((item) => (
          <div key={item.status}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className={`font-medium ${item.colorClass}`}>{item.label}</span>
              <span className="text-gray-700 dark:text-gray-300">
                {item.value} <span className="text-gray-500 dark:text-gray-500">({item.percent.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-slate-700/50">
              <div
                className={`h-2.5 rounded-full bg-gradient-to-r ${item.barClass} transition-all duration-500`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
