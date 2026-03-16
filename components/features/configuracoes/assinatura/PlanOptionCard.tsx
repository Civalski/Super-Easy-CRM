import { SelectablePlanCard } from '@/components/common/SelectablePlanCard'
import type { PlanId, PremiumPlan } from './constants'

type PlanOptionCardProps = {
  plan: PremiumPlan
  selectedPlan: PlanId
  onSelect: (planId: PlanId) => void
}

export function PlanOptionCard({ plan, selectedPlan, onSelect }: PlanOptionCardProps) {
  return (
    <SelectablePlanCard
      plan={{
        description: plan.description,
        highlights: plan.highlights,
        icon: plan.icon,
        id: plan.id,
        label: plan.label,
        name: plan.name,
        priceLabel: plan.actionType === 'checkout' ? `R$ ${plan.price}` : plan.price,
        pricePeriod: plan.actionType === 'checkout' ? plan.period : undefined,
        theme: plan.theme,
      }}
      selectedPlan={selectedPlan}
      onSelect={(planId) => onSelect(planId as PlanId)}
    />
  )
}
