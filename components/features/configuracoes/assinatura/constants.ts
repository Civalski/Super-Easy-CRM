/**
 * Planos premium disponíveis para assinatura.
 * Cada plano tem um env var correspondente: STRIPE_PRICE_ID_PLAN_1, etc.
 */
export const PREMIUM_PLANS = [
  {
    id: 'plan_1',
    envKey: 'STRIPE_PRICE_ID_PLAN_1',
    label: '1 licença',
    price: '29,90',
    period: '/mês',
    description: 'Ideal para uso individual',
  },
  {
    id: 'plan_5',
    envKey: 'STRIPE_PRICE_ID_PLAN_5',
    label: '5 licenças',
    price: '24,90',
    period: '/mês cada',
    description: 'Para pequenas equipes',
  },
  {
    id: 'plan_10_plus',
    envKey: 'STRIPE_PRICE_ID_PLAN_10_PLUS',
    label: '+10 licenças',
    price: '24,90',
    period: '/mês cada',
    description: '1 licença gerente inclusa para monitorar desempenho de usuários',
  },
] as const

export type PlanId = (typeof PREMIUM_PLANS)[number]['id']
