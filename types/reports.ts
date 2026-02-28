export interface FunnelStage {
  key: string
  label: string
  total: number
}

export interface FunnelReport {
  period: {
    start: string
    end: string
  }
  stages: FunnelStage[]
  conversion: {
    leadToOrcamento: number
    orcamentoToVenda: number
    winRate: number
  }
}

export interface LossReason {
  motivo: string
  total: number
  valor: number
  percentual: number
}

export interface LossesReport {
  period: {
    start: string
    end: string
  }
  totals: {
    perdidas: number
    fechadas: number
    taxaPerda: number
    valorPerdido: number
  }
  motivos: LossReason[]
}

export interface RiskItem {
  id: string
  titulo: string
  cliente: string
  status: string | null
  valor: number
  probabilidade: number
  updatedAt: string
  nextAction: {
    at: string
    channel: string | null
    owner: string | null
  } | null
  riskScore: number
  riskLevel: 'alto' | 'medio' | 'baixo'
  daysWithoutUpdate: number
}

export interface PerformanceReport {
  period: {
    start: string
    end: string
  }
  metrics: {
    vendasFechadas: number
    cicloMedioDias: number
    cicloMinDias: number
    cicloMaxDias: number
    ticketMedio: number
  }
  riskRanking: RiskItem[]
  generatedAt: string
}
