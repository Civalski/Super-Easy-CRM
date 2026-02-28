'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
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
  Plus,
  Save,
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

const calculateSubtotal = (quantidade: number, precoUnitario: number, desconto: number) =>
  Math.max(0, quantidade * precoUnitario - desconto)

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

  const fetchPedidos = useCallback(async (targetPage: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/pedidos?paginated=true&page=${targetPage}&limit=${PEDIDOS_PAGE_SIZE}`)
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
  }, [])

  useEffect(() => {
    fetchPedidos(page)
  }, [fetchPedidos, page])

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
        if (field === 'quantidade') return { ...item, quantidade: numeric, subtotal: Math.max(0, numeric * item.precoUnitario - item.desconto) }
        if (field === 'precoUnitario') return { ...item, precoUnitario: numeric, subtotal: Math.max(0, item.quantidade * numeric - item.desconto) }
        if (field === 'desconto') return { ...item, desconto: numeric, subtotal: Math.max(0, item.quantidade * item.precoUnitario - numeric) }
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
      return { ...prev, [pedidoId]: { ...current, [field]: toNumber(value, 0) } }
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-2.5 shadow-lg shadow-blue-500/25">
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
              <input type="date" value={dateInput(pedido.dataEntrega)} onChange={(e) => handlePedidoField(pedido.id, 'dataEntrega', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:[color-scheme:dark]" />
              <div className="rounded-lg bg-gray-50 p-2 text-xs dark:bg-gray-800">
                <p>Bruto: {currency(pedido.totalBruto)}</p>
                <p>Desconto: {currency(pedido.totalDesconto)}</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">Liquido: {currency(pedido.totalLiquido)}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"><CalendarClock size={12} />{pedido.pagamentoConfirmado && pedido.statusEntrega === 'entregue' ? 'Venda confirmada' : 'Venda pendente'}</div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={pedido.pagamentoConfirmado} onChange={(e) => handlePedidoField(pedido.id, 'pagamentoConfirmado', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="crm-card mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Produtos do Pedido #{pedido.numero}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{pedido.oportunidade.titulo} - {pedido.oportunidade.cliente.nome}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} className="text-gray-500" /></button>
        </div>

        {loading && <div className="flex min-h-[120px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>}

        {!loading && (
          <div className="space-y-3">
            {itens.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Nenhum item adicionado ainda.
              </p>
            )}

            {itens.map((item) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 rounded-lg border border-gray-100 p-2 dark:border-gray-800 sm:grid-cols-2 lg:grid-cols-6">
                <input value={item.descricao} onChange={(e) => onItemField(item.id, 'descricao', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs sm:col-span-2 lg:col-span-2 dark:border-gray-600 dark:bg-gray-800" />
                <input type="number" min={0} step="0.01" value={item.quantidade} onChange={(e) => onItemField(item.id, 'quantidade', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                <input type="number" min={0} step="0.01" value={item.precoUnitario} onChange={(e) => onItemField(item.id, 'precoUnitario', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                <input type="number" min={0} step="0.01" value={item.desconto} onChange={(e) => onItemField(item.id, 'desconto', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{currency(item.subtotal)}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onSaveItem(item)} className="rounded border border-purple-300 dark:border-purple-600 shadow-sm px-2 py-1 text-[11px] text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800">Salvar</button>
                    <button type="button" onClick={() => onDeleteItem(item.id)} className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-600">Excluir</button>
                  </div>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 gap-2 rounded-lg border border-dashed border-gray-300 p-2 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-6">
              <AsyncSelect
                className="min-w-0 sm:col-span-2 lg:col-span-2"
                placeholder="Buscar produto/servico..."
                value={form.produtoServicoId || ''}
                initialLabel={produtoLabel}
                onChange={onSelectProduto}
                fetchUrl="/api/produtos-servicos/busca"
              />
              <input value={form.descricao} onChange={(e) => onFormField('descricao', e.target.value)} placeholder="Descrição" className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs sm:col-span-2 lg:col-span-2 dark:border-gray-600 dark:bg-gray-800" />
              <input type="number" min={0} step="0.01" value={form.quantidade} onChange={(e) => onFormField('quantidade', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
              <input type="number" min={0} step="0.01" value={form.precoUnitario} onChange={(e) => onFormField('precoUnitario', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
              <input type="number" min={0} step="0.01" value={form.desconto} onChange={(e) => onFormField('desconto', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
              <button type="button" onClick={onAddItem} disabled={saving} className="rounded-lg border border-purple-300 dark:border-purple-600 shadow-sm px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1">Adicionar</button>
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

  const totalCarrinho = useMemo(
    () => itens.reduce((sum, item) => sum + item.subtotal, 0),
    [itens]
  )

  const handleItemForm = (field: keyof ItemForm, value: string) => {
    setItemForm((prev) => {
      if (field === 'descricao' || field === 'produtoServicoId') {
        return { ...prev, [field]: value }
      }
      return { ...prev, [field]: toNumber(value, 0) }
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

    const subtotal = calculateSubtotal(
      itemForm.quantidade,
      itemForm.precoUnitario,
      itemForm.desconto
    )

    setItens((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        ...itemForm,
        subtotal,
      },
    ])
    setItemForm(buildItemForm())
    setSelectedProdutoLabel('')
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
          valor: itens.length > 0 ? totalCarrinho : valorManual,
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Titulo" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
          <AsyncSelect label="Cliente / Lead" placeholder="Busque por nome, email ou empresa..." value={selectedPerson ? selectedPerson.id : ''} initialLabel={selectedPerson ? selectedPerson.nome : ''} onChange={(option) => { setSelectedPerson(option); setStatusInfo(option?.tipo === 'prospecto' ? 'Este lead sera convertido em cliente automaticamente.' : null) }} fetchUrl="/api/pessoas/busca" required />
          {statusInfo && <p className="text-xs text-blue-600 dark:text-blue-400">{statusInfo}</p>}
          <textarea rows={2} value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Descricao" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} placeholder="Valor" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
            <select value={form.statusEntrega} onChange={(e) => setForm((p) => ({ ...p, statusEntrega: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">{Object.entries(STATUS_ENTREGA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input value={form.formaPagamento} onChange={(e) => setForm((p) => ({ ...p, formaPagamento: e.target.value }))} placeholder="Forma de pagamento" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
            <input type="date" value={form.dataEntrega} onChange={(e) => setForm((p) => ({ ...p, dataEntrega: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:[color-scheme:dark]" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={form.pagamentoConfirmado} onChange={(e) => setForm((p) => ({ ...p, pagamentoConfirmado: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600" />Pagamento confirmado</label>
          <textarea rows={2} value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} placeholder="Observacoes" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
          <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Carrinho de produtos</p>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Total: {currency(totalCarrinho)}
              </p>
            </div>
            {itens.length > 0 && (
              <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                {itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-gray-200 px-2 py-1 text-xs dark:border-gray-700">
                    <span className="truncate pr-2">{item.descricao}</span>
                    <div className="flex items-center gap-2">
                      <span>{currency(item.subtotal)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(item.id)}
                        className="rounded border border-red-300 px-2 py-0.5 text-red-600"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <AsyncSelect
                className="min-w-0 sm:col-span-2 lg:col-span-2"
                placeholder="Buscar produto/servico..."
                value={itemForm.produtoServicoId || ''}
                initialLabel={selectedProdutoLabel}
                onChange={handleSelectProduto}
                fetchUrl="/api/produtos-servicos/busca"
              />
              <input value={itemForm.descricao} onChange={(e) => handleItemForm('descricao', e.target.value)} placeholder="Descrição" className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs sm:col-span-2 lg:col-span-2 dark:border-gray-600 dark:bg-gray-800" />
              <input type="number" min={0} step="0.01" value={itemForm.quantidade} onChange={(e) => handleItemForm('quantidade', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
              <input type="number" min={0} step="0.01" value={itemForm.precoUnitario} onChange={(e) => handleItemForm('precoUnitario', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
              <input type="number" min={0} step="0.01" value={itemForm.desconto} onChange={(e) => handleItemForm('desconto', e.target.value)} className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
              <button type="button" onClick={handleAddDraftItem} className="rounded-lg border border-purple-300 dark:border-purple-600 shadow-sm px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 sm:col-span-2 lg:col-span-1">Adicionar</button>
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


