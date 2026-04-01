'use client'

import { useQueryClient } from '@tanstack/react-query'
import { invalidateDashboardQueries, type DashboardInvalidationSource } from '@/lib/query/dashboard-invalidation'
import type { DashboardActivityType } from '@/types/dashboard'

const activitySourceMap: Record<DashboardActivityType, DashboardInvalidationSource> = {
  tarefa: 'tarefas',
  oportunidade: 'oportunidades',
  cliente: 'clientes',
  meta: 'metas',
}

export function useDashboardInvalidation() {
  const queryClient = useQueryClient()

  const invalidateBySource = async (source: DashboardInvalidationSource) => {
    await invalidateDashboardQueries(queryClient, source)
  }

  const invalidateForActivityType = async (type: DashboardActivityType) => {
    await invalidateBySource(activitySourceMap[type] ?? 'all')
  }

  return {
    invalidateBySource,
    invalidateForActivityType,
  }
}

