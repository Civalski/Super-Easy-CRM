/**
 * Bloco de metas no dashboard
 */
'use client'

import Link from 'next/link'
import { Target } from 'lucide-react'

type GoalMetricType =
  | 'CLIENTES_CONTATADOS'
  | 'PROPOSTAS'
  | 'CLIENTES_CADASTRADOS'
  | 'VENDAS'
  | 'QUALIFICACAO'
  | 'NEGOCIACAO'
  | 'PROSPECCAO'

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

const metricLabels: Record<GoalMetricType, string> = {
  CLIENTES_CONTATADOS: 'Clientes contatados',
  PROPOSTAS: 'Propostas',
  CLIENTES_CADASTRADOS: 'Clientes cadastrados',
  VENDAS: 'Vendas',
  QUALIFICACAO: 'Qualificacao',
  NEGOCIACAO: 'Negociacao',
  PROSPECCAO: 'Prospeccao',
}

const periodLabels: Record<GoalPeriodType, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  CUSTOM: 'Personalizada',
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function DashboardGoals({ goals, loading }: DashboardGoalsProps) {
  const activeGoals = goals.filter((goal) => goal.active !== false)
  const displayedGoals = activeGoals.slice(0, 4)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Metas ativas</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Metas automaticas com repeticao por periodo
            </p>
          </div>
        </div>
        <Link
          href="/metas"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Ver todas
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Carregando metas...</p>
      ) : displayedGoals.length === 0 ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Nenhuma meta automatica ativa.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedGoals.map((goal) => {
            const progressValue = typeof goal.progress === 'number' ? goal.progress : 0
            const currentValue = goal.current ?? 0
            const displayTitle =
              goal.title?.trim() || metricLabels[goal.metricType] || goal.metricType
            return (
              <div
                key={goal.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{displayTitle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {metricLabels[goal.metricType] ?? goal.metricType} ·{' '}
                      {periodLabels[goal.periodType] ?? goal.periodType}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {currentValue}/{goal.target}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Periodo atual: {formatDate(goal.periodStart)} -{' '}
                      {formatDate(goal.periodEnd)}
                    </span>
                    <span>{progressValue}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(progressValue, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
