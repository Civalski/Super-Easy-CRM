/**
 * Card de assinatura via Stripe. Botao "Assinar Premium" que abre modal com planos.
 */
'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Loader2, CheckCircle2, X, Sparkles, MessageCircle } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button } from '@/components/common'
import { PREMIUM_PLANS, type PlanId } from './assinatura/constants'
import { PlanOptionCard } from './assinatura/PlanOptionCard'

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
  const [modalOpen, setModalOpen] = useState(false)
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

  const selectedPlanConfig = PREMIUM_PLANS.find((plan) => plan.id === selectedPlan) ?? PREMIUM_PLANS[0]
  const isContactPlan = selectedPlanConfig.actionType === 'whatsapp'
  const selectedTheme = selectedPlanConfig.theme

  const handlePrimaryAction = async () => {
    if (selectedPlanConfig.actionType === 'whatsapp') {
      window.open(selectedPlanConfig.whatsappUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanConfig.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Falha ao criar sessao de checkout'
        throw new Error(msg)
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error('URL de checkout nao retornada')
    } catch (error) {
      toast.error('Erro ao iniciar assinatura', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleOpenModal = () => setModalOpen(true)
  const handleCloseModal = () => setModalOpen(false)

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
            <CreditCard className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Assinatura Premium</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">Sua assinatura esta ativa</p>
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
    <>
      <div className="crm-card overflow-hidden p-0">
        <div className="relative flex flex-col gap-3 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-600/20" />
          <div className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-600/20" />
          <div className="min-w-0 text-center sm:text-left">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              Premium
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Planos premium para cada fase do CRM</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Checkout direto ou atendimento dedicado via WhatsApp, no mesmo fluxo.</p>
          </div>

          <Button
            onClick={handleOpenModal}
            variant="primary"
            size="sm"
            className="z-[1] shrink-0 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50"
          >
            <CreditCard className="h-4 w-4" />
            Assinar Premium
          </Button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="crm-card relative w-full max-w-4xl overflow-hidden border border-slate-200/70 dark:border-slate-700/70"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute right-3 top-3 z-10 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-6 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="mx-auto max-w-2xl text-center">
                <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${selectedTheme.iconSelected}`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Escolha seu plano premium</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Todos os planos liberam recursos premium.
                  <span className={`ml-1 font-medium ${selectedTheme.subtleText}`}>
                    {selectedTheme.tierLabel} selecionado: {selectedPlanConfig.name}.
                  </span>
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {PREMIUM_PLANS.map((plan) => (
                  <PlanOptionCard
                    key={plan.id}
                    plan={plan}
                    selectedPlan={selectedPlan}
                    onSelect={setSelectedPlan}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  {isContactPlan
                    ? 'Abriremos o WhatsApp com uma mensagem pronta para o time comercial.'
                    : 'Voce sera redirecionado para o checkout seguro para concluir a assinatura.'}
                </p>
                <Button
                  onClick={handlePrimaryAction}
                  disabled={checkoutLoading}
                  variant="primary"
                  size="md"
                  className={`w-full sm:w-auto ${selectedTheme.ctaButton}`}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecionando...
                    </>
                  ) : isContactPlan ? (
                    <>
                      <MessageCircle className="h-4 w-4" />
                      {selectedPlanConfig.ctaLabel}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Continuar para pagamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
