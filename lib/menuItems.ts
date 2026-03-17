import type { LucideIcon } from '@/lib/icons'
import {
  BarChart3,
  Calendar,
  ClipboardList,
  DocumentCheck,
  FileText,
  LayoutDashboard,
  Layers,
  Package,
  Trophy,
  Users,
  Wallet,
} from '@/lib/icons'

export interface GuideStepMeta {
  funilTab?: 'sem_contato' | 'contatado' | 'em_potencial' | 'aguardando_orcamento'
}

export interface MenuItemGuideStep {
  title?: string
  description: string
  meta?: GuideStepMeta
}

export interface MenuItem {
  name: string
  href: string
  icon: LucideIcon
  requiresPremium?: boolean
  /** Quando definido, o item so aparece para usuarios cujo username esta na lista */
  visibleForUsernames?: string[]
  /** Quando true, o item so aparece para usuarios com role admin */
  requiresAdmin?: boolean
  /** Quando true, o item so aparece para usuarios com role manager (gerente de equipe) */
  requiresManager?: boolean
  /** Texto explicativo exibido no modo de ajuda ao clicar no item */
  helpDescription?: string
  /** Subetapas opcionais para a apresentacao guiada */
  guideSteps?: MenuItemGuideStep[]
}

interface MenuItemVisibilityOptions {
  role?: string | null
  username?: string | null
}

export const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    helpDescription:
      'Seu painel de comando para começar o dia com contexto.\n\n' +
      '- Veja vendas, tarefas, oportunidades e caixa em poucos segundos.\n' +
      '- Identifique gargalos antes de entrar nos detalhes.\n\n' +
      'Dica: comece por aqui sempre que quiser entender o ritmo do CRM.',
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
    visibleForUsernames: ['alisson355'],
    helpDescription:
      'Aqui entram as análises para decisões mais estratégicas.\n\n' +
      '- Filtre períodos.\n' +
      '- Compare resultados.\n' +
      '- Compartilhe dados com o time quando precisar.\n\n' +
      'Use esta área para revisar desempenho com base em números concretos.',
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: Users,
    helpDescription:
      'Cadastro completo de pessoas e empresas que já estão no seu radar comercial.\n\n' +
      '- Consulte histórico, contato e próximas ações.\n' +
      '- Separe com clareza clientes, oportunidades e leads.\n\n' +
      'Leads frios seguem no Funil até avançarem para uma negociação real.',
  },
  {
    name: 'Orçamentos',
    href: '/oportunidades',
    icon: FileText,
    helpDescription:
      'Onde as propostas ganham forma e viram conversa séria de venda.\n\n' +
      '- Monte itens, valores e condições com clareza.\n' +
      '- Acompanhe aprovação, perda ou conversão em pedido.\n\n' +
      'É a ponte entre interesse e fechamento.',
  },
  {
    name: 'Pedidos',
    href: '/pedidos',
    icon: ClipboardList,
    helpDescription:
      'Aqui ficam os pedidos já fechados e em operação.\n\n' +
      '- Acompanhe entrega, parcelas, vencimentos e cobrança.\n' +
      '- Tenha visibilidade do pós-venda do início ao fim.\n\n' +
      'Tudo para o comercial não perder o timing depois da venda.',
  },
  {
    name: 'Contratos',
    href: '/contratos',
    icon: DocumentCheck,
    helpDescription:
      'Espaço para formalizar acordos com mais segurança.\n\n' +
      '- Preencha cláusulas, partes, datas e assinaturas.\n' +
      '- Gere PDFs com visual profissional para envio ou impressão.\n\n' +
      'Ideal para transformar combinados em documentação sólida.',
  },
  {
    name: 'Funil',
    href: '/grupos',
    icon: Layers,
    helpDescription:
      'Pipeline visual para organizar os leads por etapa, sem perder contexto nem ritmo comercial.',
    guideSteps: [
      {
        title: 'Funil: Sem contato',
        description:
          'A vitrine dos leads que acabaram de entrar no CRM.\n\n' +
          '- Comece por aqui para definir prioridade.\n' +
          '- Veja quem ainda não recebeu abordagem.\n\n' +
          'Quando for seguir, use "Próxima etapa" e eu levo você para o próximo estágio.',
        meta: { funilTab: 'sem_contato' },
      },
      {
        title: 'Funil: Contatado',
        description:
          'Nesta etapa ficam os leads que já receberam o primeiro contato.\n\n' +
          '- Separe quem respondeu.\n' +
          '- Mantenha follow-ups organizados.\n\n' +
          'A ideia aqui é não deixar nenhuma conversa esfriar.',
        meta: { funilTab: 'contatado' },
      },
      {
        title: 'Funil: Em potencial',
        description:
          'Aqui moram as oportunidades com mais chance real de avançar.\n\n' +
          '- Priorize quem demonstrou interesse.\n' +
          '- Use este bloco para concentrar energia comercial.\n\n' +
          'É a etapa em que o CRM ajuda você a focar no que pode virar negócio.',
        meta: { funilTab: 'em_potencial' },
      },
      {
        title: 'Funil: Aguardando orçamento',
        description:
          'Última parada antes de a proposta entrar em cena.\n\n' +
          '- Identifique quem já está maduro para orçamento.\n' +
          '- Ganhe velocidade na passagem para Orçamentos.\n\n' +
          'Com esse fluxo bem cuidado, o comercial fica previsível e profissional.',
        meta: { funilTab: 'aguardando_orcamento' },
      },
    ],
  },
  {
    name: 'Equipe',
    href: '/equipe',
    icon: Users,
    requiresManager: true,
    helpDescription:
      'Visão da equipe para acompanhar pessoas, ritmo e resultados.\n\n' +
      '- Monitore desempenho.\n' +
      '- Enxergue atividades do time com rapidez.\n\n' +
      'Uma área pensada para liderar com mais clareza.',
  },
  {
    name: 'Metas',
    href: '/metas',
    icon: Trophy,
    helpDescription:
      'Onde objetivo deixa de ser abstrato e vira acompanhamento diário.\n\n' +
      '- Configure metas por período.\n' +
      '- Veja progresso em tempo real.\n\n' +
      'Perfeito para ajustar foco e acelerar performance.',
  },
  {
    name: 'Tarefas',
    href: '/tarefas',
    icon: Calendar,
    helpDescription:
      'Sua agenda operacional dentro do CRM.\n\n' +
      '- Crie lembretes.\n' +
      '- Vincule atividades a clientes ou oportunidades.\n' +
      '- Acompanhe prazos sem improviso.\n\n' +
      'Ajuda o time a manter execução consistente.',
  },
  {
    name: 'Produtos',
    href: '/produtos',
    icon: Package,
    helpDescription:
      'Catálogo central de produtos e serviços usados nas vendas.\n\n' +
      '- Cadastre descrição, preço e estoque quando fizer sentido.\n' +
      '- Reaproveite os itens em orçamentos e pedidos.\n\n' +
      'Quanto melhor esse cadastro, mais rápido o comercial opera.',
  },
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: Wallet,
    helpDescription:
      'Painel para cuidar do caixa com visão prática e profissional.\n\n' +
      '- Registre entradas e saídas.\n' +
      '- Acompanhe vencimentos.\n' +
      '- Decida com mais segurança onde investir ou cortar custos.\n\n' +
      'É a camada financeira que fecha o ciclo do CRM.',
  },
]

export function getMenuItemsForUser(
  items: MenuItem[],
  { role, username }: MenuItemVisibilityOptions
): MenuItem[] {
  const normalizedUsername = (username ?? '').trim().toLowerCase()
  const normalizedRole = (role ?? '').trim().toLowerCase()

  return items.filter((item) => {
    if (item.requiresAdmin && normalizedRole !== 'admin') return false
    if (item.requiresManager && normalizedRole !== 'manager') return false
    if (!item.visibleForUsernames) return true

    return item.visibleForUsernames.some(
      (value) => value.trim().toLowerCase() === normalizedUsername
    )
  })
}
