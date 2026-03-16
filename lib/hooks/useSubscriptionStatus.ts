'use client'

import useSWR from 'swr'
import { isBillingSubscriptionEnabledClient } from '@/lib/billing/feature-toggle'

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

type SubscriptionRequestError = Error & {
  status?: number
}

async function fetchSubscription(url: string): Promise<SubscriptionPayload> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    const error = new Error('Falha ao consultar assinatura') as SubscriptionRequestError
    error.status = response.status
    throw error
  }

  return (await response.json()) as SubscriptionPayload
}

export function useSubscriptionStatus(options?: UseSubscriptionStatusOptions) {
  const billingEnabled = isBillingSubscriptionEnabledClient()
  const enabled = options?.enabled ?? true
  const shouldFetch = billingEnabled && enabled

  const { data, error, isLoading, isValidating, mutate } = useSWR<SubscriptionPayload>(
    shouldFetch ? '/api/billing/subscription' : null,
    fetchSubscription,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      dedupingInterval: options?.dedupingIntervalMs ?? 15_000,
    }
  )

  return {
    billingEnabled,
    subscription: data ?? null,
    active: billingEnabled ? Boolean(data?.active) : true,
    checkoutUrl: data?.checkoutUrl ?? null,
    error,
    isLoading: shouldFetch ? isLoading : false,
    isValidating: shouldFetch ? isValidating : false,
    mutate,
  }
}
