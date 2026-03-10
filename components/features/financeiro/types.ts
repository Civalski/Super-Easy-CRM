export type AmbienteFinanceiro = 'geral' | 'pessoal'

/** Ambiente de visualização: geral, pessoal ou total (soma de ambos) */
export type AmbienteFinanceiroView = 'geral' | 'pessoal' | 'total'

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
  multaPorAtrasoPercentual?: number | null
  multaPorAtrasoValor?: number | null
  multaPorAtrasoPeriodo?: string | null
  pedido?: {
    oportunidade?: {
      titulo: string
      cliente?: { nome: string }
    }
  } | null
  cliente?: { id: string; nome: string } | null
  fornecedor?: { id: string; nome: string } | null
  funcionario?: { id: string; nome: string } | null
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

export type TipoVinculoConta = 'nenhum' | 'cliente' | 'fornecedor' | 'funcionario'

export interface CreateContaForm {
  ambiente: AmbienteFinanceiro
  tipo: 'receber' | 'pagar'
  tipoVinculo: TipoVinculoConta
  entidadeId: string
  descricao: string
  valorTotal: string
  dataVencimento: string
  autoDebito: boolean
  parcelado: boolean
  recorrenteMensal: boolean
  parcelas: string
  intervaloDias: string
  datasParcelas: string
  multaPorAtrasoAtiva: boolean
  multaPorAtrasoTipo: 'percentual' | 'valor'
  multaPorAtrasoValor: string
  multaPorAtrasoPeriodo: 'dia' | 'semana' | 'mes'
}

export interface EditContaForm {
  ambiente: AmbienteFinanceiro
  tipo: 'receber' | 'pagar'
  tipoVinculo: TipoVinculoConta
  entidadeId: string
  descricao: string
  valorTotal: string
  dataVencimento: string
  autoDebito: boolean
  recorrenciaAtiva: boolean
  aplicarNoGrupoRecorrente: boolean
}
