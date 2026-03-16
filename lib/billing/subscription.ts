/**
 * Lógica de assinatura provider-agnóstica.
 * Status normalizado para compatibilidade com Stripe e outros gateways.
 */

export type SubscriptionStatus = 'authorized' | 'active' | 'pending' | 'cancelled' | 'inactive'

type ResolveSubscriptionStateParams = {
  provider?: string | null
  status?: string | null
  nextBillingAt?: Date | null
}

const ACTIVE_STATUSES = new Set<string>(['authorized', 'active'])

export function normalizeSubscriptionStatus(
  status: string | null | undefined
): SubscriptionStatus {
  if (!status || typeof status !== 'string') return 'inactive'
  const normalized = status.trim().toLowerCase()
  if (ACTIVE_STATUSES.has(normalized)) return 'authorized'
  if (normalized === 'pending') return 'pending'
  if (['cancelled', 'canceled', 'expired'].includes(normalized)) return 'cancelled'
  return 'inactive'
}

export function isSubscriptionStatusActive(status: string | null | undefined): boolean {
  return normalizeSubscriptionStatus(status) === 'authorized'
}

export function resolveSubscriptionState(params: ResolveSubscriptionStateParams) {
  const normalizedStatus = normalizeSubscriptionStatus(params.status)
  const trialExpired =
    params.provider === 'supabase' &&
    normalizedStatus === 'authorized' &&
    params.nextBillingAt instanceof Date &&
    params.nextBillingAt.getTime() <= Date.now()

  if (trialExpired) {
    return {
      active: false,
      expired: true,
      status: 'inactive' as SubscriptionStatus,
    }
  }

  return {
    active: normalizedStatus === 'authorized',
    expired: false,
    status: normalizedStatus,
  }
}
