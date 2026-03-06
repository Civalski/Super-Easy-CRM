import { NextResponse } from 'next/server'

function isEnabled(value: string | undefined) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export function isBillingSubscriptionEnabledServer() {
  return isEnabled(process.env.BILLING_SUBSCRIPTION_ENABLED)
}

export function isBillingSubscriptionDisabledServer() {
  return !isBillingSubscriptionEnabledServer()
}

export function isBillingSubscriptionEnabledClient() {
  return isEnabled(process.env.NEXT_PUBLIC_BILLING_SUBSCRIPTION_ENABLED)
}

export function billingSubscriptionDisabledResponse() {
  return NextResponse.json(
    {
      error: 'Sistema de assinatura e pagamento temporariamente inativo para testes.',
      code: 'BILLING_SUBSCRIPTION_DISABLED',
    },
    { status: 503 }
  )
}
