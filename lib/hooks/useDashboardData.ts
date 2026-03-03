import useSWR from 'swr'
import type { DashboardData, GoalSummary, FluxoData, DashboardActivity } from '@/types/dashboard'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error(`Erro ao buscar ${url}`)
    return res.json()
  })

export function useDashboard(filter: 'day' | 'month', date: Date) {
  const dateParam = date.toISOString()
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardData>(
    `/api/dashboard?filter=${filter}&date=${dateParam}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return { data: data ?? null, error, isLoading, isValidating, mutate }
}

export function useMetas() {
  const { data, error, isLoading, mutate } = useSWR<GoalSummary[]>(
    '/api/metas',
    fetcher,
    { revalidateOnFocus: false }
  )

  return { goals: Array.isArray(data) ? data : [], error, isLoading, mutate }
}

export function useFluxoCaixa(months = 6) {
  const { data, error, isLoading, mutate } = useSWR<FluxoData>(
    `/api/financeiro/fluxo-caixa?months=${months}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return { fluxo: data ?? null, error, isLoading, mutate }
}

export function useAtividadesRecentes() {
  const { data, error, isLoading, mutate } = useSWR<DashboardActivity[]>(
    '/api/dashboard/atividades-recentes',
    fetcher,
    { revalidateOnFocus: false }
  )

  return { activities: Array.isArray(data) ? data : [], error, isLoading, mutate }
}
