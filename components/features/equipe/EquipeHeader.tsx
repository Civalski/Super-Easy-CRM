'use client'

import { BarChart3, RefreshCw, Users } from '@/lib/icons'
import { TEAM_PERIOD_OPTIONS } from './constants'
import type { TeamPeriod } from './types'

interface EquipeHeaderProps {
  activePeriod: TeamPeriod
  onPeriodChange: (period: TeamPeriod) => void
  memberCount: number
  teamName: string | null
  periodLabel: string
  isRefreshing: boolean
  onRefresh: () => void
}

export function EquipeHeader({
  activePeriod,
  onPeriodChange,
  memberCount,
  teamName,
  periodLabel,
  isRefreshing,
  onRefresh,
}: EquipeHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-linear-to-br from-emerald-500 to-cyan-400 p-3 shadow-lg shadow-emerald-950/20 ring-1 ring-white/10">
          <Users className="h-7 w-7 text-white" />
        </div>

        <div className="space-y-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Equipe</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Painel do gerente com desempenho basico dos usuarios normais vinculados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="rounded-full border border-slate-300/70 px-2.5 py-1 dark:border-slate-700">
              {teamName || 'Equipe do gerente'}
            </span>
            <span className="rounded-full border border-slate-300/70 px-2.5 py-1 dark:border-slate-700">
              {memberCount} membro{memberCount === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-slate-300/70 px-2.5 py-1 dark:border-slate-700">
              {periodLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <div className="flex items-center gap-1 rounded-2xl border border-slate-300/70 bg-white/70 p-1 dark:border-slate-700 dark:bg-slate-900/55">
          {TEAM_PERIOD_OPTIONS.map((option) => {
            const active = option.value === activePeriod
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onPeriodChange(option.value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/70 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Atualizar
        </button>

        <div className="hidden items-center gap-2 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200 sm:inline-flex">
          <BarChart3 size={16} />
          Visao consolidada do time
        </div>
      </div>
    </div>
  )
}
