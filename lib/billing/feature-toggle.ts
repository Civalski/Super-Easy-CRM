import { NextResponse } from 'next/server'

/**
 * Kill switch global de cobranca:
 * mantemos assinatura/pagamento desativados no app por decisao de produto.
 */
const BILLING_GLOBALLY_DISABLED = true

function isEnabled(value: string | undefined) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export function isBillingSubscriptionEnabledServer() {
  if (BILLING_GLOBALLY_DISABLED) return false
  return isEnabled(process.env.BILLING_SUBSCRIPTION_ENABLED)
}

export function isBillingSubscriptionDisabledServer() {
  return !isBillingSubscriptionEnabledServer()
}

export function isBillingSubscriptionEnabledClient() {
  if (BILLING_GLOBALLY_DISABLED) return false
  return isEnabled(process.env.NEXT_PUBLIC_BILLING_SUBSCRIPTION_ENABLED)
}

export function billingSubscriptionDisabledResponse() {
  return NextResponse.json(
    {
      error: 'Sistema de assinatura e pagamento desativado.',
      code: 'BILLING_SUBSCRIPTION_DISABLED',
    },
    { status: 503 }
  )
}
