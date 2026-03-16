export type TeamPeriod = 'day' | 'week' | 'month'

export interface TeamMetrics {
  contatos: number
  tarefas: number
  orcamentos: number
  pedidos: number
  faturamento: number
}

export interface TeamPeriodRange {
  start: string
  end: string
}

export interface TeamMemberPerformance {
  userId: string
  name: string | null
  username: string
  metrics: Record<TeamPeriod, TeamMetrics>
}

export interface TeamOverviewResponse {
  teamName: string | null
  generatedAt: string
  members: TeamMemberPerformance[]
  totals: Record<TeamPeriod, TeamMetrics>
  periods: Record<TeamPeriod, TeamPeriodRange>
}
