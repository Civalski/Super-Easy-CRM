import { CheckCircle2, Loader2 } from '@/lib/icons'
import type { PremiumPlanDefinition } from './types'

type PlanoCardProps = {
  actionLoading: boolean
  onAction: (plan: PremiumPlanDefinition) => void | Promise<void>
  onUserCountChange: (plan: PremiumPlanDefinition, value: number) => void
  plan: PremiumPlanDefinition
  userCount: number
}

export function PlanoCard({
  actionLoading,
  onAction,
  onUserCountChange,
  plan,
  userCount,
}: PlanoCardProps) {
  const Icon = plan.icon
  const isStripePlan = plan.actionType === 'stripe'

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-600/60 bg-slate-900/80 p-6 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.9)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-sky-400/12 blur-2xl" />

      <div className="relative">
        <span className="inline-flex rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-100">
          {plan.badge}
        </span>
        <div className="mt-4 flex items-center gap-3">
          <div className="rounded-xl border border-slate-600/80 bg-slate-800/80 p-2.5 text-sky-200">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
            <p className="text-sm text-slate-300">{plan.label}</p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-slate-200">{plan.description}</p>

      <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800/75 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">Investimento</p>
        <p className="mt-1 text-2xl font-semibold text-white">{plan.priceLabel}</p>
        <p className="mt-1 text-xs text-slate-300">{plan.priceHint}</p>
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {plan.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2 text-sm text-slate-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      {!isStripePlan && (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
          <label
            htmlFor={`usuarios-${plan.id}`}
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300"
          >
            Quantidade de usuarios para orcamento
          </label>
          <input
            id={`usuarios-${plan.id}`}
            type="number"
            min={plan.minUsers}
            value={userCount}
            onChange={(event) => onUserCountChange(plan, Number(event.target.value))}
            className="mt-2 h-11 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-3 text-sm text-white outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
          />
          <p className="mt-2 text-xs text-slate-400">
            Informe a previsao de usuarios para receber uma proposta alinhada ao seu cenario.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => void onAction(plan)}
        disabled={actionLoading}
        className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
          isStripePlan
            ? 'border border-indigo-300/55 bg-indigo-300/20 text-indigo-50 hover:bg-indigo-300/30'
            : 'border border-sky-300/55 bg-sky-300/20 text-sky-50 hover:bg-sky-300/30'
        } disabled:cursor-not-allowed disabled:opacity-65`}
      >
        {isStripePlan && actionLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecionando para o Stripe...
          </>
        ) : (
          <>{plan.actionLabel}</>
        )}
      </button>
    </article>
  )
}
