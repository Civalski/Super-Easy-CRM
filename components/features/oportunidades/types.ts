import type { LucideIcon } from '@/lib/icons'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'

export interface Oportunidade {
  id: string
  numero: number
  titulo: string
  descricao: string | null
  valor: number | null
  formaPagamento?: string | null
  parcelas?: number | null
  desconto?: number | null
  status: string
  statusAnterior?: string | null
  motivoPerda?: string | null
  probabilidade: number
  dataFechamento?: string | null
  proximaAcaoEm?: string | null
  canalProximaAcao?: string | null
  responsavelProximaAcao?: string | null
  lembreteProximaAcao?: boolean
  createdAt?: string
  updatedAt?: string
  pedido?: {
    id: string
    numero?: number
  } | null
  cliente: {
    nome: string
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

export type DraftEditableField = 'quantidade' | 'desconto'

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface StatusConfig {
  label: string
  color: string
  icon: LucideIcon
}

export interface OrcamentoFormData {
  titulo: string
  descricao: string
  valor: string
  formaPagamento: string
  parcelas: string
  desconto: string
  probabilidade: string
  dataFechamento: string
  proximaAcaoEm: string
  canalProximaAcao: string
  responsavelProximaAcao: string
  lembreteProximaAcao: boolean
}

export type { AsyncSelectOption }
