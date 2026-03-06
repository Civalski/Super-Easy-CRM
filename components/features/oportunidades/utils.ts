import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { ItemForm, ProdutoServico } from './types'

export function buildItemForm(): ItemForm {
  return {
    produtoServicoId: '',
    descricao: '',
    quantidade: 1,
    precoUnitario: 0,
    desconto: 0,
  }
}

export function toNumber(value: string, fallback = 0): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeItemNumbers(quantidade: number, precoUnitario: number, desconto: number) {
  const quantidadeAjustada = Math.max(0, Number.isFinite(quantidade) ? quantidade : 0)
  const precoAjustado = Math.max(0, Number.isFinite(precoUnitario) ? precoUnitario : 0)
  const bruto = quantidadeAjustada * precoAjustado
  const descontoAjustado = Math.min(Math.max(0, Number.isFinite(desconto) ? desconto : 0), bruto)
  const subtotal = Math.max(0, bruto - descontoAjustado)

  return {
    quantidade: quantidadeAjustada,
    precoUnitario: precoAjustado,
    desconto: descontoAjustado,
    bruto,
    subtotal,
  }
}

export function calculateSubtotal(quantidade: number, precoUnitario: number, desconto: number): number {
  return normalizeItemNumbers(quantidade, precoUnitario, desconto).subtotal
}

export function summarizeCartItems(items: Array<Pick<ItemForm, 'quantidade' | 'precoUnitario' | 'desconto'>>) {
  return items.reduce(
    (acc, item) => {
      const normalized = normalizeItemNumbers(item.quantidade, item.precoUnitario, item.desconto)
      acc.quantidadeTotal += normalized.quantidade
      acc.totalBruto += normalized.bruto
      acc.totalDesconto += normalized.desconto
      acc.totalLiquido += normalized.subtotal
      return acc
    },
    { quantidadeTotal: 0, totalBruto: 0, totalDesconto: 0, totalLiquido: 0 }
  )
}

export function getProdutoFromOption(option: AsyncSelectOption | null): ProdutoServico | null {
  if (!option) return null
  const raw = (option.original && typeof option.original === 'object'
    ? option.original
    : option) as Partial<ProdutoServico> & { id?: string; nome?: string; precoPadrao?: number }
  const id = raw.id ?? (option as AsyncSelectOption).id
  const nome = raw.nome ?? (option as AsyncSelectOption).nome
  if (!id || !nome) return null

  return {
    id: String(id),
    nome: String(nome),
    tipo: raw.tipo === 'servico' ? 'servico' : 'produto',
    codigo: raw.codigo != null ? String(raw.codigo) : null,
    unidade: raw.unidade != null ? String(raw.unidade) : null,
    precoPadrao: Number(raw.precoPadrao ?? 0),
  }
}

export function extractLastNumber(value?: string | null): number | null {
  if (!value) return null
  const matches = value.match(/\d+/g)
  if (!matches || matches.length === 0) return null
  const parsed = Number(matches[matches.length - 1])
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function getDownloadFileNameFromHeader(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const fileNameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (fileNameStarMatch?.[1]) return decodeURIComponent(fileNameStarMatch[1]).replace(/["']/g, '').trim()
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return fileNameMatch?.[1]?.trim() || null
}

export function getProximaAcaoDate(num: number, unit: 'dias' | 'semanas' | 'meses'): string {
  const d = new Date()
  if (unit === 'dias') d.setDate(d.getDate() + num)
  else if (unit === 'semanas') d.setDate(d.getDate() + num * 7)
  else d.setMonth(d.getMonth() + num)
  return d.toISOString().split('T')[0]
}

export function formatDateInput(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseCurrencyInput(value: string): number | null {
  if (!value) return null
  return parseFloat(value.replace(/\./g, '').replace(',', '.'))
}

export function formatCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  if (!digits) return ''
  const numericValue = parseInt(digits, 10) / 100
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(numericValue)
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function currency(value: number): string {
  return currencyFormatter.format(value)
}
