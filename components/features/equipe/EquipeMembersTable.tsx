'use client'

import { TEAM_METRIC_LABELS } from './constants'
import { formatMetricValue, getMemberLabel } from './utils'
import type { TeamMemberPerformance, TeamMetrics, TeamPeriod } from './types'

interface EquipeMembersTableProps {
  members: TeamMemberPerformance[]
  activePeriod: TeamPeriod
}

const METRIC_COLUMNS: Array<keyof TeamMetrics> = [
  'contatos',
  'tarefas',
  'orcamentos',
  'pedidos',
  'faturamento',
]

export function EquipeMembersTable({ members, activePeriod }: EquipeMembersTableProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Usuarios vinculados</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ordenacao por impacto no periodo selecionado.
          </p>
        </div>
      </div>

      <div className="hidden overflow-hidden crm-card lg:block">
        <div className="crm-table-head grid grid-cols-[56px_minmax(0,1.5fr)_repeat(4,minmax(92px,0.8fr))_minmax(132px,1fr)] gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-300">
          <span>#</span>
          <span>Usuario</span>
          {METRIC_COLUMNS.map((metric) => (
            <span key={metric} className={metric === 'faturamento' ? 'text-right' : ''}>
              {TEAM_METRIC_LABELS[metric]}
            </span>
          ))}
        </div>

        <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
          {members.map((member, index) => {
            const metrics = member.metrics[activePeriod]
            return (
              <div
                key={member.userId}
                className="grid grid-cols-[56px_minmax(0,1.5fr)_repeat(4,minmax(92px,0.8fr))_minmax(132px,1fr)] items-center gap-3 px-4 py-3.5"
              >
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {getMemberLabel(member)}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{member.username}</p>
                </div>

                {METRIC_COLUMNS.map((metric) => (
                  <span
                    key={metric}
                    className={`text-sm font-medium text-gray-700 dark:text-gray-200 ${
                      metric === 'faturamento' ? 'text-right font-semibold' : ''
                    }`}
                  >
                    {formatMetricValue(metric, metrics[metric])}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {members.map((member, index) => {
          const metrics = member.metrics[activePeriod]
          return (
            <article key={member.userId} className="crm-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {index + 1}. {getMemberLabel(member)}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{member.username}</p>
                </div>

                <span className="rounded-full border border-slate-300/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {activePeriod}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {METRIC_COLUMNS.map((metric) => (
                  <div key={metric} className="rounded-2xl bg-slate-100/80 px-3 py-2 dark:bg-slate-800/70">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      {TEAM_METRIC_LABELS[metric]}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatMetricValue(metric, metrics[metric])}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
