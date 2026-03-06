export type AmbienteFinanceiro = 'geral' | 'pessoal'

export interface ContaFinanceira {
  id: string
  ambiente: AmbienteFinanceiro
  tipo: 'receber' | 'pagar'
  descricao: string | null
  valorTotal: number
  valorRecebido: number
  status: string
  autoDebito: boolean
  numeroParcela: number | null
  totalParcelas: number | null
  grupoParcelaId: string | null
  recorrenteMensal: boolean
  recorrenciaAtiva: boolean
  recorrenciaDiaVencimento: number | null
  dataVencimento: string | null
  pedido?: {
    oportunidade?: {
      titulo: string
      cliente?: { nome: string }
    }
  } | null
}

export interface FluxoSerie {
  month: string
  recebido: number
  saida: number
  previsto: number
  previstoReceber: number
  previstoPagar: number
  estornado: number
  saldo: number
  saldoProjetado: number
}

export interface FluxoData {
  totals: {
    recebido: number
    saida: number
    previsto: number
    previstoReceber: number
    previstoPagar: number
    estornado: number
    saldo: number
    saldoProjetado: number
  }
  series: FluxoSerie[]
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface FinanceStats {
  total: number
  receber: number
  pagar: number
  receberEmAberto: number
  pagarEmAberto: number
}

export interface GrupoContas {
  id: string
  contas: ContaFinanceira[]
  titulo: string
  cliente: string
  isParcelado: boolean
  isRecorrenteMensal: boolean
  totalParcelas: number
  parcelasPagas: number
  valorTotal: number
  valorRecebido: number
  primeiraData: string | null
  ultimaData: string | null
  statusResumo: string
  autoDebitoAtivo: boolean
  proximaContaAberta: ContaFinanceira | null
}

export interface CreateContaForm {
  ambiente: AmbienteFinanceiro
  tipo: 'receber' | 'pagar'
  descricao: string
  valorTotal: string
  dataVencimento: string
  autoDebito: boolean
  parcelado: boolean
  recorrenteMensal: boolean
  parcelas: string
  intervaloDias: string
  datasParcelas: string
}

export interface EditContaForm {
  ambiente: AmbienteFinanceiro
  tipo: 'receber' | 'pagar'
  descricao: string
  valorTotal: string
  dataVencimento: string
  autoDebito: boolean
  recorrenciaAtiva: boolean
  aplicarNoGrupoRecorrente: boolean
}
