'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, DollarSign, User, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ActivityModal from './ActivityModal'
import type { DashboardActivity, DashboardActivityType } from '@/types/dashboard'

interface AtividadesRecentesProps {
  refreshTrigger?: number | Date
  onRefreshRequest?: () => void
}

const sanitizeMockText = (value?: string | null) =>
  (value || '')
    .replace(/\bmock\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-:|*]+|[\s\-:|*]+$/g, '')
    .trim()

export function AtividadesRecentes({ refreshTrigger, onRefreshRequest }: AtividadesRecentesProps) {
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<DashboardActivity | null>(null)

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/atividades-recentes')
      if (response.ok) {
        const data = await response.json()
        setActivities(Array.isArray(data) ? (data as DashboardActivity[]) : [])
      }
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [refreshTrigger])

  const handleActivityUpdate = () => {
    if (onRefreshRequest) {
      onRefreshRequest()
      return
    }
    fetchActivities()
  }

  const getIcon = (type: DashboardActivityType) => {
    switch (type) {
      case 'tarefa':
        return <CheckSquare className="text-blue-500" size={20} />
      case 'oportunidade':
        return <DollarSign className="text-green-500" size={20} />
      case 'cliente':
        return <User className="text-purple-500" size={20} />
      default:
        return <Plus className="text-gray-500" size={20} />
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

  const visibleActivities = showAll ? activities : activities.slice(0, 4)
  const hasMore = activities.length > 4

  return (
    <>
      <div className="crm-card p-6 flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Atividades Recentes
        </h3>

        {isLoading ? (
          <div className="space-y-4 flex-1">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex-1">
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="space-y-4">
              {visibleActivities.map((activity) => {
                const sanitizedTitle = sanitizeMockText(activity.title) || 'Atividade'
                const sanitizedDescription = sanitizeMockText(activity.description)

                return (
                  <button
                    key={`${activity.type}-${activity.id}`}
                    className="w-full flex gap-4 text-left p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600 group-hover:border-gray-200 dark:group-hover:border-gray-500 transition-colors">
                      {getIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
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
