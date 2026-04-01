'use client'

import { useQuery } from '@tanstack/react-query'
import { isBillingSubscriptionEnabledClient } from '@/lib/billing/feature-toggle'
import { fetchJson } from '@/lib/query/fetch-json'

export type SubscriptionPayload = {
  provider: string | null
  status: string
  active: boolean
  subscriptionId: string | null
  planCode: string | null
  checkoutUrl: string | null
  nextBillingAt: string | null
  lastWebhookAt: string | null
}

type UseSubscriptionStatusOptions = {
  enabled?: boolean
  dedupingIntervalMs?: number
}

async function fetchSubscription(url: string): Promise<SubscriptionPayload> {
  return fetchJson<SubscriptionPayload>(url, { cache: 'no-store' })
}

export function useSubscriptionStatus(options?: UseSubscriptionStatusOptions) {
  const billingEnabled = isBillingSubscriptionEnabledClient()
  const enabled = options?.enabled ?? true
  const shouldFetch = billingEnabled && enabled
  const staleTime = options?.dedupingIntervalMs ?? 15_000

  const query = useQuery({
    queryKey: ['billing', 'subscription'] as const,
    queryFn: () => fetchSubscription('/api/billing/subscription'),
    enabled: shouldFetch,
    staleTime,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    billingEnabled,
    subscription: query.data ?? null,
    active: billingEnabled ? Boolean(query.data?.active) : true,
    checkoutUrl: query.data?.checkoutUrl ?? null,
    error: query.error,
    isLoading: shouldFetch ? query.isLoading : false,
    isValidating: shouldFetch ? query.isFetching : false,
    mutate: () => query.refetch(),
  }
}
