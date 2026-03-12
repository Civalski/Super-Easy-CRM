import type { LucideIcon } from '@/lib/icons'
import {
  BarChart3,
  Calendar,
  ClipboardList,
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
  /** Quando definido, o item só aparece para usuários cujo username está na lista (ex: admin) */
  visibleForUsernames?: string[]
  /** Quando true, o item só aparece para usuários com role admin */
  requiresAdmin?: boolean
  /** Texto explicativo exibido no modo de ajuda ao clicar no item */
  helpDescription?: string
}

export const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    helpDescription:
      'Visão geral do seu negócio em um só lugar.\n\n' +
      'Acompanhe indicadores principais: vendas do período, oportunidades em aberto, tarefas pendentes e resumo financeiro. Use para ter uma leitura rápida de como está o desempenho e o que precisa de atenção.',
  },
  {
    name: 'Relatorios',
    href: '/relatorios',
    icon: BarChart3,
    visibleForUsernames: ['alisson355'],
    helpDescription:
      'Relatórios e análises detalhadas para acompanhar o desempenho do negócio.\n\n' +
      'Exporte dados, visualize tendências e tome decisões baseadas em números.',
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: Users,
    helpDescription:
      'Cadastro de pessoas e empresas com quem você se relaciona.\n\n' +
      'A diferença: Clientes são quem já comprou ou fez um orçamento. Leads são contatos frios que ainda não compraram e não fizeram orçamentos — os leads ficam na aba Funil.\n\n' +
      'Aqui você mantém dados de contato, histórico de interações, orçamentos e pedidos de cada um.',
  },
  {
    name: 'Orçamentos',
    href: '/oportunidades',
    icon: FileText,
    helpDescription:
      'Crie e gerencie orçamentos e propostas comerciais.\n\n' +
      'Cadastre itens, defina preços e condições de pagamento. Acompanhe o status de cada oportunidade (em análise, aprovado, recusado) até a conversão em pedido.',
  },
  {
    name: 'Pedidos',
    href: '/pedidos',
    icon: ClipboardList,
    helpDescription:
      'Pedidos de venda confirmados.\n\n' +
      'Acompanhe pedidos em andamento, parcelas, datas de vencimento e entregas. Gere cobranças a partir dos pedidos e mantenha o histórico organizado.',
  },
  {
    name: 'Funil',
    href: '/grupos',
    icon: Layers,
    helpDescription:
      'O Funil é onde você organiza seus leads e oportunidades em estágios visuais (como um quadro Kanban). Cada coluna representa uma fase: Sem contato, Contatado, Em potencial e Aguardando orçamento.\n\n' +
      'Arraste os cards entre as colunas conforme o lead avança. Leads que chegam em Aguardando orçamento são automaticamente transformados em clientes.\n\n' +
      'Use para não perder nenhum lead e ter visão clara do pipeline de vendas.',
  },
  {
    name: 'Metas',
    href: '/metas',
    icon: Trophy,
    helpDescription:
      'Defina metas de vendas e acompanhe o progresso.\n\n' +
      'Estipule objetivos por período (mensal, trimestral) e veja quanto já foi batido. Use para motivar a equipe e acompanhar se está no caminho certo.',
  },
  {
    name: 'Tarefas',
    href: '/tarefas',
    icon: Calendar,
    helpDescription:
      'As Tarefas são lembretes e atividades que você precisa executar no dia a dia. Crie tarefas para: ligar para um cliente, enviar um follow-up, agendar reunião ou qualquer outra ação.\n\nVocê pode vincular cada tarefa a um cliente ou a uma oportunidade específica. O sistema envia notificações quando uma tarefa está próxima do vencimento.\n\nUse as abas Pendentes e Concluídas para organizar o que falta fazer e o que já foi feito. Filtre por status e prioridade para focar no que realmente importa.',
  },
  {
    name: 'Produtos',
    href: '/produtos',
    icon: Package,
    helpDescription:
      'Cadastro de produtos e serviços que você vende.\n\n' +
      'Defina nomes, descrições, preços e controle de estoque quando necessário. Esses itens ficam disponíveis para incluir em orçamentos e pedidos.',
  },
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: Wallet,
    helpDescription:
      'O Financeiro centraliza o controle financeiro do seu negócio.\n\n' +
      'Contas a receber: registre valores que clientes devem pagar (parcelas de pedidos, serviços), acompanhe vencimentos e receba. Contas a pagar: registre despesas, fornecedores e prazos.\n\n' +
      'O fluxo de caixa mostra a previsão de entradas e saídas em períodos futuros. A separação de ambiente é por empresarial, pessoal e total.\n\n' +
      'Ações disponíveis: registrar pagamento, aplicar multa ou juros, gerar lembrete de cobrança. Cadastre fornecedores e funcionários para organizar melhor as contas.',
  },
]
