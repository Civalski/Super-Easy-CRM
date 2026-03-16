'use client'

import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/common'
import { SelectablePlanCard } from '@/components/common/SelectablePlanCard'
import { REGISTER_PLANS } from '@/components/features/register/constants'
import type { RegisterPlanId } from '@/components/features/register/types'
import { ArrowRight, LogOut } from '@/lib/icons'

type SubscriptionPlanPromptProps = {
  loading: boolean
  selectedPlanId: RegisterPlanId
  onSelectPlanId: (planId: RegisterPlanId) => void
  onContinue: () => void
}

const AVAILABLE_CHECKOUT_PLANS = REGISTER_PLANS.filter((plan) => !plan.whatsappRedirect)

const ONBOARDING_PLAN_PRICING: Record<
  RegisterPlanId,
  { priceLabel: string; pricePeriod?: string; description?: string }
> = {
  plan_1: {
    priceLabel: 'R$ 39,90',
    pricePeriod: '/mes',
    description: 'Plano individual para continuar no CRM depois do seu periodo gratis.',
  },
  plan_3: {
    priceLabel: 'R$ 99,90',
    pricePeriod: '/mes',
  },
  plan_10: {
    priceLabel: 'R$ 299,90',
    pricePeriod: '/mes',
  },
  plan_personalizado: {
    priceLabel: 'Fale conosco',
    pricePeriod: 'via WhatsApp',
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

        <div className="mx-auto mt-7 w-full max-w-[1040px] bg-transparent p-0.5">
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

        <div className="mt-auto flex flex-col items-center justify-center gap-3 pt-8 sm:flex-row">
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
  )
}
