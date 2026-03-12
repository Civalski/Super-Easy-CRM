import { User, Users, Building2, Database } from '@/lib/icons'

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
  },
] as const

export type PlanId = (typeof PREMIUM_PLANS)[number]['id']
export type PremiumPlan = (typeof PREMIUM_PLANS)[number]
