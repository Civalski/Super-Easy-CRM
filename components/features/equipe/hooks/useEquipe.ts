'use client'

import { useQuery } from '@tanstack/react-query'
import { AppFetchError, fetchJson } from '@/lib/query/fetch-json'
import type { TeamOverviewResponse } from '../types'

const STALE_TIME = 30 * 1000
const RETRY_COUNT = 2

export function useEquipe() {
  const query = useQuery({
    queryKey: ['equipe'] as const,
    queryFn: () => fetchJson<TeamOverviewResponse>('/api/equipe'),
    staleTime: STALE_TIME,
    retry: (failureCount, error) => {
      if (failureCount >= RETRY_COUNT) return false
      const status = error instanceof AppFetchError ? error.status : undefined
      return !status || status >= 500
    },
  })

  return {
    data: query.data ?? null,
    error: query.error,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    mutate: () => query.refetch(),
  }
}
