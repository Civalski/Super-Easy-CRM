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

/** Retorna o quinto dia útil. Por padrão usa o do mês seguinte, exceto se o primeiro dia útil do mês atual ainda não tiver chegado. */
export function getDefaultDataVencimento(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const getBusinessDays = (y: number, m: number) => {
    const bizDays: number[] = []
    for (let d = 1; d <= 31; d++) {
      const date = new Date(y, m, d)
      if (date.getMonth() !== m) break
      const dow = date.getDay()
      if (dow !== 0 && dow !== 6) bizDays.push(d)
    }
    return bizDays
  }

  const currentMonthBizDays = getBusinessDays(year, month)
  const firstBusinessDay = currentMonthBizDays[0] ?? 1

  let targetYear = year
  let targetMonth = month

  if (now.getDate() >= firstBusinessDay) {
    targetMonth = month + 1
    if (targetMonth > 11) {
      targetMonth = 0
      targetYear++
    }
  }

  const targetBizDays = getBusinessDays(targetYear, targetMonth)
  const fifthBusinessDay = targetBizDays[4] ?? targetBizDays[targetBizDays.length - 1] ?? 1

  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(fifthBusinessDay)}`
}
