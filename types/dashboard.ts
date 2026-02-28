export type DashboardActivityType = 'tarefa' | 'oportunidade' | 'cliente'

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
