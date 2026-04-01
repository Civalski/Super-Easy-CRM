'use client'

export interface AppQueryOptions {
  staleTime: number
  gcTime: number
  refetchOnWindowFocus: boolean
  retry: number
}

export const APP_QUERY_DEFAULTS: AppQueryOptions = {
  staleTime: 30 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
}

export const APP_QUERY_PRESETS = {
  fast: {
    staleTime: 10 * 1000,
    gcTime: APP_QUERY_DEFAULTS.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  },
  standard: APP_QUERY_DEFAULTS,
  static: {
    staleTime: 5 * 60 * 1000,
    gcTime: APP_QUERY_DEFAULTS.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  },
} as const satisfies Record<string, AppQueryOptions>

