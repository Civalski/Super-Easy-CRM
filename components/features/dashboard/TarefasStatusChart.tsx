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
  gradient: string
  bgAccent: string
  dotClass: string
  textClass: string
  borderClass: string
}

const STATUS_ORDER = ['pendente', 'em_andamento', 'concluida'] as const

const STATUS_CONFIG: Record<string, TaskStatusConfig> = {
  pendente: {
    label: 'Pendente',
    gradient: 'from-amber-500 to-yellow-400',
    bgAccent: 'from-amber-500/10 to-transparent',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-600 dark:text-amber-300',
    borderClass: 'border-amber-400/25',
  },
  em_andamento: {
    label: 'Em andamento',
    gradient: 'from-blue-500 to-cyan-400',
    bgAccent: 'from-blue-500/10 to-transparent',
    dotClass: 'bg-blue-400',
    textClass: 'text-blue-600 dark:text-blue-300',
    borderClass: 'border-blue-400/25',
  },
  concluida: {
    label: 'Concluída',
    gradient: 'from-emerald-500 to-green-400',
    bgAccent: 'from-emerald-500/10 to-transparent',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-600 dark:text-emerald-300',
    borderClass: 'border-emerald-400/25',
  },
}

export function TarefasStatusChart({ tarefasPorStatus, oportunidadesCount }: TarefasStatusChartProps) {
  const byStatus = new Map(tarefasPorStatus.map((item) => [item.status, item._count]))

  const normalizedData = STATUS_ORDER.map((status) => {
    const value = byStatus.get(status) ?? 0
    const config = STATUS_CONFIG[status]
    return { status, value, ...config }
  })

  const totalTarefas = normalizedData.reduce((acc, item) => acc + item.value, 0)
  const concluidas = byStatus.get('concluida') ?? 0
  const pendentes = (byStatus.get('pendente') ?? 0) + (byStatus.get('em_andamento') ?? 0)

  const taxaConclusao = totalTarefas > 0 ? (concluidas / totalTarefas) * 100 : 0
  const tarefasPorOportunidade = oportunidadesCount > 0 ? totalTarefas / oportunidadesCount : 0

  return (
    <div className="crm-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fluxo de Tarefas</h3>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
        Equilíbrio entre volume pendente e entregas concluídas
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {normalizedData.map((item) => {
          const percent = totalTarefas > 0 ? (item.value / totalTarefas) * 100 : 0
          return (
            <div
              key={item.status}
              className={`relative overflow-hidden rounded-xl border ${item.borderClass} bg-white/40 p-3.5 dark:bg-slate-900/30`}
            >
              {/* Accent corner */}
              <div
                className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${item.bgAccent} blur-xl`}
              />

              <div className="relative">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${item.dotClass}`} />
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${item.textClass}`}>
                    {item.label}
                  </p>
                </div>
                <p className="text-3xl font-bold leading-none text-gray-900 dark:text-white">{item.value}</p>
                <div className="mt-3 h-1.5 rounded-full bg-gray-100 dark:bg-slate-800/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className={`mt-1.5 text-xs font-medium ${item.textClass} opacity-80`}>
                  {percent.toFixed(0)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-xl border border-emerald-400/25 bg-emerald-500/6 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">
            Taxa de conclusão
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {taxaConclusao.toFixed(1)}%
          </p>
          {/* Mini barra de progresso */}
          <div className="mt-2 h-1 w-full rounded-full bg-emerald-200/40 dark:bg-emerald-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              style={{ width: `${taxaConclusao}%` }}
            />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-amber-400/25 bg-amber-500/6 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70">
            Em aberto
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{pendentes}</p>
          <p className="mt-1 text-[11px] text-amber-600/70 dark:text-amber-300/70">
            {tarefasPorOportunidade.toFixed(1)} por orçamento
          </p>
        </div>
      </div>
    </div>
  )
}
