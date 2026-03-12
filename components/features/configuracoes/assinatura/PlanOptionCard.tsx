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
  const isContactPlan = plan.actionType === 'whatsapp'
  const selectedToneClasses = isContactPlan
    ? 'border-emerald-500 bg-gradient-to-b from-emerald-50 via-white to-white shadow-lg shadow-emerald-200/60 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:from-emerald-900/30 dark:via-slate-900 dark:to-slate-900 dark:shadow-none dark:ring-emerald-400/30'
    : 'border-sky-500 bg-gradient-to-b from-sky-50 via-white to-white shadow-lg shadow-sky-200/60 ring-2 ring-sky-500/20 dark:border-sky-400 dark:from-sky-900/30 dark:via-slate-900 dark:to-slate-900 dark:shadow-none dark:ring-sky-400/30'
  const iconToneClasses = isSelected
    ? isContactPlan
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200'
      : 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  const badgeToneClasses = isContactPlan
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200'
    : 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200'
  const unselectedToneClasses = isContactPlan
    ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-emerald-600 dark:hover:bg-slate-900'
    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-sky-600 dark:hover:bg-slate-900'

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      aria-pressed={isSelected}
      className={`group relative flex min-h-[220px] flex-col rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
        isSelected
          ? selectedToneClasses
          : unselectedToneClasses
      }`}
    >
      {isSelected ? (
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeToneClasses}`}>
          <Check className="h-3 w-3" />
          Selecionado
        </span>
      ) : null}

      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconToneClasses}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900 dark:text-white">{plan.name}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{plan.label}</p>
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
              <Check className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}
