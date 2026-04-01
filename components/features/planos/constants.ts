import { BarChart3, Briefcase, Building2, CheckCircle2, Database, ShieldCheck, Sparkles, User, Users } from '@/lib/icons'
import type { CrmCapability, PremiumBenefit, PremiumPlanDefinition } from './types'

export const PLANOS_PAGE_URL = '/planos'
export const PREMIUM_COUPON_CODE = 'ARKER25'

export const DEFAULT_WHATSAPP_SALES_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_PLAN_PERSONALIZADO ?? '5519998205608'

export const PREMIUM_PLANS: readonly PremiumPlanDefinition[] = [
  {
    id: 'solo',
    name: 'Plano Solo',
    label: 'Individual',
    description:
      'Perfeito para quem quer tocar operacao, vendas e follow-up com velocidade sem ficar preso em planilha.',
    priceLabel: 'R$ 39,90/mes',
    priceHint: 'Pagamento automatico e seguro pelo Stripe.',
    actionLabel: 'Assinar agora',
    actionType: 'stripe',
    badge: 'Entrada rapida',
    minUsers: 1,
    defaultUsers: 1,
    whatsappContext: 'Operacao individual',
    icon: User,
    highlights: [
      '1 usuario',
      'Funis, tarefas e pipeline completos',
      'Gestao de clientes, pedidos e follow-ups',
      'Suporte padrao por WhatsApp e email',
    ],
  },
  {
    id: 'team',
    name: 'Plano Team',
    label: 'Equipe Nuvem',
    description:
      'Ideal para equipes que precisam compartilhar carteira, acompanhar metas por pessoa e escalar operacao sem dor.',
    priceLabel: 'Sob consulta',
    priceHint: 'Orcamento proporcional ao tamanho do time.',
    actionLabel: 'Pedir orcamento no WhatsApp',
    actionType: 'whatsapp',
    badge: 'Mais escolhido para equipes',
    minUsers: 2,
    defaultUsers: 5,
    whatsappContext: 'Equipe em nuvem',
    icon: Users,
    highlights: [
      'Usuarios ilimitados por proposta',
      'Controle por equipe e responsavel',
      'Acompanhamento de produtividade',
      'Implantacao guiada com onboarding',
    ],
  },
  {
    id: 'enterprise',
    name: 'Plano Enterprise',
    label: 'Infraestrutura Dedicada',
    description:
      'Para operacoes maiores, com seguranca, compliance e personalizacao de ambiente: on-premise, VPS ou white label.',
    priceLabel: 'Projeto sob medida',
    priceHint: 'Escopo tecnico + comercial montado com seu time.',
    actionLabel: 'Solicitar proposta enterprise',
    actionType: 'whatsapp',
    badge: 'Infra dedicada',
    minUsers: 10,
    defaultUsers: 25,
    whatsappContext: 'Infra dedicada (On-premise, VPS ou white label)',
    icon: Building2,
    highlights: [
      'On-premise, VPS ou ambiente privado',
      'White label com identidade da sua empresa',
      'Politicas de seguranca e governanca',
      'Acompanhamento tecnico dedicado',
    ],
  },
] as const

export const PREMIUM_BENEFITS: readonly PremiumBenefit[] = [
  {
    id: 'visao',
    title: 'Visao completa do funil',
    description: 'Saiba exatamente onde cada oportunidade esta e qual proximo passo destrava resultado.',
    icon: BarChart3,
  },
  {
    id: 'rotina',
    title: 'Rotina organizada sem friccao',
    description: 'Tarefas, follow-ups e lembretes no mesmo fluxo para o time nao perder timing.',
    icon: Briefcase,
  },
  {
    id: 'seguranca',
    title: 'Seguranca para crescer',
    description: 'Controles de acesso, trilha de operacao e base preparada para evoluir com seu negocio.',
    icon: ShieldCheck,
  },
  {
    id: 'implantacao',
    title: 'Implantacao sem trauma',
    description: 'Onboarding orientado para colocar o CRM no ar com processo claro e rapido.',
    icon: Sparkles,
  },
  {
    id: 'dados',
    title: 'Dados acionaveis',
    description: 'Saia do achismo com indicadores de desempenho por usuario, etapa e carteira.',
    icon: Database,
  },
  {
    id: 'suporte',
    title: 'Suporte humano',
    description: 'Atendimento proximo para resolver duvidas e ajustar o uso conforme a sua realidade.',
    icon: CheckCircle2,
  },
] as const

export const CRM_CAPABILITIES: readonly CrmCapability[] = [
  {
    id: 'pipeline',
    title: 'Pipeline comercial',
    description: 'Gestao de oportunidades, negocios e follow-ups com visao de prioridade.',
  },
  {
    id: 'operacional',
    title: 'Operacao centralizada',
    description: 'Clientes, contratos, pedidos e tarefas conectados no mesmo ambiente.',
  },
  {
    id: 'financeiro',
    title: 'Acompanhamento financeiro',
    description: 'Fluxo de recebimentos, controle de contas e visao rapida do que esta em aberto.',
  },
  {
    id: 'produtividade',
    title: 'Produtividade do time',
    description: 'Historico de interacoes e indicadores para lideranca tomar decisao com clareza.',
  },
] as const

export const HERO_BULLETS = [
  'Sem promessas vazias: voce entende o plano e ja escolhe o proximo passo.',
  'Fluxo simples para assinar no Stripe ou pedir proposta sob medida no WhatsApp.',
  'Pensado para operacao real de CRM, do solo ao enterprise.',
] as const
