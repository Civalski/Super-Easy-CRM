import type { AmbienteFinanceiro } from './types'

export const CONTAS_PAGE_SIZE = 12

export const AMBIENTE_LABEL: Record<AmbienteFinanceiro, string> = {
  geral: 'Fluxo total',
  pessoal: 'Fluxo pessoal',
}

export const STATUS_CLASS_MAP: Record<string, string> = {
  pago: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  atrasado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelado: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  parcial: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
}

export const STATUS_CLASS_DEFAULT = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'

export const MODAL_INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25'

export const MODAL_LABEL_CLASS = 'text-xs font-medium uppercase tracking-wide text-slate-300'
