import { User, Users, Building2, Database } from '@/lib/icons'

const PLAN_THEMES = {
  bronze: {
    tierLabel: 'Bronze',
    accentBar: 'from-amber-500 via-orange-400 to-amber-700',
    selectedCard:
      'border-amber-500 bg-gradient-to-b from-amber-50 via-orange-50 to-white shadow-lg shadow-amber-200/70 ring-2 ring-amber-500/20 dark:border-amber-400 dark:from-amber-950/45 dark:via-orange-950/30 dark:to-slate-900 dark:shadow-none dark:ring-amber-400/30',
    unselectedCard:
      'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-amber-600 dark:hover:bg-slate-900',
    iconSelected: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200',
    iconUnselected: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200',
    bullet: 'text-amber-500 dark:text-amber-300',
    subtleText: 'text-amber-700 dark:text-amber-300',
    ctaButton:
      'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50',
    headerChip:
      'border-amber-200 bg-amber-50/90 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  },
  silver: {
    tierLabel: 'Prata',
    accentBar: 'from-slate-300 via-slate-100 to-slate-500',
    selectedCard:
      'border-slate-400 bg-gradient-to-b from-slate-100 via-slate-50 to-white shadow-lg shadow-slate-200/80 ring-2 ring-slate-400/20 dark:border-slate-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 dark:shadow-none dark:ring-slate-300/20',
    unselectedCard:
      'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-500 dark:hover:bg-slate-900',
    iconSelected: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
    iconUnselected: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
    bullet: 'text-slate-500 dark:text-slate-300',
    subtleText: 'text-slate-700 dark:text-slate-300',
    ctaButton:
      'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    headerChip:
      'border-slate-300 bg-slate-100/90 text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100',
  },
  gold: {
    tierLabel: 'Ouro',
    accentBar: 'from-yellow-300 via-amber-300 to-yellow-500',
    selectedCard:
      'border-yellow-500 bg-gradient-to-b from-yellow-50 via-amber-50 to-white shadow-lg shadow-yellow-200/80 ring-2 ring-yellow-500/20 dark:border-yellow-400 dark:from-yellow-950/45 dark:via-amber-950/30 dark:to-slate-900 dark:shadow-none dark:ring-yellow-400/30',
    unselectedCard:
      'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-yellow-600 dark:hover:bg-slate-900',
    iconSelected: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200',
    iconUnselected: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200',
    bullet: 'text-yellow-500 dark:text-yellow-300',
    subtleText: 'text-yellow-700 dark:text-yellow-300',
    ctaButton:
      'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200 dark:hover:bg-yellow-900/50',
    headerChip:
      'border-yellow-200 bg-yellow-50/90 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200',
  },
  diamond: {
    tierLabel: 'Diamante',
    accentBar: 'from-cyan-300 via-sky-200 to-blue-500',
    selectedCard:
      'border-cyan-500 bg-gradient-to-b from-cyan-50 via-sky-50 to-white shadow-lg shadow-cyan-200/80 ring-2 ring-cyan-500/20 dark:border-cyan-400 dark:from-cyan-950/45 dark:via-sky-950/30 dark:to-slate-900 dark:shadow-none dark:ring-cyan-400/30',
    unselectedCard:
      'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-cyan-600 dark:hover:bg-slate-900',
    iconSelected: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200',
    iconUnselected: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200',
    bullet: 'text-cyan-500 dark:text-cyan-300',
    subtleText: 'text-cyan-700 dark:text-cyan-300',
    ctaButton:
      'border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200 dark:hover:bg-cyan-900/50',
    headerChip:
      'border-cyan-200 bg-cyan-50/90 text-cyan-800 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200',
  },
} as const

/**
 * Planos premium disponiveis para assinatura.
 * Planos com actionType "checkout" usam env vars STRIPE_PRICE_ID_PLAN_*.
 */
export const PREMIUM_PLANS = [
  {
    id: 'plan_1',
    actionType: 'checkout',
    envKey: 'STRIPE_PRICE_ID_PLAN_1',
    name: 'Individual',
    label: '1 licenca',
    price: '39,90',
    period: '/mes',
    description: 'Ideal para uso individual',
    highlights: ['1 usuario', 'Suporte padrao'],
    icon: User,
    theme: PLAN_THEMES.bronze,
  },
  {
    id: 'plan_5',
    actionType: 'checkout',
    envKey: 'STRIPE_PRICE_ID_PLAN_5',
    name: 'Equipe',
    label: '5 licencas',
    price: '99,90',
    period: '/mes',
    description: 'Para pequenas equipes',
    highlights: ['Ate 5 usuarios', 'Visao compartilhada'],
    icon: Users,
    theme: PLAN_THEMES.silver,
  },
  {
    id: 'plan_10_plus',
    actionType: 'checkout',
    envKey: 'STRIPE_PRICE_ID_PLAN_10_PLUS',
    name: 'Enterprise',
    label: '10+ licencas',
    price: '299,90',
    period: '/mes',
    description: 'Inclui perfil gerente para monitorar desempenho',
    highlights: ['10+ usuarios', 'Gestao por gerente'],
    icon: Building2,
    theme: PLAN_THEMES.gold,
  },
  {
    id: 'dedicated_server',
    actionType: 'whatsapp',
    name: 'Servidor Dedicado',
    label: 'Infra exclusiva',
    price: 'Sob consulta',
    description: 'Ambiente exclusivo com ajuste de performance e suporte prioritario',
    highlights: ['Banco e app isolados', 'SLA prioritario'],
    ctaLabel: 'Entrar em contato via WhatsApp',
    whatsappUrl:
      'https://wa.me/5519998205608?text=Ola%2C%20quero%20saber%20mais%20sobre%20o%20plano%20Servidor%20Dedicado%20do%20Arker%20CRM.',
    icon: Database,
    theme: PLAN_THEMES.diamond,
  },
] as const

export type PlanId = (typeof PREMIUM_PLANS)[number]['id']
export type PremiumPlan = (typeof PREMIUM_PLANS)[number]
