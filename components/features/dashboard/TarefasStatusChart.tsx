/**
 * Grafico de distribuicao e produtividade de tarefas.
 */
'use client'

interface TarefasPorStatus {
  status: string
  _count: number
}

interface TarefasStatusChartProps {
  tarefasPorStatus: TarefasPorStatus[]
  oportunidadesCount: number
}

type TaskStatusConfig = {
  label: string
  className: string
  textClass: string
}

const STATUS_ORDER = ['pendente', 'em_andamento', 'concluida'] as const

const STATUS_CONFIG: Record<string, TaskStatusConfig> = {
  pendente: {
    label: 'Pendente',
    className: 'from-amber-500 to-yellow-400',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  em_andamento: {
    label: 'Em andamento',
    className: 'from-blue-500 to-cyan-400',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  concluida: {
    label: 'Concluida',
    className: 'from-emerald-500 to-green-400',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
}

export function TarefasStatusChart({ tarefasPorStatus, oportunidadesCount }: TarefasStatusChartProps) {
  const byStatus = new Map(tarefasPorStatus.map((item) => [item.status, item._count]))

  const normalizedData = STATUS_ORDER.map((status) => {
    const value = byStatus.get(status) ?? 0
    const config = STATUS_CONFIG[status]
    return {
      status,
      value,
      ...config,
    }
  })

  const totalTarefas = normalizedData.reduce((acc, item) => acc + item.value, 0)
  const concluidas = byStatus.get('concluida') ?? 0
  const pendentes = (byStatus.get('pendente') ?? 0) + (byStatus.get('em_andamento') ?? 0)

  const taxaConclusao = totalTarefas > 0 ? (concluidas / totalTarefas) * 100 : 0
  const tarefasPorOportunidade = oportunidadesCount > 0 ? totalTarefas / oportunidadesCount : 0

  return (
    <div className="crm-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fluxo de Tarefas</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Equilibrio entre volume pendente e entregas concluidas
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {normalizedData.map((item) => {
          const percent = totalTarefas > 0 ? (item.value / totalTarefas) * 100 : 0
          return (
            <div key={item.status} className="rounded-xl border border-gray-300/60 bg-white/60 p-3 dark:border-slate-600/30 dark:bg-slate-900/25">
              <p className={`text-xs uppercase tracking-wide ${item.textClass}`}>{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
              <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-slate-700/60">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${item.className}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{percent.toFixed(1)}%</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-300/60 bg-emerald-100/50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-xs uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">Taxa de conclusao</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{taxaConclusao.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-amber-300/60 bg-amber-100/50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-xs uppercase tracking-wide text-amber-700/80 dark:text-amber-300/80">Tarefas em aberto</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{pendentes}</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-200/80">{tarefasPorOportunidade.toFixed(2)} por orçamento</p>
        </div>
      </div>
    </div>
  )
}
