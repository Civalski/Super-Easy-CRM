export interface TaskNotification {
  id: string
  titulo: string
  descricao?: string | null
  prioridade?: string | null
  dataVencimento: string | Date | null
  status?: string | null
  cliente?: {
    nome: string
  } | null
  oportunidade?: {
    titulo: string
  } | null
}
