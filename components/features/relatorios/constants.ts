import {
  Activity,
  BadgeCheck,
  CircleDollarSign,
  Receipt,
  Target,
  TrendingDown,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import type { DatePresetOption, MetricaKey, MetricaOption, ReportTemplateOption } from './types'

export const METRICAS_OPCIONAIS: MetricaOption[] = [
  {
    key: 'novos_clientes',
    label: 'Novos clientes',
    description: 'Quantidade de clientes cadastrados no periodo.',
    icon: Users,
    valueType: 'count',
  },
  {
    key: 'orcamentos',
    label: 'Orcamentos criados',
    description: 'Quantidade de oportunidades/orcamentos criados.',
    icon: Target,
    valueType: 'count',
  },
  {
    key: 'pedidos',
    label: 'Pedidos criados',
    description: 'Quantidade de pedidos criados no periodo.',
    icon: Receipt,
    valueType: 'count',
  },
  {
    key: 'pedidos_pagos',
    label: 'Pedidos pagos',
    description: 'Pedidos com pagamento confirmado.',
    icon: BadgeCheck,
    valueType: 'count',
  },
  {
    key: 'oportunidades_fechadas',
    label: 'Oportunidades fechadas',
    description: 'Oportunidades vencidas/fechadas com sucesso.',
    icon: Activity,
    valueType: 'count',
  },
  {
    key: 'oportunidades_perdidas',
    label: 'Oportunidades perdidas',
    description: 'Oportunidades marcadas como perdida.',
    icon: TrendingDown,
    valueType: 'count',
  },
  {
    key: 'cancelados',
    label: 'Cancelamentos',
    description: 'Orcamentos perdidos + pedidos cancelados.',
    icon: XCircle,
    valueType: 'count',
  },
  {
    key: 'receita_pedidos',
    label: 'Receita de pedidos',
    description: 'Soma do total liquido dos pedidos criados.',
    icon: CircleDollarSign,
    valueType: 'currency',
  },
  {
    key: 'receita_fechamentos',
    label: 'Receita de fechamentos',
    description: 'Soma do valor das oportunidades fechadas.',
    icon: Wallet,
    valueType: 'currency',
  },
  {
    key: 'ticket_medio_pedido',
    label: 'Ticket medio por pedido',
    description: 'Media diaria de ticket dos pedidos criados.',
    icon: CircleDollarSign,
    valueType: 'currency',
  },
]

export const REPORT_TEMPLATES: ReportTemplateOption[] = [
  {
    key: 'personalizado',
    label: 'Personalizado',
    description: 'Voce escolhe livremente as metricas.',
    metricas: ['pedidos'],
  },
  {
    key: 'executivo_comercial',
    label: 'Executivo Comercial',
    description: 'Visao geral de aquisicao, funil e conversao.',
    metricas: ['novos_clientes', 'orcamentos', 'oportunidades_fechadas', 'pedidos'],
  },
  {
    key: 'receita_performance',
    label: 'Receita e Performance',
    description: 'Receita, ticket medio e pedidos pagos.',
    metricas: ['receita_pedidos', 'receita_fechamentos', 'ticket_medio_pedido', 'pedidos_pagos'],
  },
  {
    key: 'risco_cancelamento',
    label: 'Risco e Cancelamentos',
    description: 'Perdas e cancelamentos para analise de risco comercial.',
    metricas: ['cancelados', 'oportunidades_perdidas', 'pedidos', 'orcamentos'],
  },
]

export const DATE_PRESETS: DatePresetOption[] = [
  { key: '7d', label: 'Ultimos 7 dias' },
  { key: '30d', label: 'Ultimos 30 dias' },
  { key: '90d', label: 'Ultimos 90 dias' },
  { key: 'ano_atual', label: 'Ano atual' },
]

export const DEFAULT_METRIC_COLORS: Record<MetricaKey, string> = {
  novos_clientes: '#3b82f6',
  orcamentos: '#6366f1',
  pedidos: '#10b981',
  cancelados: '#ef4444',
  oportunidades_fechadas: '#16a34a',
  oportunidades_perdidas: '#dc2626',
  receita_pedidos: '#0ea5e9',
  receita_fechamentos: '#0f766e',
  pedidos_pagos: '#22c55e',
  ticket_medio_pedido: '#f59e0b',
}
