import useSWR from 'swr'
import type { DashboardData, GoalSummary, FluxoData, DashboardActivity } from '@/types/dashboard'

type FetchError = Error & {
  status?: number
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) {
      const error = new Error(`Erro ao buscar ${url}`) as FetchError
      error.status = res.status
      throw error
    }
    return res.json()
  })

const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: (error: unknown) => {
    const status = (error as FetchError)?.status
    if (status === 400 || status === 401 || status === 402 || status === 403 || status === 404) {
      return false
    }
    return true
  },
  errorRetryCount: 2,
} as const

export function useDashboard(filter: 'day' | 'week' | 'month', date: Date) {
  const dateParam = date.toISOString()
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardData>(
    `/api/dashboard?filter=${filter}&date=${dateParam}`,
    fetcher,
    swrOptions
  )

  return { data: data ?? null, error, isLoading, isValidating, mutate }
}

export function useMetas() {
  const { data, error, isLoading, mutate } = useSWR<GoalSummary[]>(
    '/api/metas',
    fetcher,
    swrOptions
  )

  return { goals: Array.isArray(data) ? data : [], error, isLoading, mutate }
}

export function useFluxoCaixa(months = 6) {
  const { data, error, isLoading, mutate } = useSWR<FluxoData>(
    `/api/financeiro/fluxo-caixa?months=${months}`,
    fetcher,
    swrOptions
  )

  return { fluxo: data ?? null, error, isLoading, mutate }
}

export function useAtividadesRecentes() {
  const { data, error, isLoading, mutate } = useSWR<DashboardActivity[]>(
    '/api/dashboard/atividades-recentes',
    fetcher,
    swrOptions
  )

  return { activities: Array.isArray(data) ? data : [], error, isLoading, mutate }
}
