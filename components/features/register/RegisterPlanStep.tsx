'use client'

import Image from 'next/image'
import { Button } from '@/components/common'
import { SelectablePlanCard } from '@/components/common/SelectablePlanCard'
import {
  REGISTER_COPY,
  REGISTER_PLANS,
  WHATSAPP_PLAN_PERSONALIZADO_URL,
} from '@/components/features/register/constants'
import type { RegisterPlanId } from '@/components/features/register/types'
import { ArrowRight, MessageCircle } from '@/lib/icons'

type RegisterPlanStepProps = {
  loading: boolean
  selectedPlanId: RegisterPlanId
  onSelectPlanId: (planId: RegisterPlanId) => void
  onContinue: (planId: RegisterPlanId) => void
}

export function RegisterPlanStep({
  loading,
  selectedPlanId,
  onSelectPlanId,
  onContinue,
}: RegisterPlanStepProps) {
  const selectedPlan = REGISTER_PLANS.find((p) => p.id === selectedPlanId)
  const isWhatsAppPlan = selectedPlan?.whatsappRedirect === true

  const handleContinue = () => {
    if (isWhatsAppPlan) {
      window.open(WHATSAPP_PLAN_PERSONALIZADO_URL, '_blank', 'noopener,noreferrer')
      return
    }
    onContinue(selectedPlanId)
  }

  return (
    <section className="relative flex min-h-full w-full flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
      <div className="relative z-10 w-full max-w-6xl space-y-8">
        <div className="flex justify-center">
          <Image
            src="/arker10.png"
            alt="Arker CRM"
            width={200}
            height={55}
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="crm-display text-3xl font-semibold text-white sm:text-4xl">Escolha seu plano</h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-300">
            Primeiro selecionamos o plano. Depois voce preenche o cadastro e segue direto
            para o checkout seguro no Stripe.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {REGISTER_PLANS.map((plan) => (
            <SelectablePlanCard
              key={plan.id}
              plan={plan}
              selectedPlan={selectedPlanId}
              onSelect={(planId) => onSelectPlanId(planId as RegisterPlanId)}
            />
          ))}
        </div>

        <div className="flex justify-center pt-6">
          <Button
            type="button"
            disabled={loading}
            onClick={handleContinue}
            className="h-11 gap-2 rounded-xl px-5 text-sm font-semibold"
          >
            {isWhatsAppPlan ? (
              <>
                {REGISTER_COPY.continueViaWhatsApp}
                <MessageCircle size={16} />
              </>
            ) : (
              <>
                Continuar com este plano
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
