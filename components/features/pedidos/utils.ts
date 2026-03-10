import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { ItemForm, Pedido, PedidoSituacao, ProdutoServico } from './types'

export const buildItemForm = (): ItemForm => ({
  produtoServicoId: '',
  descricao: '',
  quantidade: 1,
  precoUnitario: 0,
  desconto: 0,
})

export const currency = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export const dateBr = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

export const dateInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

export function getProximaAcaoDate(num: number, unit: 'dias' | 'semanas' | 'meses'): string {
  const d = new Date()
  if (unit === 'dias') d.setDate(d.getDate() + num)
  else if (unit === 'semanas') d.setDate(d.getDate() + num * 7)
  else d.setMonth(d.getMonth() + num)
  return d.toISOString().split('T')[0]
}

export const isVendaConfirmada = (pedido: Pedido) =>
  pedido.statusEntrega === 'entregue' && pedido.pagamentoConfirmado === true

export const getPedidoSituacao = (pedido: Pedido): PedidoSituacao => {
  if (pedido.oportunidade.status === 'perdida') return 'cancelado'
  if (pedido.oportunidade.status === 'fechada' || isVendaConfirmada(pedido)) return 'venda'
  return 'pedido'
}

export const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

export const parseCurrencyInput = (value: string) => {
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeItemNumbers(quantidade: number, precoUnitario: number, desconto: number) {
  const quantidadeAjustada = Math.max(0, Number.isFinite(quantidade) ? quantidade : 0)
  const precoAjustado = Math.max(0, Number.isFinite(precoUnitario) ? precoUnitario : 0)
  const bruto = quantidadeAjustada * precoAjustado
  const descontoAjustado = Math.min(Math.max(0, Number.isFinite(desconto) ? desconto : 0), bruto)
  const subtotal = Math.max(0, bruto - descontoAjustado)
  return { quantidade: quantidadeAjustada, precoUnitario: precoAjustado, desconto: descontoAjustado, bruto, subtotal }
}

export const calculateSubtotal = (quantidade: number, precoUnitario: number, desconto: number) =>
  normalizeItemNumbers(quantidade, precoUnitario, desconto).subtotal

/** Converte percentual em valor absoluto de desconto. bruto * (pct / 100) */
export function descontoFromPercentual(bruto: number, percentual: number): number {
  if (bruto <= 0 || !Number.isFinite(percentual)) return 0
  return Math.min(bruto, Math.max(0, (bruto * percentual) / 100))
}

/** Converte valor absoluto de desconto em percentual. (desconto / bruto) * 100 */
export function percentualFromDesconto(bruto: number, desconto: number): number {
  if (bruto <= 0 || desconto <= 0) return 0
  return Math.min(100, (desconto / bruto) * 100)
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

export function getDownloadFileNameFromHeader(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const fileNameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (fileNameStarMatch?.[1]) return decodeURIComponent(fileNameStarMatch[1]).replace(/["']/g, '').trim()
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return fileNameMatch?.[1]?.trim() || null
}

export function getProdutoFromOption(option: AsyncSelectOption | null): ProdutoServico | null {
  if (!option || !option.original || typeof option.original !== 'object') return null
  const raw = option.original as Partial<ProdutoServico>
  if (!raw.id || !raw.nome) return null
  return {
    id: raw.id,
    nome: raw.nome,
    tipo: raw.tipo === 'servico' ? 'servico' : 'produto',
    codigo: raw.codigo || null,
    unidade: raw.unidade || null,
    precoPadrao: Number(raw.precoPadrao || 0),
  }
}
