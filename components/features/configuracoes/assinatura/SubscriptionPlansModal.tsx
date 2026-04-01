'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/common'
import { CreditCard, Loader2, LogOut, Percent, Sparkles, X } from '@/lib/icons'
import type { PlanId, PremiumPlan } from './constants'
import { PlanOptionCard } from './PlanOptionCard'

type SubscriptionPlansModalProps = {
  checkoutLoading: boolean
  couponCode: string
  isOpen: boolean
  onCheckout: () => void
  onClose: () => void
  plans: readonly PremiumPlan[]
  selectedPlan: PlanId
  onSelectPlan: (planId: PlanId) => void
}

export function SubscriptionPlansModal({
  checkoutLoading,
  couponCode,
  isOpen,
  onCheckout,
  onClose,
  plans,
  selectedPlan,
  onSelectPlan,
}: SubscriptionPlansModalProps) {
  if (!isOpen) return null

  const selectedPlanConfig = plans.find((plan) => plan.id === selectedPlan) ?? plans[0]
  const selectedTheme = selectedPlanConfig.theme

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="crm-card relative w-full max-w-4xl overflow-hidden border border-slate-200/70 dark:border-slate-700/70"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
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
            <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Plano premium disponivel</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              No momento, apenas o plano Individual esta ativo para novas assinaturas.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-200">
              <Percent className="h-3.5 w-3.5" />
              Use o cupom {couponCode} para 25% de desconto vitalicio.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="grid gap-4">
            {plans.map((plan) => (
              <PlanOptionCard
                key={plan.id}
                plan={plan}
                selectedPlan={selectedPlan}
                onSelect={onSelectPlan}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Voce sera redirecionado para o checkout seguro. Aplique o cupom {couponCode} para 25% OFF vitalicio.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                onClick={() => signOut({ callbackUrl: '/login' })}
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
              <Button
                onClick={onCheckout}
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
    </div>
  )
}
