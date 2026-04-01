'use client'

import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/common'
import { SelectablePlanCard } from '@/components/common/SelectablePlanCard'
import { REGISTER_PLANS } from '@/components/features/register/constants'
import type { RegisterPlanId } from '@/components/features/register/types'
import { ArrowRight, LogOut, Percent, Sparkles } from '@/lib/icons'

type SubscriptionPlanPromptProps = {
  loading: boolean
  selectedPlanId: RegisterPlanId
  onSelectPlanId: (planId: RegisterPlanId) => void
  onContinue: () => void
}

const AVAILABLE_CHECKOUT_PLANS = REGISTER_PLANS.filter((plan) => !plan.whatsappRedirect)
const COUPON_CODE = 'ARKER25'

const ONBOARDING_PLAN_PRICING: Partial<
  Record<RegisterPlanId, { priceLabel: string; pricePeriod?: string; description?: string }>
> = {
  plan_1: {
    priceLabel: 'R$ 39,90',
    pricePeriod: '/mes',
    description: 'Plano individual para continuar no CRM apos seu 1 mes premium gratis.',
  },
}

export function SubscriptionPlanPrompt({
  loading,
  selectedPlanId,
  onSelectPlanId,
  onContinue,
}: SubscriptionPlanPromptProps) {
  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-[1120px] flex-col rounded-3xl border border-slate-200/80 bg-white/94 px-5 py-7 shadow-2xl shadow-slate-950/16 dark:border-slate-700/70 dark:bg-slate-900/94 dark:shadow-slate-950/55 sm:min-h-[680px] sm:px-6 sm:py-8">
        <div className="flex justify-center">
          <div className="relative flex h-16 w-[240px] items-center justify-center sm:h-18 sm:w-[280px]">
            <Image
              src="/arkercrmlogo.png?v=2"
              alt="Arker CRM"
              width={240}
              height={88}
              className="h-12 w-auto object-contain dark:hidden sm:h-14"
              priority
            />
            <Image
              src="/arker10.png"
              alt="Arker CRM"
              width={220}
              height={56}
              className="hidden h-10 w-auto object-contain dark:block sm:h-12"
              priority
            />
          </div>
        </div>

        <div className="mx-auto mt-6 flex w-full max-w-[1040px] flex-col gap-4 rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-4 py-4 shadow-[0_20px_40px_-35px_rgba(2,132,199,0.55)] dark:border-sky-700/40 dark:from-sky-950/25 dark:via-slate-900/70 dark:to-emerald-950/20 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/90 px-2.5 py-1 text-sky-700 dark:border-sky-700/70 dark:bg-sky-900/30 dark:text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Premium
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/90 px-2.5 py-1 text-emerald-700 dark:border-emerald-700/70 dark:bg-emerald-900/30 dark:text-emerald-200">
              1 mes premium gratis concluido
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Para assinar agora, use o cupom <span className="font-bold text-slate-900 dark:text-white">{COUPON_CODE}</span> e
              ganhe 25% de desconto vitalicio na mensalidade.
            </p>
            <span className="inline-flex items-center gap-2 self-start rounded-xl border border-sky-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:border-sky-700/70 dark:bg-sky-900/35 dark:text-sky-200">
              <Percent className="h-4 w-4" />
              Cupom {COUPON_CODE}
            </span>
          </div>
        </div>

        <div className="mx-auto mt-7 w-full max-w-[1040px] bg-transparent p-0.5">
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-[0_25px_50px_-45px_rgba(15,23,42,0.85)] dark:border-slate-700/60 dark:bg-slate-900/55 sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">Escolha seu plano premium</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Compare os pacotes abaixo e continue para o checkout seguro com campo para cupom.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-4">
            {AVAILABLE_CHECKOUT_PLANS.map((plan) => {
              const pricing = ONBOARDING_PLAN_PRICING[plan.id]

              return (
                <SelectablePlanCard
                  key={plan.id}
                  className="min-h-[380px] rounded-[1.7rem] px-6 py-7 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.3)]"
                  plan={{
                    ...plan,
                    description: pricing?.description ?? plan.description,
                    priceLabel: pricing?.priceLabel ?? plan.priceLabel,
                    pricePeriod: pricing?.pricePeriod ?? plan.pricePeriod,
                  }}
                  selectedPlan={selectedPlanId}
                  onSelect={(planId) => onSelectPlanId(planId as RegisterPlanId)}
                />
              )
            })}
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center justify-center gap-3 pt-8">
          <p className="text-center text-xs text-slate-600 dark:text-slate-300">
            No Stripe, aplique o cupom <span className="font-semibold text-slate-900 dark:text-white">{COUPON_CODE}</span> para ativar 25% OFF
            vitalicio.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="h-11 gap-2 rounded-xl px-5 text-sm font-semibold"
          >
            <LogOut size={16} />
            Sair da conta
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="h-11 gap-2 rounded-xl px-5 text-sm font-semibold"
          >
            {loading ? 'Redirecionando para o Stripe...' : 'Continuar para o pagamento'}
            <ArrowRight size={16} />
          </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
