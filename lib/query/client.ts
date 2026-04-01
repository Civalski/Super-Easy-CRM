'use client'

import { QueryClient } from '@tanstack/react-query'
import { APP_QUERY_DEFAULTS } from './options'
import { AppFetchError } from './fetch-json'

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= APP_QUERY_DEFAULTS.retry) return false
  const status = error instanceof AppFetchError ? error.status : undefined
  if (status && status >= 400 && status < 500) return false
  return true
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: APP_QUERY_DEFAULTS.staleTime,
        gcTime: APP_QUERY_DEFAULTS.gcTime,
        refetchOnWindowFocus: APP_QUERY_DEFAULTS.refetchOnWindowFocus,
        retry: shouldRetry,
      },
      mutations: {
        retry: shouldRetry,
      },
    },
  })
}

