'use client'

import useSWR from 'swr'
import type { TeamOverviewResponse } from '../types'

type FetchError = Error & {
  status?: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(payload?.error || 'Erro ao carregar equipe.') as FetchError
    error.status = response.status
    throw error
  }

  return payload as TeamOverviewResponse
}

const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: (error: unknown) => {
    const status = (error as FetchError | undefined)?.status
    return !status || status >= 500
  },
  errorRetryCount: 2,
} as const

export function useEquipe() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TeamOverviewResponse>(
    '/api/equipe',
    fetcher,
    swrOptions
  )

  return {
    data: data ?? null,
    error,
    isLoading,
    isRefreshing: isValidating && !isLoading,
    mutate,
  }
}
