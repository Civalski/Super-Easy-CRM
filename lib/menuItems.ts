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
      'Visao geral do seu negocio em um so painel.\n\n' +
      'Aqui voce acompanha os numeros mais importantes do dia: vendas, tarefas, oportunidades e resumo financeiro.\n\n' +
      'Use esta aba para decidir prioridades antes de entrar nos detalhes.',
  },
  {
    name: 'Relatorios',
    href: '/relatorios',
    icon: BarChart3,
    visibleForUsernames: ['alisson355'],
    helpDescription:
      'Analises detalhadas para entender desempenho e tendencias.\n\n' +
      'Filtre periodos, compare resultados e exporte dados quando precisar compartilhar com o time.\n\n' +
      'Ideal para revisar estrategia com base em numeros concretos.',
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: Users,
    helpDescription:
      'Cadastro completo de pessoas e empresas atendidas.\n\n' +
      'Clientes sao contatos que ja compraram ou receberam orcamento. Leads frios ficam no Funil ate avancarem.\n\n' +
      'Centralize historico, dados de contato e proximas acoes em um unico lugar.',
  },
  {
    name: 'Orçamentos',
    href: '/oportunidades',
    icon: FileText,
    helpDescription:
      'Crie propostas e acompanhe cada negociacao.\n\n' +
      'Defina itens, valores e condicoes de pagamento com clareza.\n\n' +
      'Monitore o status ate aprovar, perder ou converter em pedido.',
  },
  {
    name: 'Pedidos',
    href: '/pedidos',
    icon: ClipboardList,
    helpDescription:
      'Controle dos pedidos confirmados.\n\n' +
      'Acompanhe entrega, parcelas, vencimentos e status de cobranca.\n\n' +
      'Mantenha o processo de pos-venda organizado do inicio ao fim.',
  },
  {
    name: 'Contratos',
    href: '/contratos',
    icon: DocumentCheck,
    helpDescription:
      'Crie e gerencie contratos formais.\n\n' +
      'Preencha clausulas, dados das partes, datas e assinaturas.\n\n' +
      'Gere PDFs profissionais com design formal para impressao ou envio.',
  },
  {
    name: 'Funil',
    href: '/grupos',
    icon: Layers,
    helpDescription:
      'Pipeline visual para organizar leads por etapa.\n\n' +
      'Mova os cards conforme o contato avanca: sem contato, em conversa, potencial e aguardando orcamento.\n\n' +
      'Use o Funil para nao perder oportunidades e manter ritmo comercial.',
  },
  {
    name: 'Equipe',
    href: '/equipe',
    icon: Users,
    requiresManager: true,
    helpDescription:
      'Visao da equipe para gerentes acompanharem desempenho e atividades.\n\n' +
      'Acompanhe os membros do seu time e monitore resultados em um so lugar.',
  },
  {
    name: 'Metas',
    href: '/metas',
    icon: Trophy,
    helpDescription:
      'Defina objetivos e acompanhe evolucao da equipe.\n\n' +
      'Configure metas por periodo e veja o progresso em tempo real.\n\n' +
      'Use os resultados para ajustar foco e acelerar performance.',
  },
  {
    name: 'Tarefas',
    href: '/tarefas',
    icon: Calendar,
    helpDescription:
      'Organizacao das atividades do dia a dia.\n\n' +
      'Crie lembretes, vincule clientes ou oportunidades e acompanhe prazos.\n\n' +
      'Separe entre pendentes e concluidas para manter execucao previsivel.',
  },
  {
    name: 'Produtos',
    href: '/produtos',
    icon: Package,
    helpDescription:
      'Catalogo de produtos e servicos vendidos.\n\n' +
      'Cadastre descricao, preco e estoque quando aplicavel.\n\n' +
      'Esses itens alimentam orcamentos e pedidos com mais agilidade.',
  },
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: Wallet,
    helpDescription:
      'Controle de entradas, saidas e previsao de caixa.\n\n' +
      'Registre contas a receber, contas a pagar e acompanhe vencimentos sem perder prazos.\n\n' +
      'Use esta aba para decidir com seguranca onde investir e onde cortar custos.',
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
