import type { ContaFinanceira } from './types'
import { STATUS_CLASS_MAP, STATUS_CLASS_DEFAULT } from './constants'

export function getContaTitulo(conta: ContaFinanceira): string {
  return conta.descricao || conta.pedido?.oportunidade?.titulo || `Conta ${conta.id}`
}

export function getClienteNome(conta: ContaFinanceira): string {
  return conta.pedido?.oportunidade?.cliente?.nome || '-'
}

export function getSortDate(value?: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

export function getStatusResumo(contas: ContaFinanceira[]): string {
  if (contas.length === 0) return 'pendente'
  if (contas.every((c) => c.status === 'cancelado')) return 'cancelado'
  if (contas.every((c) => c.status === 'pago')) return 'pago'
  if (contas.some((c) => c.status === 'atrasado')) return 'atrasado'
  if (contas.some((c) => c.status === 'pago')) return 'parcial'
  return contas[0]?.status || 'pendente'
}

export function getStatusClass(status: string): string {
  return STATUS_CLASS_MAP[status] || STATUS_CLASS_DEFAULT
}

export function formatDateForInput(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}
