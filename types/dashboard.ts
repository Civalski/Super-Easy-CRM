export type DashboardActivityType = 'tarefa' | 'oportunidade' | 'cliente'

export interface DashboardData {
  clientesCount: number
  pedidosCount: number
  pedidosSemPagamentoCount: number
  pedidosSemPagamentoValor: number
  oportunidadesCount: number
  orcamentosEmAbertoCount: number
  orcamentosEmAbertoValor: number
  tarefasCount: number
  valorTotal: number
  valorGanhos: number
  valorPerdidos: number
  faturamentoPerdaSerie: Array<{
    month: string
    faturamento: number
    perda: number
  }>
  vendasPorDia: Array<{ date: string; valor: number }>
  orcamentosCanceladosPorDia: Array<{ date: string; valor: number }>
  contatosFeitosPorDia: Array<{ date: string; count: number }>
  oportunidadesPorStatus: Array<{
    status: string
    _count: number
  }>
  tarefasPorStatus: Array<{
    status: string
    _count: number
  }>
}

export interface GoalSummary {
  id: string
  title: string
  metricType:
    | 'CLIENTES_CONTATADOS'
    | 'PROPOSTAS'
    | 'CLIENTES_CADASTRADOS'
    | 'VENDAS'
    | 'QUALIFICACAO'
    | 'PROSPECCAO'
    | 'FATURAMENTO'
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  target: number
  current?: number
  progress?: number
  periodStart?: string
  periodEnd?: string
  active?: boolean
}

export interface FluxoSerie {
  month: string
  recebido: number
  saida: number
  previstoReceber: number
  previstoPagar: number
  saldoProjetado: number
}

export interface FluxoData {
  totals: {
    recebido: number
    saida: number
    previstoReceber: number
    previstoPagar: number
    saldoProjetado: number
  }
  series: FluxoSerie[]
}

export interface DashboardActivityDetails {
  id: string
  titulo?: string | null
  nome?: string | null
  descricao?: string | null
  status?: string | null
  prioridade?: string | null
  dataVencimento?: string | Date | null
  probabilidade?: number | null
  valor?: number | null
  dataFechamento?: string | Date | null
  cliente?: {
    nome?: string | null
  } | null
  empresa?: string | null
  email?: string | null
  telefone?: string | null
}

export interface DashboardActivity {
  id: string
  type: DashboardActivityType
  title: string
  description?: string
  date: string | Date
  details?: DashboardActivityDetails | null
}
