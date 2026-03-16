import type { LucideIcon } from '@/lib/icons'
import { Check } from '@/lib/icons'
import type { PlanCardTheme } from './planCardThemes'

export interface SelectablePlanCardData {
  id: string
  name: string
  label: string
  description: string
  priceLabel: string
  pricePeriod?: string
  highlights: readonly string[]
  icon: LucideIcon
  theme: PlanCardTheme
}

type SelectablePlanCardProps = {
  className?: string
  plan: SelectablePlanCardData
  selectedPlan: string
  onSelect: (planId: string) => void
}

export function SelectablePlanCard({
  className = '',
  plan,
  selectedPlan,
  onSelect,
}: SelectablePlanCardProps) {
  const Icon = plan.icon
  const isSelected = selectedPlan === plan.id
  const iconToneClasses = isSelected ? plan.theme.iconSelected : plan.theme.iconUnselected

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      aria-pressed={isSelected}
      className={`group relative isolate flex min-h-[320px] flex-col overflow-hidden rounded-2xl border px-5 py-6 text-left transition-all duration-300 ${
        isSelected ? plan.theme.selectedCard : plan.theme.unselectedCard
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] border border-white/60 opacity-80 dark:border-white/8" />
      <div
        className={`pointer-events-none absolute inset-x-5 top-0 h-1.5 rounded-full bg-gradient-to-r ${plan.theme.accentBar} shadow-[0_6px_18px_-8px_rgba(15,23,42,0.55)]`}
      />
      <div className="pointer-events-none absolute -right-10 top-10 h-28 w-28 rounded-full bg-white/45 blur-3xl dark:bg-white/6" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white/35 to-transparent dark:from-white/3 dark:to-transparent" />

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] shadow-sm ${plan.theme.headerChip}`}
        >
          {plan.theme.tierLabel}
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${plan.theme.subtleText}`}>
          {plan.label}
        </span>
      </div>

      <div className="relative flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:ring-white/10 ${iconToneClasses}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{plan.name}</p>
          <p className="mt-1.5 max-w-[24ch] text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            {plan.description}
          </p>
        </div>
      </div>

      <div className="relative mt-6 space-y-4">
        <p className="text-[2rem] font-bold leading-none tracking-tight text-slate-900 dark:text-white">
          {plan.priceLabel}
          {plan.pricePeriod ? (
            <span className="ml-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {plan.pricePeriod}
            </span>
          ) : null}
        </p>

        <ul className="space-y-2">
          {plan.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/75 ring-1 ring-slate-200/80 dark:bg-slate-900/70 dark:ring-slate-700/80">
                <Check className={`h-3.5 w-3.5 ${plan.theme.bullet}`} />
              </span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}
