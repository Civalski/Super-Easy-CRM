'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'
import { AsyncSelect, Button, SideCreateDrawer } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Info,
  Loader2,
  Minus,
  PackagePlus,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from 'lucide-react'

interface Pedido {
  id: string
  numero: number
  statusEntrega: string
  pagamentoConfirmado: boolean
  formaPagamento: string | null
  dataEntrega: string | null
  dataAprovacao: string
  observacoes: string | null
  totalBruto: number
  totalDesconto: number
  totalLiquido: number
  oportunidade: {
    titulo: string
    descricao: string | null
    cliente: { nome: string }
  }
}

interface ProdutoServico {
  id: string
  codigo?: string | null
  nome: string
  tipo: 'produto' | 'servico'
  unidade?: string | null
  precoPadrao: number
}

interface PedidoItem {
  id: string
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
  subtotal: number
}

type EditableItemField = 'descricao' | 'quantidade' | 'precoUnitario' | 'desconto'

interface ItemForm {
  produtoServicoId: string
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
}

interface DraftCreateItem extends ItemForm {
  id: string
  subtotal: number
}

type DraftEditableField = 'descricao' | 'quantidade' | 'precoUnitario' | 'desconto'

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

const PEDIDOS_PAGE_SIZE = 20

const STATUS_ENTREGA_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_preparacao: 'Em preparacao',
  enviado: 'Enviado',
  entregue: 'Entregue',
}

const buildItemForm = (): ItemForm => ({
  produtoServicoId: '',
  descricao: '',
  quantidade: 1,
  precoUnitario: 0,
  desconto: 0,
})

const currency = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const dateBr = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

const dateInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeItemNumbers(quantidade: number, precoUnitario: number, desconto: number) {
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

const calculateSubtotal = (quantidade: number, precoUnitario: number, desconto: number) =>
  normalizeItemNumbers(quantidade, precoUnitario, desconto).subtotal

function summarizeCartItems(items: Array<Pick<ItemForm, 'quantidade' | 'precoUnitario' | 'desconto'>>) {
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

function getProdutoFromOption(option: AsyncSelectOption | null): ProdutoServico | null {
  if (!option || !option.original || typeof option.original !== 'object') {
    return null
  }

  const raw = option.original as Partial<ProdutoServico>
  if (!raw.id || !raw.nome) {
    return null
  }

  return {
    id: raw.id,
    nome: raw.nome,
    tipo: raw.tipo === 'servico' ? 'servico' : 'produto',
    codigo: raw.codigo || null,
    unidade: raw.unidade || null,
    precoPadrao: Number(raw.precoPadrao || 0),
  }
}

export default function PedidosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdFilter = searchParams.get('clienteId')?.trim() || ''
  const clienteNomeFilter = searchParams.get('clienteNome') || 'Cliente selecionado'
  const statusEntregaFilter = searchParams.get('statusEntrega')?.trim() || ''
  const hasClienteFilter = clienteIdFilter.length > 0
  const hasStatusFilter = statusEntregaFilter.length > 0
  const queryFilter = [
    hasClienteFilter ? `clienteId=${encodeURIComponent(clienteIdFilter)}` : null,
    hasStatusFilter ? `statusEntrega=${encodeURIComponent(statusEntregaFilter)}` : null,
  ]
    .filter(Boolean)
    .join('&')

  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PEDIDOS_PAGE_SIZE,
    pages: 1,
  })
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [savingById, setSavingById] = useState<Record<string, boolean>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeItemsPedidoId, setActiveItemsPedidoId] = useState<string | null>(null)

  const [itemsLoaded, setItemsLoaded] = useState<Record<string, boolean>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [itemsSaving, setItemsSaving] = useState<Record<string, boolean>>({})
  const [itemsByPedido, setItemsByPedido] = useState<Record<string, PedidoItem[]>>({})
  const [itemFormByPedido, setItemFormByPedido] = useState<Record<string, ItemForm>>({})
  const [produtoLabelByPedido, setProdutoLabelByPedido] = useState<Record<string, string>>({})
  const lastQueryFilterRef = useRef(queryFilter)

  const fetchPedidos = useCallback(async (targetPage: number) => {
    try {
      setLoading(true)
      const query = queryFilter ? `&${queryFilter}` : ''
      const res = await fetch(`/api/pedidos?paginated=true&page=${targetPage}&limit=${PEDIDOS_PAGE_SIZE}${query}`)
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Erro ao carregar pedidos')

      const nextData = Array.isArray(payload?.data) ? payload.data : []
      const nextMeta: PaginationMeta = {
        total: Number(payload?.meta?.total || 0),
        page: Number(payload?.meta?.page || targetPage),
        limit: Number(payload?.meta?.limit || PEDIDOS_PAGE_SIZE),
        pages: Number(payload?.meta?.pages || 1),
      }

      if (nextData.length === 0 && targetPage > 1 && nextMeta.total > 0) {
        setPage((prev) => Math.max(1, prev - 1))
        return
      }

      setPedidos(nextData)
      setMeta(nextMeta)
    } catch {
      setPedidos([])
      setMeta((prev) => ({ ...prev, total: 0, pages: 1, page: targetPage }))
    } finally {
      setLoading(false)
    }
  }, [queryFilter])

  useEffect(() => {
    if (lastQueryFilterRef.current !== queryFilter) {
      lastQueryFilterRef.current = queryFilter
      if (page !== 1) {
        setPage(1)
        return
      }
    }

    fetchPedidos(page)
  }, [fetchPedidos, page, queryFilter])

  const stats = useMemo(() => {
    const total = pedidos.length
    const entregue = pedidos.filter((p) => p.statusEntrega === 'entregue').length
    const pendentes = total - entregue
    const totalLiquido = pedidos.reduce((sum, p) => sum + (p.totalLiquido || 0), 0)
    return { total, pendentes, entregue, totalLiquido }
  }, [pedidos])

  const updatePedidoTotals = (pedidoId: string, totals: { totalBruto: number; totalDesconto: number; totalLiquido: number }) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              totalBruto: totals.totalBruto,
              totalDesconto: totals.totalDesconto,
              totalLiquido: totals.totalLiquido,
            }
          : p
      )
    )
  }

  const loadItems = useCallback(async (pedidoId: string) => {
    try {
      setItemsLoading((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar itens')
      setItemsByPedido((prev) => ({ ...prev, [pedidoId]: Array.isArray(data?.itens) ? data.itens : [] }))
      setItemsLoaded((prev) => ({ ...prev, [pedidoId]: true }))
      setItemFormByPedido((prev) => ({ ...prev, [pedidoId]: prev[pedidoId] || buildItemForm() }))
      if (data?.pedido) updatePedidoTotals(pedidoId, data.pedido)
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao carregar itens.' })
    } finally {
      setItemsLoading((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }, [])

  const handleOpenItemsModal = async (pedidoId: string) => {
    setActiveItemsPedidoId(pedidoId)
    if (!itemsLoaded[pedidoId]) await loadItems(pedidoId)
  }

  const handlePedidoField = (
    pedidoId: string,
    field: 'statusEntrega' | 'formaPagamento' | 'dataEntrega' | 'observacoes' | 'pagamentoConfirmado',
    value: string | boolean
  ) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p
        if (field === 'pagamentoConfirmado') return { ...p, pagamentoConfirmado: Boolean(value) }
        const text = typeof value === 'string' ? value : ''
        if (field === 'formaPagamento') return { ...p, formaPagamento: text || null }
        if (field === 'dataEntrega') return { ...p, dataEntrega: text || null }
        if (field === 'observacoes') return { ...p, observacoes: text || null }
        return { ...p, statusEntrega: text }
      })
    )
  }

  const handleSavePedido = async (pedido: Pedido) => {
    try {
      setSavingById((prev) => ({ ...prev, [pedido.id]: true }))
      const res = await fetch(`/api/pedidos/${pedido.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusEntrega: pedido.statusEntrega,
          pagamentoConfirmado: pedido.pagamentoConfirmado,
          formaPagamento: pedido.formaPagamento,
          dataEntrega: dateInput(pedido.dataEntrega),
          observacoes: pedido.observacoes,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar pedido')
      setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? data : p)))
      await Swal.fire({ icon: 'success', title: 'Pedido atualizado' })
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao salvar.' })
    } finally {
      setSavingById((prev) => ({ ...prev, [pedido.id]: false }))
    }
  }

  const handleItemField = (pedidoId: string, itemId: string, field: EditableItemField, value: string) => {
    setItemsByPedido((prev) => ({
      ...prev,
      [pedidoId]: (prev[pedidoId] || []).map((item) => {
        if (item.id !== itemId) return item
        if (field === 'descricao') return { ...item, descricao: value }
        const numeric = toNumber(value, 0)
        if (field === 'quantidade') {
          const normalized = normalizeItemNumbers(numeric, item.precoUnitario, item.desconto)
          return {
            ...item,
            quantidade: normalized.quantidade,
            desconto: normalized.desconto,
            subtotal: normalized.subtotal,
          }
        }
        if (field === 'precoUnitario') {
          const normalized = normalizeItemNumbers(item.quantidade, numeric, item.desconto)
          return {
            ...item,
            precoUnitario: normalized.precoUnitario,
            desconto: normalized.desconto,
            subtotal: normalized.subtotal,
          }
        }
        if (field === 'desconto') {
          const normalized = normalizeItemNumbers(item.quantidade, item.precoUnitario, numeric)
          return {
            ...item,
            desconto: normalized.desconto,
            subtotal: normalized.subtotal,
          }
        }
        return item
      }),
    }))
  }

  const handleSaveItem = async (pedidoId: string, item: PedidoItem) => {
    if (!item.descricao.trim()) return
    try {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: item.desconto,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar item')
      setItemsByPedido((prev) => ({
        ...prev,
        [pedidoId]: (prev[pedidoId] || []).map((current) => (current.id === item.id ? data.item : current)),
      }))
      if (data?.totals) updatePedidoTotals(pedidoId, data.totals)
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao salvar item.' })
    } finally {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleDeleteItem = async (pedidoId: string, itemId: string) => {
    try {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens?itemId=${itemId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir item')
      setItemsByPedido((prev) => ({ ...prev, [pedidoId]: (prev[pedidoId] || []).filter((i) => i.id !== itemId) }))
      if (data?.totals) updatePedidoTotals(pedidoId, data.totals)
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao excluir item.' })
    } finally {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleItemForm = (pedidoId: string, field: keyof ItemForm, value: string) => {
    setItemFormByPedido((prev) => {
      const current = prev[pedidoId] || buildItemForm()
      if (field === 'descricao' || field === 'produtoServicoId') {
        return { ...prev, [pedidoId]: { ...current, [field]: value } }
      }
      const numericValue = toNumber(value, 0)
      const next = { ...current, [field]: numericValue }
      const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
      return {
        ...prev,
        [pedidoId]: {
          ...next,
          quantidade: normalized.quantidade,
          precoUnitario: normalized.precoUnitario,
          desconto: normalized.desconto,
        },
      }
    })
  }

  const handleSelectProduto = (pedidoId: string, option: AsyncSelectOption | null) => {
    const found = getProdutoFromOption(option)
    setItemFormByPedido((prev) => {
      const current = prev[pedidoId] || buildItemForm()
      return {
        ...prev,
        [pedidoId]: {
          ...current,
          produtoServicoId: found?.id || '',
          descricao: found ? found.nome : current.descricao,
          precoUnitario: found ? found.precoPadrao : current.precoUnitario,
        },
      }
    })
    setProdutoLabelByPedido((prev) => ({
      ...prev,
      [pedidoId]: option?.nome || '',
    }))
  }

  const handleAddItem = async (pedidoId: string) => {
    const form = itemFormByPedido[pedidoId] || buildItemForm()
    if (!form.descricao.trim()) return
    try {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoServicoId: form.produtoServicoId || null,
          descricao: form.descricao,
          quantidade: form.quantidade,
          precoUnitario: form.precoUnitario,
          desconto: form.desconto,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao adicionar item')
      setItemsByPedido((prev) => ({ ...prev, [pedidoId]: [...(prev[pedidoId] || []), data.item] }))
      setItemFormByPedido((prev) => ({ ...prev, [pedidoId]: buildItemForm() }))
      setProdutoLabelByPedido((prev) => ({ ...prev, [pedidoId]: '' }))
      if (data?.totals) updatePedidoTotals(pedidoId, data.totals)
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao adicionar item.' })
    } finally {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  const activePedido = useMemo(
    () => pedidos.find((pedido) => pedido.id === activeItemsPedidoId) || null,
    [activeItemsPedidoId, pedidos]
  )

  const clearListFilters = useCallback(() => {
    if (!searchParams.get('clienteId') && !searchParams.get('clienteNome') && !searchParams.get('statusEntrega')) {
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('clienteId')
    params.delete('clienteNome')
    params.delete('statusEntrega')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
  }, [router, searchParams])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 p-2.5 shadow-lg shadow-blue-500/25">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Entregas, pagamentos e itens</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)}><Plus size={16} className="mr-1.5" />Novo Pedido</Button>
          <Link href="/oportunidades"><Button variant="outline">Ir para Orçamentos</Button></Link>
        </div>
      </div>

      {(hasClienteFilter || hasStatusFilter) && (
        <div className="flex flex-wrap items-center gap-2">
          {hasClienteFilter && (
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              Cliente: {clienteNomeFilter}
            </span>
          )}
          {hasStatusFilter && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Status entrega: {statusEntregaFilter}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={clearListFilters}>
            Limpar filtro
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ClipboardList size={16} />} title="Total de Pedidos" value={String(stats.total)} />
        <StatCard icon={<Truck size={16} />} title="Em Andamento" value={String(stats.pendentes)} />
        <StatCard icon={<CheckCircle2 size={16} />} title="Entregues" value={String(stats.entregue)} />
        <StatCard icon={<CreditCard size={16} />} title="Total Liquido" value={currency(stats.totalLiquido)} />
      </div>

      {loading && <div className="flex min-h-[220px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}

      {!loading &&
        pedidos.map((pedido) => (
          <div key={pedido.id} className="crm-card p-4 space-y-4">
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 dark:border-gray-700 sm:flex-row sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Pedido #{pedido.numero}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{pedido.oportunidade.titulo}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cliente: {pedido.oportunidade.cliente.nome}</p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 sm:text-right">
                <p>Liquido: <span className="font-semibold text-blue-600 dark:text-blue-400">{currency(pedido.totalLiquido)}</span></p>
                <p>Aprovado em {dateBr(pedido.dataAprovacao)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <select value={pedido.statusEntrega} onChange={(e) => handlePedidoField(pedido.id, 'statusEntrega', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">{Object.entries(STATUS_ENTREGA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <input value={pedido.formaPagamento || ''} onChange={(e) => handlePedidoField(pedido.id, 'formaPagamento', e.target.value)} placeholder="Forma de pagamento" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
              <input type="date" value={dateInput(pedido.dataEntrega)} onChange={(e) => handlePedidoField(pedido.id, 'dataEntrega', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:scheme-dark" />
              <div className="rounded-lg bg-gray-50 p-2 text-xs dark:bg-gray-800">
                <p>Bruto: {currency(pedido.totalBruto)}</p>
                <p>Desconto: {currency(pedido.totalDesconto)}</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">Liquido: {currency(pedido.totalLiquido)}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"><CalendarClock size={12} />{pedido.pagamentoConfirmado && pedido.statusEntrega === 'entregue' ? 'Venda confirmada' : 'Venda pendente'}</div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={pedido.pagamentoConfirmado} onChange={(e) => handlePedidoField(pedido.id, 'pagamentoConfirmado', e.target.checked)} className="h-4 w-4 rounded-sm border-gray-300 text-blue-600" />
              Pagamento confirmado
            </label>

            <textarea rows={2} value={pedido.observacoes || ''} onChange={(e) => handlePedidoField(pedido.id, 'observacoes', e.target.value)} placeholder="Observacoes" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button size="sm" variant="outline" onClick={() => handleOpenItemsModal(pedido.id)}>Produtos do pedido</Button>
              <Button size="sm" onClick={() => handleSavePedido(pedido)} disabled={Boolean(savingById[pedido.id])}>{savingById[pedido.id] ? 'Salvando...' : <><Save size={14} className="mr-1.5" />Salvar</>}</Button>
            </div>
          </div>
        ))}

      {!loading && meta.pages > 1 && (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
          <span className="text-gray-600 dark:text-gray-300">
            Pagina {meta.page} de {meta.pages} ({meta.total} pedidos)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page >= meta.pages}
              onClick={() => setPage((prev) => Math.min(meta.pages, prev + 1))}
            >
              Proxima
            </Button>
          </div>
        </div>
      )}

      {activePedido && (
        <PedidoItemsModal
          pedido={activePedido}
          itens={itemsByPedido[activePedido.id] || []}
          form={itemFormByPedido[activePedido.id] || buildItemForm()}
          produtoLabel={produtoLabelByPedido[activePedido.id] || ''}
          loading={Boolean(itemsLoading[activePedido.id])}
          saving={Boolean(itemsSaving[activePedido.id])}
          onClose={() => setActiveItemsPedidoId(null)}
          onItemField={(itemId, field, value) => handleItemField(activePedido.id, itemId, field, value)}
          onSaveItem={(item) => handleSaveItem(activePedido.id, item)}
          onDeleteItem={(itemId) => handleDeleteItem(activePedido.id, itemId)}
          onFormField={(field, value) => handleItemForm(activePedido.id, field, value)}
          onSelectProduto={(option) => handleSelectProduto(activePedido.id, option)}
          onAddItem={() => handleAddItem(activePedido.id)}
        />
      )}

      {showCreateModal && (
        <CreatePedidoDiretoModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            setPage(1)
            void fetchPedidos(1)
          }}
        />
      )}
    </div>
  )
}

function PedidoItemsModal({
  pedido,
  itens,
  form,
  produtoLabel,
  loading,
  saving,
  onClose,
  onItemField,
  onSaveItem,
  onDeleteItem,
  onFormField,
  onSelectProduto,
  onAddItem,
}: {
  pedido: Pedido
  itens: PedidoItem[]
  form: ItemForm
  produtoLabel: string
  loading: boolean
  saving: boolean
  onClose: () => void
  onItemField: (itemId: string, field: EditableItemField, value: string) => void
  onSaveItem: (item: PedidoItem) => void
  onDeleteItem: (itemId: string) => void
  onFormField: (field: keyof ItemForm, value: string) => void
  onSelectProduto: (option: AsyncSelectOption | null) => void
  onAddItem: () => void
}) {
  const totals = useMemo(() => summarizeCartItems(itens), [itens])
  const draftSubtotal = calculateSubtotal(form.quantidade, form.precoUnitario, form.desconto)
  const canAddItem = form.descricao.trim().length > 0 && form.quantidade > 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="crm-card mx-4 max-h-[90vh] w-full max-w-5xl overflow-y-auto p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Produtos do Pedido #{pedido.numero}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pedido.oportunidade.titulo} - {pedido.oportunidade.cliente.nome}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        {loading && (
          <div className="flex min-h-[120px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        )}
        {!loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Itens</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{itens.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Bruto</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currency(totals.totalBruto)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Desconto</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{currency(totals.totalDesconto)}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Total liquido</p>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currency(totals.totalLiquido)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <ShoppingCart size={14} />
                Itens no carrinho
              </div>
              {itens.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Nenhum item adicionado ainda.
                </p>
              )}
              <div className="space-y-2">
                {itens.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                      <label className="md:col-span-4">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Descricao</span>
                        <input
                          value={item.descricao}
                          onChange={(e) => onItemField(item.id, 'descricao', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Quantidade</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => onItemField(item.id, 'quantidade', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Preco unit.</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precoUnitario}
                          onChange={(e) => onItemField(item.id, 'precoUnitario', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.desconto}
                          onChange={(e) => onItemField(item.id, 'desconto', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <div className="flex flex-col justify-end md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                        <p className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                          {currency(calculateSubtotal(item.quantidade, item.precoUnitario, item.desconto))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSaveItem(item)}
                        className="rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 shadow-xs hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
                      >
                        Salvar linha
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <PackagePlus size={14} />
                Adicionar novo item
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                <label className="md:col-span-4">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Produto/Servico</span>
                  <AsyncSelect
                    className="min-w-0"
                    placeholder="Buscar por nome, codigo, tipo..."
                    value={form.produtoServicoId || ''}
                    initialLabel={produtoLabel}
                    onChange={onSelectProduto}
                    fetchUrl="/api/produtos-servicos/busca"
                  />
                </label>
                <label className="md:col-span-4">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Descricao do item</span>
                  <input
                    value={form.descricao}
                    onChange={(e) => onFormField('descricao', e.target.value)}
                    placeholder="Ex: Kit manutencao trimestral"
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Qtd</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.quantidade}
                    onChange={(e) => onFormField('quantidade', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Preco</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precoUnitario}
                    onChange={(e) => onFormField('precoUnitario', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.desconto}
                    onChange={(e) => onFormField('desconto', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <div className="flex flex-col justify-end md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                  <p className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                    {currency(draftSubtotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAddItem}
                  disabled={saving || !canAddItem}
                  className="md:col-span-12 inline-flex items-center justify-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-2 text-xs font-medium text-purple-700 shadow-xs hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
                >
                  <Plus size={14} />
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className="crm-card p-4">
      <div className="mb-1 flex items-center gap-2 text-gray-600 dark:text-gray-400">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

function CreatePedidoDiretoModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(null)
  const [statusInfo, setStatusInfo] = useState<string | null>(null)
  const [selectedProdutoLabel, setSelectedProdutoLabel] = useState('')
  const [itemForm, setItemForm] = useState<ItemForm>(buildItemForm())
  const [itens, setItens] = useState<DraftCreateItem[]>([])
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    statusEntrega: 'pendente',
    pagamentoConfirmado: false,
    formaPagamento: '',
    dataEntrega: '',
    observacoes: '',
  })

  const cartSummary = useMemo(() => summarizeCartItems(itens), [itens])
  const draftSubtotal = calculateSubtotal(itemForm.quantidade, itemForm.precoUnitario, itemForm.desconto)
  const hasCartItems = itens.length > 0

  const handleItemForm = (field: keyof ItemForm, value: string) => {
    setItemForm((prev) => {
      if (field === 'descricao' || field === 'produtoServicoId') {
        return { ...prev, [field]: value }
      }
      const numericValue = toNumber(value, 0)
      const next = { ...prev, [field]: numericValue }
      const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
      return {
        ...next,
        quantidade: normalized.quantidade,
        precoUnitario: normalized.precoUnitario,
        desconto: normalized.desconto,
      }
    })
  }

  const handleSelectProduto = (option: AsyncSelectOption | null) => {
    const selected = getProdutoFromOption(option)
    setItemForm((prev) => ({
      ...prev,
      produtoServicoId: selected?.id || '',
      descricao: selected ? selected.nome : prev.descricao,
      precoUnitario: selected ? selected.precoPadrao : prev.precoUnitario,
    }))
    setSelectedProdutoLabel(option?.nome || '')
  }

  const handleAddDraftItem = () => {
    if (!itemForm.descricao.trim()) return
    const normalized = normalizeItemNumbers(itemForm.quantidade, itemForm.precoUnitario, itemForm.desconto)
    if (normalized.quantidade <= 0) return

    setItens((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        ...itemForm,
        quantidade: normalized.quantidade,
        precoUnitario: normalized.precoUnitario,
        desconto: normalized.desconto,
        subtotal: normalized.subtotal,
      },
    ])
    setItemForm(buildItemForm())
    setSelectedProdutoLabel('')
  }

  const handleDraftItemField = (id: string, field: DraftEditableField, value: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (field === 'descricao') {
          return { ...item, descricao: value }
        }
        const numericValue = toNumber(value, 0)
        const next = { ...item, [field]: numericValue }
        const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
        return {
          ...next,
          quantidade: normalized.quantidade,
          precoUnitario: normalized.precoUnitario,
          desconto: normalized.desconto,
          subtotal: normalized.subtotal,
        }
      })
    )
  }

  const handleStepQuantity = (id: string, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextQuantidade = Math.max(0, item.quantidade + delta)
        const normalized = normalizeItemNumbers(nextQuantidade, item.precoUnitario, item.desconto)
        return {
          ...item,
          quantidade: normalized.quantidade,
          desconto: normalized.desconto,
          subtotal: normalized.subtotal,
        }
      })
    )
  }

  const handleRemoveDraftItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedPerson) {
      await Swal.fire({ icon: 'warning', title: 'Selecione cliente ou lead' })
      return
    }
    setLoading(true)
    try {
      let clienteId = selectedPerson.tipo === 'cliente' ? selectedPerson.id : null
      if (selectedPerson.tipo === 'prospecto') {
        const convRes = await fetch(`/api/prospectos/${selectedPerson.id}/converter`, { method: 'POST' })
        const convData = await convRes.json().catch(() => null)
        if (!convRes.ok) {
          if (convRes.status === 409 && convData?.clienteId) clienteId = convData.clienteId
          else throw new Error(convData?.error || 'Erro ao converter lead')
        } else {
          clienteId = convData?.cliente?.id || null
        }
      }
      if (!clienteId) throw new Error('Cliente nao identificado')

      const valorManual = form.valor
        ? parseFloat(form.valor.replace(/\./g, '').replace(',', '.'))
        : null

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo,
          descricao: form.descricao || null,
          valor: hasCartItems ? cartSummary.totalLiquido : valorManual,
          clienteId,
          statusEntrega: form.statusEntrega,
          pagamentoConfirmado: form.pagamentoConfirmado,
          formaPagamento: form.formaPagamento || null,
          dataEntrega: form.dataEntrega || null,
          observacoes: form.observacoes || null,
          itens: itens.map((item) => ({
            produtoServicoId: item.produtoServicoId || null,
            descricao: item.descricao,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            desconto: item.desconto,
          })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar pedido')
      await Swal.fire({
        icon: 'success',
        title: data?.numero ? `Pedido #${data.numero} criado` : 'Pedido criado',
      })
      onCreated()
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao criar pedido.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="h-full overflow-y-auto p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Pedido Direto</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <div className="flex items-start gap-2"><Info size={14} className="mt-0.5" />A venda sera concluida com entrega em <strong>Entregue</strong> e pagamento confirmado.</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Titulo do pedido</span>
              <input
                required
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: Renovacao plano anual"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Status de entrega</span>
              <select
                value={form.statusEntrega}
                onChange={(e) => setForm((p) => ({ ...p, statusEntrega: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {Object.entries(STATUS_ENTREGA_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <AsyncSelect
            label="Cliente / Lead"
            placeholder="Busque por nome, email ou empresa..."
            value={selectedPerson ? selectedPerson.id : ''}
            initialLabel={selectedPerson ? selectedPerson.nome : ''}
            onChange={(option) => {
              setSelectedPerson(option)
              setStatusInfo(option?.tipo === 'prospecto' ? 'Este lead sera convertido em cliente automaticamente.' : null)
            }}
            fetchUrl="/api/pessoas/busca"
            required
          />
          {statusInfo && <p className="text-xs text-blue-600 dark:text-blue-400">{statusInfo}</p>}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Descricao geral</span>
              <textarea
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Resumo curto do pedido"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Observacoes internas</span>
              <textarea
                rows={2}
                value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                placeholder="Notas para operacao"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Valor manual (sem carrinho)</span>
              <input
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                placeholder={hasCartItems ? 'Calculado pelo carrinho' : 'Ex: 1500,00'}
                disabled={hasCartItems}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:disabled:bg-gray-700"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Forma de pagamento</span>
              <input
                value={form.formaPagamento}
                onChange={(e) => setForm((p) => ({ ...p, formaPagamento: e.target.value }))}
                placeholder="Pix, boleto, cartao..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Data de entrega</span>
              <input
                type="date"
                value={form.dataEntrega}
                onChange={(e) => setForm((p) => ({ ...p, dataEntrega: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:scheme-dark"
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.pagamentoConfirmado}
              onChange={(e) => setForm((p) => ({ ...p, pagamentoConfirmado: e.target.checked }))}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600"
            />
            Pagamento confirmado
          </label>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
            <div className="space-y-3 rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <ShoppingCart size={14} />
                  Carrinho
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{itens.length} item(ns)</p>
              </div>
              {itens.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Adicione produtos ou servicos para montar o pedido.
                </p>
              )}
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {itens.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-2.5 dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                      <label className="md:col-span-4">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Item</span>
                        <input
                          value={item.descricao}
                          onChange={(e) => handleDraftItemField(item.id, 'descricao', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <div className="md:col-span-3">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Quantidade</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(item.id, -1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.quantidade}
                            onChange={(e) => handleDraftItemField(item.id, 'quantidade', e.target.value)}
                            className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(item.id, 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Unitario</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precoUnitario}
                          onChange={(e) => handleDraftItemField(item.id, 'precoUnitario', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.desconto}
                          onChange={(e) => handleDraftItemField(item.id, 'desconto', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <div className="md:col-span-1">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                        <p className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                          {currency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-dashed border-gray-300 p-2.5 dark:border-gray-700">
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <PackagePlus size={14} />
                  Adicionar item
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                  <label className="md:col-span-4">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Produto/Servico</span>
                    <AsyncSelect
                      className="min-w-0"
                      placeholder="Buscar produto/servico..."
                      value={itemForm.produtoServicoId || ''}
                      initialLabel={selectedProdutoLabel}
                      onChange={handleSelectProduto}
                      fetchUrl="/api/produtos-servicos/busca"
                    />
                  </label>
                  <label className="md:col-span-4">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Descricao</span>
                    <input
                      value={itemForm.descricao}
                      onChange={(e) => handleItemForm('descricao', e.target.value)}
                      placeholder="Nome exibido no pedido"
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                    />
                  </label>
                  <label className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Qtd</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={itemForm.quantidade}
                      onChange={(e) => handleItemForm('quantidade', e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                    />
                  </label>
                  <label className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Preco</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={itemForm.precoUnitario}
                      onChange={(e) => handleItemForm('precoUnitario', e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                    />
                  </label>
                  <label className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={itemForm.desconto}
                      onChange={(e) => handleItemForm('desconto', e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                    />
                  </label>
                  <div className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                    <p className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                      {currency(draftSubtotal)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDraftItem}
                    disabled={!itemForm.descricao.trim() || itemForm.quantidade <= 0}
                    className="md:col-span-12 inline-flex items-center justify-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-2 text-xs font-medium text-purple-700 shadow-xs hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
                  >
                    <Plus size={14} />
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Resumo</p>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Itens</span>
                <strong>{itens.length}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Quantidade total</span>
                <strong>{cartSummary.quantidadeTotal.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Subtotal bruto</span>
                <strong>{currency(cartSummary.totalBruto)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Descontos</span>
                <strong className="text-red-600 dark:text-red-400">-{currency(cartSummary.totalDesconto)}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold text-blue-700 dark:border-gray-700 dark:text-blue-300">
                <span>Total do pedido</span>
                <span>{currency(hasCartItems ? cartSummary.totalLiquido : toNumber(form.valor, 0))}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Quando ha itens no carrinho, o valor do pedido e calculado automaticamente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar Pedido'}</Button>
          </div>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
