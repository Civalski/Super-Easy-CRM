/**
 * Lógica de assinatura provider-agnóstica.
 * Status normalizado para compatibilidade com Stripe e outros gateways.
 */

export type SubscriptionStatus = 'authorized' | 'active' | 'pending' | 'cancelled' | 'inactive'

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
