import type { LoginThemeMap } from './types'

export const LOGIN_HIGHLIGHT_CHIPS = [
  'Automacao comercial',
  'Pipeline em tempo real',
  'CRM + ERP integrado',
]

export const TURNSTILE_RETRY_INTERVAL_MS = 250
export const TURNSTILE_RETRY_MAX_ATTEMPTS = 30

export const LOGIN_THEME_STYLES: LoginThemeMap = {
  dark: {
    root: 'bg-slate-950 text-slate-100',
    rootGlow:
      'bg-[radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.2),transparent_42%)]',
    heroSection:
      'border-b border-slate-800/70 bg-[linear-gradient(145deg,#2e1065_0%,#020617_58%,#000000_100%)] lg:border-b-0 lg:border-r',
    heroPrimaryGlow:
      'bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.22),transparent_52%)]',
    heroSecondaryGlow:
      'bg-[radial-gradient(circle_at_76%_75%,rgba(124,58,237,0.14),transparent_46%)]',
    heroTitle: 'text-white',
    heroDescription: 'text-slate-200/85',
    heroChip: 'border-slate-200/20 bg-slate-900/40 text-slate-200/80',
    formSection: 'bg-slate-950',
    formGlow:
      'bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.16),transparent_30%)]',
    formCard:
      'border-slate-600/70 bg-slate-800/65 shadow-[0_30px_60px_-40px_rgba(2,6,23,0.95)] backdrop-blur-xl',
    label: 'text-slate-200',
    input:
      'border-slate-600/70 bg-slate-950/55 text-slate-100 placeholder:text-slate-400/90 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25',
    helperText: 'text-slate-400',
    link: 'text-indigo-300 hover:text-indigo-200',
    errorBox: 'border-red-400/40 bg-red-500/10 text-red-200',
    turnstileMessage: 'text-amber-300',
    fallback: 'bg-slate-950',
  },
  light: {
    root: 'bg-white text-slate-900',
    rootGlow: '',
    heroSection:
      'border-b border-white/40 bg-[linear-gradient(145deg,#082f49_0%,#1d4ed8_44%,#312e81_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:border-b-0 lg:border-r lg:border-white/20',
    heroPrimaryGlow: '',
    heroSecondaryGlow: '',
    heroTitle: 'text-white',
    heroDescription: 'text-sky-100/88',
    heroChip: 'border-white/20 bg-slate-950/20 text-white/82',
    formSection: 'bg-transparent',
    formGlow: '',
    formCard:
      'border-white/70 bg-white/72 shadow-[0_32px_80px_-44px_rgba(15,23,42,0.35)] backdrop-blur-2xl',
    label: 'text-slate-700',
    input:
      'border-slate-200 bg-white/88 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
    helperText: 'text-slate-500',
    link: 'text-sky-700 hover:text-sky-800',
    errorBox: 'border-red-200 bg-red-50/90 text-red-700',
    turnstileMessage: 'text-amber-700',
    fallback: 'bg-slate-50',
  },
}
