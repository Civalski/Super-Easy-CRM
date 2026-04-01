/**
 * Card de assinatura premium com os planos exibidos dentro do proprio CRM.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Sparkles,
} from '@/lib/icons'
import { Button } from '@/components/common'
import {
  PREMIUM_COUPON_CODE,
  PREMIUM_PLANS,
} from '@/components/features/planos/constants'
import type {
  PlanTier,
  PremiumPlanDefinition,
} from '@/components/features/planos/types'
import {
  buildWhatsAppQuoteUrl,
  clampUserCount,
} from '@/components/features/planos/utils'

type SubscriptionPayload = {
  provider: string | null
  status: string
  active: boolean
  subscriptionId: string | null
  planCode: string | null
  checkoutUrl: string | null
  nextBillingAt: string | null
  lastWebhookAt: string | null
}

export function AssinaturaStripeCard() {
  const [stripeLoading, setStripeLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionPayload | null>(null)
  const [billingDisabled, setBillingDisabled] = useState(false)
  const checkoutInFlightRef = useRef(false)
  const [userCountByPlan, setUserCountByPlan] = useState<Record<PlanTier, number>>(() =>
    PREMIUM_PLANS.reduce<Record<PlanTier, number>>(
      (acc, plan) => {
        acc[plan.id] = plan.defaultUsers
        return acc
      },
      { enterprise: 25, solo: 1, team: 5 }
    )
  )

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/billing/subscription')
        if (res.status === 503) {
          const data = await res.json().catch(() => ({}))
          if (data.code === 'BILLING_SUBSCRIPTION_DISABLED') {
            setBillingDisabled(true)
          }
          setSubscription(null)
          return
        }
        if (!res.ok) {
          setSubscription(null)
          return
        }
        const data = await res.json()
        setSubscription(data)
      } catch {
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }

    void fetchSubscription()
  }, [])

  const updateUserCount = (plan: PremiumPlanDefinition, value: number) => {
    const clamped = clampUserCount(value, plan.minUsers)
    setUserCountByPlan((current) => ({
      ...current,
      [plan.id]: clamped,
    }))
  }

  const startSoloCheckout = async () => {
    if (checkoutInFlightRef.current) return

    checkoutInFlightRef.current = true
    setStripeLoading(true)
    try {
      const response = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'plan_1' }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload.url) {
        const errorText =
          payload?.details ??
          payload?.error ??
          'Nao foi possivel iniciar o checkout agora. Tente novamente em instantes.'
        throw new Error(errorText)
      }

      window.location.assign(payload.url as string)
    } catch {
      checkoutInFlightRef.current = false
      setStripeLoading(false)
    }
  }

  const openWhatsAppQuote = (plan: PremiumPlanDefinition) => {
    const userCount = userCountByPlan[plan.id]
    const url = buildWhatsAppQuoteUrl(plan, userCount)
    const popup = window.open(url, '_blank', 'noopener,noreferrer')

    if (!popup) {
      window.location.href = url
    }
  }

  const handlePlanAction = async (plan: PremiumPlanDefinition) => {
    if (plan.actionType === 'stripe') {
      await startSoloCheckout()
      return
    }

    openWhatsAppQuote(plan)
  }

  if (billingDisabled) return null

  if (loading) {
    return (
      <div className="crm-card p-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando assinatura...</p>
        </div>
      </div>
    )
  }

  const isActive = subscription?.active ?? false

  return (
    <>
      <div className="crm-card overflow-hidden p-0">
        <div className="relative flex flex-col gap-3 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-600/20" />
          <div className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-600/20" />

          <div className="min-w-0 text-center sm:text-left">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              {isActive ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
              {isActive ? 'Premium ativo' : 'Premium'}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
              {isActive ? 'Seu plano premium esta ativo' : 'Escolha seu plano premium'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Use o cupom {PREMIUM_COUPON_CODE} para garantir 25% de desconto vitalicio na mensalidade.
            </p>
          </div>

          <div className="z-[1] rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            3 opcoes disponiveis dentro do CRM
          </div>
        </div>

        <div className="grid gap-3 p-3 md:grid-cols-3">
          {PREMIUM_PLANS.map((plan) => {
            const Icon = plan.icon
            const isStripePlan = plan.actionType === 'stripe'
            const isPlanLoading = isStripePlan && stripeLoading
            return (
              <article
                key={plan.id}
                className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-2 text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {plan.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {plan.label}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-900/50 dark:bg-sky-900/30 dark:text-sky-200">
                    {plan.badge}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                  {plan.description}
                </p>

                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Investimento
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {plan.priceLabel}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {plan.priceHint}
                  </p>
                </div>

                <ul className="mt-2 space-y-1">
                  {plan.highlights.slice(0, 3).map((highlight) => (
                    <li key={highlight} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                {!isStripePlan && (
                  <div className="mt-2">
                    <label
                      htmlFor={`usuarios-${plan.id}`}
                      className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      Usuarios para proposta
                    </label>
                    <input
                      id={`usuarios-${plan.id}`}
                      type="number"
                      min={plan.minUsers}
                      value={userCountByPlan[plan.id]}
                      onChange={(event) => updateUserCount(plan, Number(event.target.value))}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-hidden transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <Button
                  onClick={() => void handlePlanAction(plan)}
                  variant="primary"
                  size="sm"
                  className="mt-3 w-full justify-center border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50"
                  disabled={isPlanLoading}
                >
                  {isPlanLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      {plan.actionLabel}
                    </>
                  )}
                </Button>
              </article>
            )
          })}
        </div>
      </div>
    </>
  )
}
