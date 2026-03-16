'use client'

import { SelectablePlanCard } from '@/components/common/SelectablePlanCard'
import { REGISTER_COPY, REGISTER_PLANS } from '@/components/features/register/constants'
import type { RegisterPlanDefinition, RegisterPlanId } from '@/components/features/register/types'

type RegisterPlanSelectorProps = {
  selectedPlanId: RegisterPlanId
  showManagerOption: boolean
  isManager: boolean
  onSetPlanId: (planId: RegisterPlanId) => void
  onToggleManager: (value: boolean) => void
}

function PlanManagerOption({ plan }: { plan: RegisterPlanDefinition }) {
  return (
    <div>
      <p className="text-sm font-medium text-white">{REGISTER_COPY.registerAsManager}</p>
      <p className={`mt-1 text-xs ${plan.theme.subtleText}`}>
        {REGISTER_COPY.registerAsManagerHint}
      </p>
    </div>
  )
}

export function RegisterPlanSelector({
  selectedPlanId,
  showManagerOption,
  isManager,
  onSetPlanId,
  onToggleManager,
}: RegisterPlanSelectorProps) {
  const selectedPlan =
    REGISTER_PLANS.find((plan) => plan.id === selectedPlanId) ?? REGISTER_PLANS[0]

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-200">{REGISTER_COPY.selectPlan}</label>
        <p className="text-xs text-slate-400">
          Mesmo visual da aba de assinatura, agora direto no cadastro.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {REGISTER_PLANS.map((plan) => (
          <SelectablePlanCard
            key={plan.id}
            plan={plan}
            selectedPlan={selectedPlanId}
            onSelect={(planId) => onSetPlanId(planId as RegisterPlanId)}
          />
        ))}
      </div>

      {showManagerOption ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 backdrop-blur-sm">
          <input
            id="isManager"
            type="checkbox"
            checked={isManager}
            onChange={(event) => onToggleManager(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"
          />
          <PlanManagerOption plan={selectedPlan} />
        </label>
      ) : null}
    </div>
  )
}
