import { PLAN_CARD_THEMES } from '@/components/common/planCardThemes'
import { User } from '@/lib/icons'

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
    theme: PLAN_CARD_THEMES.bronze,
  },
] as const

export type PlanId = (typeof PREMIUM_PLANS)[number]['id']
export type PremiumPlan = (typeof PREMIUM_PLANS)[number]
