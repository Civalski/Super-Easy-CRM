export interface Prospecto {
  id: string
  cnpj: string
  cnpjBasico: string
  cnpjOrdem: string
  cnpjDv: string
  razaoSocial: string
  nomeFantasia: string | null
  capitalSocial: string | null
  porte: string | null
  naturezaJuridica: string | null
  situacaoCadastral: string | null
  dataAbertura: string | null
  matrizFilial: string | null
  cnaePrincipal: string | null
  cnaePrincipalDesc: string | null
  cnaesSecundarios: string | null
  tipoLogradouro: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cep: string | null
  municipio: string
  uf: string
  telefone1: string | null
  telefone2: string | null
  email: string | null
  status: string
  lote: string | null
}

export interface CampoPersonalizado {
  label: string
  value: string
}

export interface OportunidadeHistorico {
  id: string
  titulo: string
  status: string
  valor: number | null
  motivoPerda: string | null
  createdAt: string
  updatedAt: string
  pedidoId: string | null
}

export interface PedidoHistorico {
  id: string
  numero: number
  statusEntrega: string
  pagamentoConfirmado: boolean
  totalLiquido: number
  createdAt: string
  updatedAt: string
  oportunidade: {
    id: string
    titulo: string
    status: string
  }
}

export interface HistoricoComercial {
  resumo: {
    orcamentosEmAberto: number
    pedidosEmAberto: number
    comprasConcluidas: number
    cancelamentos: number
    gastoMesAtual: number
    gastoUltimosSeisMeses: number
  }
  gastoMensalUltimosSeisMeses: Array<{
    mes: string
    valor: number
  }>
  oportunidadesRecentes: OportunidadeHistorico[]
  pedidosRecentes: PedidoHistorico[]
}

export interface Cliente {
  id: string
  numero?: number
  nome: string
  email: string | null
  telefone: string | null
  empresa: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  cargo: string | null
  documento: string | null
  website: string | null
  dataNascimento: string | null
  observacoes: string | null
  camposPersonalizados: CampoPersonalizado[] | null
  createdAt: string
  updatedAt: string
  _count: {
    oportunidades: number
    contatos: number
  }
  historicoComercial?: HistoricoComercial
  prospecto?: Prospecto | null
  isVirtual?: boolean
}

export interface ClienteFormData {
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
