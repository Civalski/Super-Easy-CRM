import type { TeamPeriod } from './types'

export const TEAM_PERIOD_OPTIONS: Array<{
  value: TeamPeriod
  label: string
  description: string
}> = [
  { value: 'day', label: 'Hoje', description: 'atividade registrada hoje' },
  { value: 'week', label: 'Semana', description: 'atividade desta semana' },
  { value: 'month', label: 'Mes', description: 'atividade deste mes' },
]

export const TEAM_METRIC_LABELS = {
  contatos: 'Contatos',
  tarefas: 'Tarefas',
  orcamentos: 'Orcamentos',
  pedidos: 'Pedidos',
  faturamento: 'Faturamento',
} as const
