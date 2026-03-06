import type {
  ClienteCommercialStatusFilter,
  ClienteRevenueRangeFilter,
  CreateClienteForm,
  PaginationMeta,
} from './types'

export const CLIENTES_PAGE_SIZE = 25

export const initialCreateForm: CreateClienteForm = {
  perfil: 'b2c',
  nome: '',
  email: '',
  telefone: '',
  empresa: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  cargo: '',
  documento: '',
  website: '',
  dataNascimento: '',
  observacoes: '',
  camposPersonalizados: [],
}

export const initialPaginationMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: CLIENTES_PAGE_SIZE,
  pages: 1,
}

export const CLIENTES_COMMERCIAL_STATUS_OPTIONS: Array<{
  value: '' | ClienteCommercialStatusFilter
  label: string
}> = [
  { value: '', label: 'Status comercial: Todos' },
  { value: 'sem_oportunidade', label: 'Sem oportunidade' },
  { value: 'oportunidade_aberta', label: 'Com oportunidade aberta' },
  { value: 'ativo', label: 'Cliente ativo' },
  { value: 'inativo', label: 'Cliente inativo' },
]

export const CLIENTES_LAST_PURCHASE_OPTIONS: Array<{
  value: ''
  | '30'
  | '90'
  | '180'
  | '365'
  label: string
}> = [
  { value: '', label: 'Ultima compra: Qualquer periodo' },
  { value: '30', label: 'Comprou nos ultimos 30 dias' },
  { value: '90', label: 'Comprou nos ultimos 90 dias' },
  { value: '180', label: 'Comprou nos ultimos 180 dias' },
  { value: '365', label: 'Comprou nos ultimos 365 dias' },
]

export const CLIENTES_LAST_CONTACT_OPTIONS: Array<{
  value: '' | '30' | '90' | '180'
  label: string
}> = [
  { value: '', label: 'Ultimo contato: Qualquer periodo' },
  { value: '30', label: 'Contato nos ultimos 30 dias' },
  { value: '90', label: 'Contato nos ultimos 90 dias' },
  { value: '180', label: 'Contato nos ultimos 180 dias' },
]

export const CLIENTES_REVENUE_RANGE_OPTIONS: Array<{
  value: '' | ClienteRevenueRangeFilter
  label: string
}> = [
  { value: '', label: 'Valor comprado: Qualquer faixa' },
  { value: 'ate_5000', label: 'Ate R$ 5.000' },
  { value: 'de_5000_a_20000', label: 'R$ 5.001 a R$ 20.000' },
  { value: 'acima_20000', label: 'Acima de R$ 20.000' },
]
