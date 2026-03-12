import { Check } from '@/lib/icons'
import type { PlanId, PremiumPlan } from './constants'

type PlanOptionCardProps = {
  plan: PremiumPlan
  selectedPlan: PlanId
  onSelect: (planId: PlanId) => void
}

export function PlanOptionCard({ plan, selectedPlan, onSelect }: PlanOptionCardProps) {
  const Icon = plan.icon
  const isSelected = selectedPlan === plan.id
  const iconToneClasses = isSelected ? plan.theme.iconSelected : plan.theme.iconUnselected

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      aria-pressed={isSelected}
      className={`group relative flex min-h-[220px] flex-col rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
        isSelected
          ? plan.theme.selectedCard
          : plan.theme.unselectedCard
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${plan.theme.accentBar}`} />

      <div className="mb-3 flex items-center justify-between gap-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${plan.theme.headerChip}`}>
          {plan.theme.tierLabel}
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${plan.theme.subtleText}`}>
          {plan.label}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconToneClasses}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900 dark:text-white">{plan.name}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{plan.description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-2xl font-bold leading-none text-slate-900 dark:text-white">
          {plan.actionType === 'checkout' ? `R$ ${plan.price}` : plan.price}
          {plan.actionType === 'checkout' ? (
            <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">{plan.period}</span>
          ) : null}
        </p>

        <ul className="space-y-1.5">
          {plan.highlights.map((highlight) => (
            <li key={highlight} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Check className={`h-3.5 w-3.5 ${plan.theme.bullet}`} />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}
