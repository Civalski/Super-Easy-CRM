'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from '@/lib/toast'
import { PREMIUM_PLANS } from '../constants'
import type { PlanTier, PremiumPlanDefinition } from '../types'
import { buildWhatsAppQuoteUrl, clampUserCount } from '../utils'

type UserCountByPlan = Record<PlanTier, number>

function createInitialUserCountMap(): UserCountByPlan {
  return PREMIUM_PLANS.reduce<UserCountByPlan>((acc, plan) => {
    acc[plan.id] = plan.defaultUsers
    return acc
  }, { enterprise: 25, solo: 1, team: 5 })
}

export function usePlanosLanding() {
  const [stripeLoading, setStripeLoading] = useState(false)
  const checkoutInFlightRef = useRef(false)
  const [userCountByPlan, setUserCountByPlan] = useState<UserCountByPlan>(() =>
    createInitialUserCountMap()
  )

  const soloPlan = useMemo(
    () => PREMIUM_PLANS.find((plan) => plan.id === 'solo') ?? PREMIUM_PLANS[0],
    []
  )

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
    } catch (error) {
      checkoutInFlightRef.current = false
      setStripeLoading(false)
      toast.error('Falha ao abrir o checkout', {
        description: error instanceof Error ? error.message : 'Erro inesperado ao iniciar pagamento.',
      })
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

  return {
    handlePlanAction,
    soloPlan,
    stripeLoading,
    updateUserCount,
    userCountByPlan,
  }
}
