'use client'

import { Calendar, ClipboardList, FileText, MessageCircle, TrendingUp } from '@/lib/icons'
import { TEAM_METRIC_LABELS } from './constants'
import { formatMetricValue } from './utils'
import type { TeamMetrics } from './types'

interface EquipeOverviewCardsProps {
  metrics: TeamMetrics
}

const CARD_META = [
  { key: 'contatos', icon: MessageCircle, accent: 'from-cyan-500 to-sky-400' },
  { key: 'tarefas', icon: Calendar, accent: 'from-amber-500 to-orange-400' },
  { key: 'orcamentos', icon: FileText, accent: 'from-violet-500 to-indigo-400' },
  { key: 'pedidos', icon: ClipboardList, accent: 'from-emerald-500 to-green-400' },
  { key: 'faturamento', icon: TrendingUp, accent: 'from-rose-500 to-pink-400' },
] as const

export function EquipeOverviewCards({ metrics }: EquipeOverviewCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {CARD_META.map((card) => {
        const value = metrics[card.key]
        const Icon = card.icon

        return (
          <article key={card.key} className="crm-card overflow-hidden p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  {TEAM_METRIC_LABELS[card.key]}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {formatMetricValue(card.key, value)}
                </p>
              </div>

              <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-2.5 text-white shadow-lg`}>
                <Icon size={18} />
              </div>
            </div>

            <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${card.accent} opacity-75`} />
          </article>
        )
      })}
    </section>
  )
}
