import type { ProbabilityLevel } from '@/lib/domain/probabilidade'
import type { PedidoSituacao, QuickApproveChoice } from './types'

export const PEDIDOS_PAGE_SIZE = 20

export const STATUS_ENTREGA_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_preparacao: 'Em preparacao',
  enviado: 'Enviado',
  entregue: 'Entregue',
}

export const PROBABILITY_LEVELS: ProbabilityLevel[] = ['baixa', 'media', 'alta']

export const SITUACAO_PEDIDO_LABEL: Record<PedidoSituacao, string> = {
  pedido: 'Pedido em andamento',
  venda: 'Venda concluida',
  cancelado: 'Pedido cancelado',
}

export const SITUACAO_PEDIDO_BADGE: Record<PedidoSituacao, string> = {
  pedido: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  venda: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
}

export const QUICK_APPROVE_OPTIONS: Record<QuickApproveChoice, string> = {
  pagamento: 'Aprovar somente pagamento',
  entrega: 'Aprovar somente entrega',
  ambos: 'Aprovar pagamento e entrega',
}
