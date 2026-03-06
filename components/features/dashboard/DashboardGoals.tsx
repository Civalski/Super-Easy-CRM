/**
 * Bloco de metas no dashboard
 */
'use client'

import Link from 'next/link'
import {
  Target,
  Users,
  FileText,
  UserPlus,
  DollarSign,
  CheckCircle2,
  Search,
  ArrowRight,
} from '@/lib/icons'
import { formatCurrency } from '@/lib/format'

type GoalMetricType =
  | 'CLIENTES_CONTATADOS'
  | 'PROPOSTAS'
  | 'CLIENTES_CADASTRADOS'
  | 'VENDAS'
  | 'QUALIFICACAO'
  | 'PROSPECCAO'
  | 'FATURAMENTO'

type GoalPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

interface GoalSummary {
  id: string
  title?: string | null
  metricType: GoalMetricType
  periodType: GoalPeriodType
  target: number
  current?: number
  progress?: number
  periodStart?: string
  periodEnd?: string
  active?: boolean
}

interface DashboardGoalsProps {
  goals: GoalSummary[]
  loading: boolean
}

const metricIcons: Record<GoalMetricType, React.ElementType> = {
  CLIENTES_CONTATADOS: Users,
  PROPOSTAS: FileText,
  CLIENTES_CADASTRADOS: UserPlus,
  VENDAS: DollarSign,
  QUALIFICACAO: CheckCircle2,
  PROSPECCAO: Search,
  FATURAMENTO: DollarSign,
}

const metricLabels: Record<GoalMetricType, string> = {
  CLIENTES_CONTATADOS: 'Contatos',
  PROPOSTAS: 'Orçamentos',
  CLIENTES_CADASTRADOS: 'Cadastros',
  VENDAS: 'Vendas',
  QUALIFICACAO: 'Em potencial',
  PROSPECCAO: 'Sem contato',
  FATURAMENTO: 'Faturamento',
}

const periodLabels: Record<GoalPeriodType, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  CUSTOM: 'Personalizada',
}

const formatGoalValue = (metricType: GoalMetricType, value: number) => {
  if (metricType === 'FATURAMENTO') {
    return formatCurrency(value)
  }
  return new Intl.NumberFormat('pt-BR').format(value)
}

const sanitizeMockText = (value?: string | null) =>
  (value || '')
    .replace(/\bmock\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-:|•]+|[\s\-:|•]+$/g, '')
    .trim()

export function DashboardGoals({ goals, loading }: DashboardGoalsProps) {
  const activeGoals = goals.filter((goal) => goal.active !== false)
  const displayedGoals = activeGoals.slice(0, 4)

  if (loading) {
    return (
      <div className="crm-card p-5 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-sm mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            />
          ))}
        </div>
      </div>
    )
  }

  if (displayedGoals.length === 0) {
    return null // Ocultar se não houver metas para economizar espaço
  }

  return (
    <div className="crm-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Target size={18} />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Metas de Desempenho
          </h2>
        </div>
        <Link
          href="/metas"
          className="text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          Ver todas
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedGoals.map((goal) => {
          const progressValue = typeof goal.progress === 'number' ? goal.progress : 0
          const currentValue = goal.current ?? 0
          const Icon = metricIcons[goal.metricType] || Target

          // Determine color based on progress
          let colorClass = 'bg-blue-600'
          let bgClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'

          if (progressValue >= 100) {
            colorClass = 'bg-green-500'
            bgClass = 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          } else if (progressValue < 30) {
            // Low progress warning color could be added here if desired
          }

          const sanitizedTitle = sanitizeMockText(goal.title) || metricLabels[goal.metricType]

          return (
            <Link
              key={goal.id}
              href="/metas"
              className="group relative flex flex-col justify-between border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
              aria-label={`Abrir meta ${sanitizedTitle}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${bgClass}`}>
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                  {periodLabels[goal.periodType]}
                </span>
              </div>

              <div>
                <div className="flex items-end justify-between mb-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                    {formatGoalValue(goal.metricType, currentValue)}
                    <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
                      / {formatGoalValue(goal.metricType, goal.target)}
                    </span>
                  </span>
                  <span className={`text-xs font-bold ${progressValue >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {progressValue}%
                  </span>
                </div>

                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 truncate" title={sanitizedTitle}>
                  {sanitizedTitle}
                </h3>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
                    style={{ width: `${Math.min(progressValue, 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

