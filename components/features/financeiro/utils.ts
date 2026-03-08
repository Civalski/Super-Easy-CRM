import type { ContaFinanceira } from './types'
import { STATUS_CLASS_MAP, STATUS_CLASS_DEFAULT } from './constants'

export function getContaTitulo(conta: ContaFinanceira): string {
  return conta.descricao || conta.pedido?.oportunidade?.titulo || `Conta ${conta.id}`
}

export function getClienteNome(conta: ContaFinanceira): string {
  return (
    conta.cliente?.nome ||
    conta.fornecedor?.nome ||
    conta.funcionario?.nome ||
    conta.pedido?.oportunidade?.cliente?.nome ||
    '-'
  )
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

/** Formata input de moeda com pontuação pt-BR (ex: 123456 -> 1.234,56) */
export function formatCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  if (!digits) return ''
  const numericValue = parseInt(digits, 10) / 100
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(numericValue)
}

/** Converte string formatada pt-BR em número (ex: 1.234,56 -> 1234.56) */
export function parseCurrencyInput(value: string): number | null {
  if (!value) return null
  const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

/** Retorna o quinto dia útil do mês atual em formato YYYY-MM-DD (exclui sábado e domingo) */
export function getDefaultDataVencimento(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const businessDays: number[] = []
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d)
    if (date.getMonth() !== month) break
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) businessDays.push(d)
  }
  const fifth = businessDays[4] ?? businessDays[businessDays.length - 1] ?? 1
  const d = new Date(year, month, fifth)
  return d.toISOString().slice(0, 10)
}
