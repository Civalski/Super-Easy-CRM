'use client'

import { useQuery } from '@tanstack/react-query'
import type { DashboardData, GoalSummary, FluxoData, DashboardActivity } from '@/types/dashboard'
import { fetchJson } from '@/lib/query/fetch-json'
import { dashboardQueryKeys } from '@/lib/query/query-keys'

const DASHBOARD_STALE_TIME = 15 * 1000
const ATIVIDADES_STALE_TIME = 10 * 1000
const LONGER_STALE_TIME = 60 * 1000

export function useDashboard(filter: 'day' | 'week' | 'month', date: Date) {
  const dateParam = date.toISOString()
  const query = useQuery({
    queryKey: dashboardQueryKeys.summary(filter, dateParam),
    queryFn: () => fetchJson<DashboardData>(`/api/dashboard?filter=${filter}&date=${dateParam}`),
    staleTime: DASHBOARD_STALE_TIME,
  })

  return {
    data: query.data ?? null,
    error: query.error,
    isLoading: query.isLoading,
    isValidating: query.isFetching,
    mutate: () => query.refetch(),
  }
}

export function useMetas() {
  const query = useQuery({
    queryKey: dashboardQueryKeys.metas(),
    queryFn: () => fetchJson<GoalSummary[]>('/api/metas'),
    staleTime: LONGER_STALE_TIME,
  })

  return {
    goals: Array.isArray(query.data) ? query.data : [],
    error: query.error,
    isLoading: query.isLoading,
    mutate: () => query.refetch(),
  }
}

export function useFluxoCaixa(months = 6) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.fluxoCaixa(months),
    queryFn: () => fetchJson<FluxoData>(`/api/financeiro/fluxo-caixa?months=${months}`),
    staleTime: LONGER_STALE_TIME,
  })

  return {
    fluxo: query.data ?? null,
    error: query.error,
    isLoading: query.isLoading,
    mutate: () => query.refetch(),
  }
}

export function useAtividadesRecentes() {
  const query = useQuery({
    queryKey: dashboardQueryKeys.atividadesRecentes(),
    queryFn: () => fetchJson<DashboardActivity[]>('/api/dashboard/atividades-recentes'),
    staleTime: ATIVIDADES_STALE_TIME,
  })

  return {
    activities: Array.isArray(query.data) ? query.data : [],
    error: query.error,
    isLoading: query.isLoading,
    mutate: () => query.refetch(),
  }
}

