/**
 * Card de assinatura via Stripe. Exibe 3 planos premium e botão Assinar Premium.
 */
'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Loader2, CheckCircle2 } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button } from '@/components/common'
import { PREMIUM_PLANS, type PlanId } from './assinatura/constants'

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
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionPayload | null>(null)
  const [billingDisabled, setBillingDisabled] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('plan_1')

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
    fetchSubscription()
  }, [])

  const handleAssinarPremium = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar sessão de checkout')
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error('URL de checkout não retornada')
    } catch (error) {
      toast.error('Erro ao iniciar assinatura', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setCheckoutLoading(false)
    }
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

  if (isActive) {
    return (
      <div className="crm-card p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Assinatura Premium</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Sua assinatura está ativa
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Ativa</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="crm-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
        <p className="text-sm font-medium text-gray-900 dark:text-white">Planos Premium</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {PREMIUM_PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan.id)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selectedPlan === plan.id
                ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.label}</p>
            <p className="mt-1 text-lg font-semibold text-purple-600 dark:text-purple-400">
              R$ {plan.price}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                {plan.period}
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>
          </button>
        ))}
      </div>

      <Button
        onClick={handleAssinarPremium}
        disabled={checkoutLoading}
        variant="primary"
        size="md"
        className="w-full sm:w-auto"
      >
        {checkoutLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecionando...
          </>
        ) : (
          'Assinar Premium'
        )}
      </Button>
    </div>
  )
}
