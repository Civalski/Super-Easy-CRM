export interface Pedido {
  id: string
  numero: number
  statusEntrega: string
  pagamentoConfirmado: boolean
  formaPagamento: string | null
  dataEntrega: string | null
  dataAprovacao: string
  observacoes: string | null
  totalBruto: number
  totalDesconto: number
  totalLiquido: number
  oportunidade: {
    id: string
    clienteId: string
    titulo: string
    descricao: string | null
    valor: number | null
    formaPagamento: string | null
    parcelas: number | null
    desconto: number | null
    probabilidade: number
    dataFechamento: string | null
    proximaAcaoEm: string | null
    canalProximaAcao: string | null
    responsavelProximaAcao: string | null
    lembreteProximaAcao: boolean | null
    status: string
    cliente: { nome: string }
  }
}

export interface ProdutoServico {
  id: string
  codigo?: string | null
  nome: string
  tipo: 'produto' | 'servico'
  unidade?: string | null
  precoPadrao: number
}

export interface PedidoItem {
  id: string
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
  subtotal: number
}

export interface ItemForm {
  produtoServicoId: string
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
}

export interface DraftCreateItem extends ItemForm {
  id: string
  subtotal: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export type EditableItemField = 'descricao' | 'quantidade' | 'precoUnitario' | 'desconto'
export type DraftEditableField = 'descricao' | 'quantidade' | 'precoUnitario' | 'desconto'
export type PedidoSituacao = 'pedido' | 'venda' | 'cancelado'
export type PedidoTab = 'andamento' | 'vendas' | 'cancelados'
export type QuickApproveChoice = 'pagamento' | 'entrega' | 'ambos'
