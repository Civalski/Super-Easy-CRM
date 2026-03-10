'use client'

import { useState } from 'react'
import { CheckSquare, DollarSign, User, Plus, ChevronDown, ChevronUp } from '@/lib/icons'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ActivityModal from './ActivityModal'
import { useAtividadesRecentes } from '@/lib/hooks/useDashboardData'
import type { DashboardActivity, DashboardActivityType } from '@/types/dashboard'

interface AtividadesRecentesProps {
  onRefreshRequest?: () => void
  compact?: boolean
}

const sanitizeMockText = (value?: string | null) =>
  (value || '')
    .replace(/\bmock\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-:|*]+|[\s\-:|*]+$/g, '')
    .trim()

export function AtividadesRecentes({ onRefreshRequest, compact = false }: AtividadesRecentesProps) {
  const { activities, isLoading, mutate } = useAtividadesRecentes()
  const [showAll, setShowAll] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<DashboardActivity | null>(null)

  const maxVisible = compact ? 3 : 4

  const handleActivityUpdate = () => {
    if (onRefreshRequest) {
      onRefreshRequest()
    }
    void mutate()
  }

  const iconSize = compact ? 16 : 20

  const getIcon = (type: DashboardActivityType) => {
    switch (type) {
      case 'tarefa':
        return <CheckSquare className="text-blue-500" size={iconSize} />
      case 'oportunidade':
        return <DollarSign className="text-green-500" size={iconSize} />
      case 'cliente':
        return <User className="text-purple-500" size={iconSize} />
      default:
        return <Plus className="text-gray-500" size={iconSize} />
    }
  }

  const getActionText = (type: DashboardActivityType) => {
    switch (type) {
      case 'tarefa':
        return 'Nova tarefa criada'
      case 'oportunidade':
        return 'Novo orcamento'
      case 'cliente':
        return 'Novo cliente cadastrado'
      default:
        return 'Nova atividade'
    }
  }

  const visibleActivities = showAll ? activities : activities.slice(0, maxVisible)
  const hasMore = activities.length > maxVisible

  return (
    <>
      <div
        className={`crm-card flex flex-col h-full border border-gray-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/50 ${
          compact ? 'p-5' : 'p-6'
        }`}
      >
        <h3
          className={`font-semibold text-gray-900 dark:text-white border-b border-gray-100 pb-3 dark:border-slate-700/50 mb-4 ${
            compact ? 'text-sm text-gray-800 dark:text-slate-100' : 'text-lg'
          }`}
        >
          Atividades Recentes
        </h3>

        {isLoading ? (
          <div className={`flex-1 ${compact ? 'space-y-3' : 'space-y-4'}`}>
            {(compact ? [1, 2, 3] : [1, 2, 3, 4]).map((item) => (
              <div key={item} className={`flex animate-pulse ${compact ? 'gap-3' : 'gap-4'}`}>
                <div className={`rounded-full bg-gray-200 dark:bg-gray-700 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-sm w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-sm w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className={`text-center text-gray-500 dark:text-gray-400 flex-1 ${compact ? 'py-4' : 'py-8'}`}>
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className={compact ? 'space-y-3' : 'space-y-4'}>
              {visibleActivities.map((activity) => {
                const sanitizedTitle = sanitizeMockText(activity.title) || 'Atividade'
                const sanitizedDescription = sanitizeMockText(activity.description)

                return (
                  <button
                    key={`${activity.type}-${activity.id}`}
                    className={`w-full flex text-left p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group ${compact ? 'gap-3' : 'gap-4'}`}
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div
                      className={`shrink-0 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600 group-hover:border-gray-200 dark:group-hover:border-gray-500 transition-colors ${
                        compact ? 'w-8 h-8' : 'w-10 h-10'
                      }`}
                    >
                      {getIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-gray-900 dark:text-white truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                        {sanitizedTitle}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {getActionText(activity.type)}
                        {sanitizedDescription ? ` | ${sanitizedDescription}` : ''}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap self-start mt-1">
                      {formatDistanceToNow(new Date(activity.date), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </button>
                )
              })}
            </div>

            {hasMore && (
              <div className={`border-t border-gray-100 dark:border-gray-700 text-center ${compact ? 'mt-3 pt-3' : 'mt-4 pt-4'}`}>
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
                >
                  {showAll ? (
                    <>
                      Ver menos <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      Ver mais <ChevronDown size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ActivityModal
        isOpen={!!selectedActivity}
        activity={selectedActivity}
        type={selectedActivity?.type || 'tarefa'}
        onClose={() => setSelectedActivity(null)}
        onUpdate={handleActivityUpdate}
      />
    </>
  )
}
