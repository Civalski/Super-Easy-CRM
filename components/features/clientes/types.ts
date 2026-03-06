export type CampoPersonalizado = {
  label: string
  value: string
}

export type ClientePerfil = 'b2c' | 'b2b'
export type ClienteCommercialStatusFilter = 'sem_oportunidade' | 'oportunidade_aberta' | 'ativo' | 'inativo'
export type ClienteRevenueRangeFilter = 'ate_5000' | 'de_5000_a_20000' | 'acima_20000'

export type CreateClienteForm = {
  perfil: ClientePerfil
  nome: string
  email: string
  telefone: string
  empresa: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  cargo: string
  documento: string
  website: string
  dataNascimento: string
  observacoes: string
  camposPersonalizados: CampoPersonalizado[]
}

export interface Cliente {
  id: string
  numero?: number
  nome: string
  email: string | null
  telefone: string | null
  empresa: string | null
  _count: {
    oportunidades: number
    contatos: number
  }
  prospecto?: {
    cnaePrincipalDesc: string | null
    capitalSocial: string | null
  } | null
}

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  pages: number
}
