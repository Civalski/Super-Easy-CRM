'use client'

import dynamic from 'next/dynamic'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import { Button } from '@/components/common'
import { CheckCircle2, ClipboardList, DollarSign, Filter, Loader2, Plus, Search, Truck, X } from '@/lib/icons'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'

import { StatCard } from '@/components/features/pedidos/StatCard'
import { PedidosFilters, type PedidosFiltersValues } from '@/components/features/pedidos/PedidosFilters'
import { STATUS_ENTREGA_LABEL } from '@/components/features/pedidos/constants'
import { PedidosTabs } from '@/components/features/pedidos/PedidosTabs'
import { PedidosList } from '@/components/features/pedidos/PedidosList'
import { PedidosPagination } from '@/components/features/pedidos/PedidosPagination'
import { usePedidos } from '@/components/features/pedidos/hooks/usePedidos'
import { usePedidoItems } from '@/components/features/pedidos/hooks/usePedidoItems'

const EditPedidoDrawer = dynamic(
  () => import('@/components/features/pedidos/EditPedidoDrawer').then((m) => ({ default: m.EditPedidoDrawer })),
  { ssr: false }
)
const PedidoItemsDrawer = dynamic(
  () => import('@/components/features/pedidos/PedidoItemsDrawer').then((m) => ({ default: m.PedidoItemsDrawer })),
  { ssr: false }
)
const CreatePedidoDiretoModal = dynamic(
  () => import('@/components/features/pedidos/CreatePedidoDiretoModal').then((m) => ({ default: m.CreatePedidoDiretoModal })),
  { ssr: false }
)
const QuickApproveModal = dynamic(
  () => import('@/components/features/pedidos/QuickApproveModal').then((m) => ({ default: m.QuickApproveModal })),
  { ssr: false }
)
const CancelarPedidoModal = dynamic(
  () => import('@/components/features/pedidos/CancelarPedidoModal').then((m) => ({ default: m.default })),
  { ssr: false }
)
import { formatCurrency } from '@/lib/format'
import { formatDateToLocalISO } from '@/lib/date'
import { getDownloadFileNameFromHeader } from '@/components/features/pedidos/utils'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'
import type { Pedido, PedidoTab, QuickApproveChoice } from '@/components/features/pedidos/types'
import { buildItemForm, getPedidoSituacao } from '@/components/features/pedidos/utils'

function PedidosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const minimal = usePageHeaderMinimal()
  const clienteIdFilter = searchParams.get('clienteId')?.trim() || ''
  const clienteNomeFilter = searchParams.get('clienteNome') || 'Cliente selecionado'
  const abaParam = searchParams.get('aba')?.trim() || ''
  const activeTabFromUrl: PedidoTab = abaParam === 'vendas' || abaParam === 'cancelados' ? abaParam : 'andamento'
  const statusEntregaFilter = searchParams.get('statusEntrega')?.trim() || ''
  const searchFilter = searchParams.get('search')?.trim() || ''
  const formaPagamentoFilter = searchParams.get('formaPagamento')?.trim() || ''
  const periodoFilter = searchParams.get('periodo')?.trim() || ''
  const dataInicioFilter = searchParams.get('dataInicio')?.trim() || ''
  const dataFimFilter = searchParams.get('dataFim')?.trim() || ''
  const hasClienteFilter = clienteIdFilter.length > 0
  const hasStatusFilter = statusEntregaFilter.length > 0
  const hasSearchFilter = searchFilter.length > 0
  const hasFiltersFilter =
    formaPagamentoFilter ||
    periodoFilter ||
    statusEntregaFilter ||
    (activeTabFromUrl !== 'andamento' && (dataInicioFilter || dataFimFilter))
  const queryFilterParts: string[] = []
  if (hasClienteFilter) queryFilterParts.push(`clienteId=${encodeURIComponent(clienteIdFilter)}`)
  if (hasStatusFilter) queryFilterParts.push(`statusEntrega=${encodeURIComponent(statusEntregaFilter)}`)
  if (hasSearchFilter) queryFilterParts.push(`search=${encodeURIComponent(searchFilter)}`)
  if (formaPagamentoFilter) queryFilterParts.push(`formaPagamento=${encodeURIComponent(formaPagamentoFilter)}`)
  if (activeTabFromUrl === 'vendas' || activeTabFromUrl === 'cancelados') {
    queryFilterParts.push(`aba=${activeTabFromUrl}`)
    let di = dataInicioFilter
    let df = dataFimFilter
    if (!di || !df) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      di = di || formatDateToLocalISO(firstDay)
      df = df || formatDateToLocalISO(lastDay)
    }
    queryFilterParts.push(`dataInicio=${di}`)
    queryFilterParts.push(`dataFim=${df}`)
  } else if (periodoFilter) {
    const days = parseInt(periodoFilter, 10)
    if (!Number.isNaN(days) && days > 0) {
      const dataFim = new Date()
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - days)
      dataInicio.setHours(0, 0, 0, 0)
      queryFilterParts.push(`dataInicio=${formatDateToLocalISO(dataInicio)}`)
      queryFilterParts.push(`dataFim=${formatDateToLocalISO(dataFim)}`)
    }
  }
  const queryFilter = queryFilterParts.join('&')

  const [searchInput, setSearchInput] = useState(searchFilter)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchInput(searchFilter)
  }, [searchFilter])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = setTimeout(() => {
        searchDebounceRef.current = null
        const params = new URLSearchParams(searchParams.toString())
        if (value.trim()) {
          params.set('search', value.trim())
        } else {
          params.delete('search')
        }
        const nextQuery = params.toString()
        router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
      }, 400)
    },
    [router, searchParams]
  )

  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
  }, [])

  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [prefillPerson, setPrefillPerson] = useState<AsyncSelectOption | null>(null)
  const [quickApprovePedido, setQuickApprovePedido] = useState<Pedido | null>(null)
  const [cancelPedidoToConfirm, setCancelPedidoToConfirm] = useState<Pedido | null>(null)
  const [activeItemsPedidoId, setActiveItemsPedidoId] = useState<string | null>(null)
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null)
  const [viewingPedidoId, setViewingPedidoId] = useState<string | null>(null)
  const [downloadingPdfById, setDownloadingPdfById] = useState<Record<string, boolean>>({})

  const handleTabChange = useCallback(
    (tab: PedidoTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'andamento') {
        params.delete('aba')
        params.delete('dataInicio')
        params.delete('dataFim')
      } else {
        params.set('aba', tab)
        if (!params.get('dataInicio') || !params.get('dataFim')) {
          const now = new Date()
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          params.set('dataInicio', formatDateToLocalISO(firstDay))
          params.set('dataFim', formatDateToLocalISO(lastDay))
        }
      }
      const nextQuery = params.toString()
      router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
    },
    [router, searchParams]
  )

  useEffect(() => {
    const aba = searchParams.get('aba')
    if ((aba === 'vendas' || aba === 'cancelados') && !searchParams.get('dataInicio')) {
      const params = new URLSearchParams(searchParams.toString())
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      params.set('dataInicio', formatDateToLocalISO(firstDay))
      params.set('dataFim', formatDateToLocalISO(lastDay))
      router.replace(`/pedidos?${params.toString()}`)
      return
    }
  }, [searchParams, router])

  useEffect(() => {
    const shouldOpen = searchParams.get('novoPedido') === '1'
    const clienteId = searchParams.get('clienteId')
    if (!shouldOpen || !clienteId) return
    const clienteNome = searchParams.get('clienteNome') || 'Cliente selecionado'
    setPrefillPerson({ id: clienteId, nome: clienteNome, tipo: 'cliente' })
    setShowCreateModal(true)
  }, [searchParams])

  const {
    loading,
    page,
    setPage,
    meta,
    pedidos,
    savingById,
    stats,
    pedidosByStatus,
    fetchPedidos,
    updatePedidoTotals,
    handleSavePedidoOperacional,
    handleSavePedidoComercial,
    handleCancelarPedido,
  } = usePedidos({ queryFilter })

  const {
    itemsLoaded,
    itemsLoading,
    itemsSaving,
    itemsByPedido,
    itemFormByPedido,
    produtoLabelByPedido,
    handleItemField,
    handleSaveItem,
    handleDeleteItem,
    handleItemForm,
    handleSelectProduto,
    handleAddItem,
    loadItems,
  } = usePedidoItems({ updatePedidoTotals })

  useEffect(() => {
    if (editingPedidoId && !itemsLoaded[editingPedidoId]) void loadItems(editingPedidoId)
  }, [editingPedidoId, itemsLoaded, loadItems])
  useEffect(() => {
    if (viewingPedidoId && !itemsLoaded[viewingPedidoId]) void loadItems(viewingPedidoId)
  }, [viewingPedidoId, itemsLoaded, loadItems])

  const activePedidos = useMemo(() => {
    if (activeTabFromUrl === 'vendas') return pedidosByStatus.vendas
    if (activeTabFromUrl === 'cancelados') return pedidosByStatus.cancelados
    return pedidosByStatus.andamento
  }, [activeTabFromUrl, pedidosByStatus])

  const activePedido = useMemo(
    () => pedidos.find((p) => p.id === activeItemsPedidoId) || null,
    [activeItemsPedidoId, pedidos]
  )
  const editingPedido = useMemo(
    () => pedidos.find((p) => p.id === editingPedidoId) || null,
    [editingPedidoId, pedidos]
  )
  const viewingPedido = useMemo(
    () => pedidos.find((p) => p.id === viewingPedidoId) || null,
    [viewingPedidoId, pedidos]
  )

  const handleOpenItemsModal = async (pedidoId: string) => {
    setActiveItemsPedidoId(pedidoId)
    if (!itemsLoaded[pedidoId]) await loadItems(pedidoId)
  }

  const handleDownloadPedidoPdf = async (pedido: Pedido) => {
    try {
      setDownloadingPdfById((prev) => ({ ...prev, [pedido.id]: true }))
      const response = await fetch(`/api/pedidos/${pedido.id}/pdf`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Nao foi possivel gerar o PDF do pedido.')
      }
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = getDownloadFileNameFromHeader(response.headers.get('Content-Disposition')) || 'Pedido.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error: unknown) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Nao foi possivel baixar o PDF do pedido.' })
    } finally {
      setDownloadingPdfById((prev) => ({ ...prev, [pedido.id]: false }))
    }
  }

  const handleQuickApprove = (pedido: Pedido) => {
    if (getPedidoSituacao(pedido) !== 'pedido') return
    setQuickApprovePedido(pedido)
  }

  const handleQuickApproveConfirm = async (value: QuickApproveChoice) => {
    const pedido = quickApprovePedido
    setQuickApprovePedido(null)
    if (!pedido) return

    const nextPagamento = value === 'pagamento' || value === 'ambos' ? true : pedido.pagamentoConfirmado
    const nextStatusEntrega = value === 'entrega' || value === 'ambos' ? 'entregue' : pedido.statusEntrega

    if (nextPagamento === pedido.pagamentoConfirmado && nextStatusEntrega === pedido.statusEntrega) {
      toast.info('Sem alteracoes', { description: 'Este pedido ja esta com essa aprovacao.' })
      return
    }

    await handleSavePedidoOperacional(pedido.id, {
      statusEntrega: nextStatusEntrega,
      pagamentoConfirmado: nextPagamento,
    })
  }

  const clearClienteFilter = useCallback(() => {
    if (!searchParams.get('clienteId') && !searchParams.get('clienteNome')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('clienteId')
    params.delete('clienteNome')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
  }, [router, searchParams])

  const clearSearchFilter = useCallback(() => {
    if (!searchParams.get('search')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
    setSearchInput('')
  }, [router, searchParams])

  const clearFiltersFilter = useCallback(() => {
    const hasAny =
      statusEntregaFilter ||
      formaPagamentoFilter ||
      periodoFilter ||
      (activeTabFromUrl !== 'andamento' && (dataInicioFilter || dataFimFilter))
    if (!hasAny) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('statusEntrega')
    params.delete('formaPagamento')
    params.delete('periodo')
    if (activeTabFromUrl === 'vendas' || activeTabFromUrl === 'cancelados') {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      params.set('dataInicio', formatDateToLocalISO(firstDay))
      params.set('dataFim', formatDateToLocalISO(lastDay))
    } else {
      params.delete('dataInicio')
      params.delete('dataFim')
    }
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
  }, [
    router,
    searchParams,
    statusEntregaFilter,
    formaPagamentoFilter,
    periodoFilter,
    activeTabFromUrl,
    dataInicioFilter,
    dataFimFilter,
  ])

  const handleFiltersChange = useCallback(
    (values: PedidosFiltersValues) => {
      const params = new URLSearchParams(searchParams.toString())
      if (values.statusEntrega) params.set('statusEntrega', values.statusEntrega)
      else params.delete('statusEntrega')
      if (values.formaPagamento) params.set('formaPagamento', values.formaPagamento)
      else params.delete('formaPagamento')
      if (values.periodo) params.set('periodo', values.periodo)
      else params.delete('periodo')
      if (values.dataInicio) params.set('dataInicio', values.dataInicio)
      else params.delete('dataInicio')
      if (values.dataFim) params.set('dataFim', values.dataFim)
      else params.delete('dataFim')
      const nextQuery = params.toString()
      router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
    },
    [router, searchParams]
  )

  const clearPedidoPrefillParams = useCallback(() => {
    if (!searchParams.get('novoPedido') && !searchParams.get('clienteId') && !searchParams.get('clienteNome')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('novoPedido')
    params.delete('clienteId')
    params.delete('clienteNome')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
  }, [router, searchParams])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!minimal && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 p-2.5 shadow-lg shadow-blue-500/25">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Entregas, pagamentos e itens</p>
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2 ${minimal ? 'sm:ml-auto' : ''}`}>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-1.5" />Novo Pedido
          </Button>
          <Link href="/oportunidades">
            <Button variant="outline">Ir para Orcamentos</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex flex-1 max-w-[400px] items-center gap-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número ou nome do cliente"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-10 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
          <div className="absolute right-2 flex items-center">
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`rounded p-1.5 transition-colors ${
                hasFiltersFilter
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              }`}
              title="Filtrar pedidos"
              aria-label="Filtrar pedidos"
            >
              <Filter size={18} />
            </button>
          </div>
          <div className="absolute right-2 top-full">
            <PedidosFilters
              open={filtersOpen}
              anchorRef={filterButtonRef}
              activeTab={activeTabFromUrl}
              values={{
                statusEntrega: statusEntregaFilter,
                formaPagamento: formaPagamentoFilter,
                periodo: periodoFilter,
                dataInicio: dataInicioFilter,
                dataFim: dataFimFilter,
              }}
              onClose={() => setFiltersOpen(false)}
              onChange={handleFiltersChange}
              onClear={clearFiltersFilter}
            />
          </div>
        </div>
      </div>

      {hasClienteFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            Cliente: {clienteNomeFilter}
          </span>
          <Button size="sm" variant="outline" onClick={clearClienteFilter}>
            Limpar filtro cliente
          </Button>
        </div>
      )}

      {(hasSearchFilter || hasFiltersFilter) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {hasSearchFilter && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200">
              Busca: {searchFilter}
            </span>
          )}
          {statusEntregaFilter && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Status: {STATUS_ENTREGA_LABEL[statusEntregaFilter] || statusEntregaFilter}
            </span>
          )}
          {formaPagamentoFilter && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              Pagamento: {formaPagamentoFilter.charAt(0).toUpperCase() + formaPagamentoFilter.slice(1)}
            </span>
          )}
          {periodoFilter && (
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
              Período: últimos {periodoFilter} dias
            </span>
          )}
          {activeTabFromUrl !== 'andamento' && dataInicioFilter && (
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
              Mês: {new Date(dataInicioFilter + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          )}
          {hasSearchFilter && (
            <Button size="sm" variant="outline" onClick={clearSearchFilter}>
              Limpar busca
            </Button>
          )}
          {hasFiltersFilter && (
            <Button size="sm" variant="outline" onClick={clearFiltersFilter}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<ClipboardList size={16} />} title="Total de Pedidos" value={String(stats.total)} />
        <StatCard icon={<DollarSign size={16} />} title="Valor Total" value={formatCurrency(stats.valorTotal)} />
        <StatCard icon={<Truck size={16} />} title="Em Andamento" value={String(stats.emAndamento)} />
        <StatCard icon={<CheckCircle2 size={16} />} title="Vendas" value={String(stats.vendas)} />
        <StatCard icon={<X size={16} />} title="Cancelados" value={String(stats.cancelados)} />
      </div>

      <PedidosTabs activeTab={activeTabFromUrl} stats={stats} onTabChange={handleTabChange} />

      {loading && (
        <div className="flex min-h-[220px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && (
        <PedidosList
          activeTab={activeTabFromUrl}
          pedidos={activePedidos}
          savingById={savingById}
          downloadingPdfById={downloadingPdfById}
          onQuickApprove={(pedido) => void handleQuickApprove(pedido)}
          onOpenItems={(id) => void handleOpenItemsModal(id)}
          onView={(id) => { setViewingPedidoId(id); setEditingPedidoId(null) }}
          onEdit={(id) => { setEditingPedidoId(id); setViewingPedidoId(null) }}
          onDownloadPdf={(pedido) => void handleDownloadPedidoPdf(pedido)}
          onCancelPedido={(pedido) => setCancelPedidoToConfirm(pedido)}
          onShowCreateModal={activeTabFromUrl === 'andamento' ? () => setShowCreateModal(true) : undefined}
        />
      )}

      {!loading && (
        <PedidosPagination
          meta={meta}
          onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(meta.pages, prev + 1))}
        />
      )}

      {activePedido && (
        <PedidoItemsDrawer
          pedido={activePedido}
          itens={itemsByPedido[activePedido.id] || []}
          form={itemFormByPedido[activePedido.id] || buildItemForm()}
          produtoLabel={produtoLabelByPedido[activePedido.id] || ''}
          loading={Boolean(itemsLoading[activePedido.id])}
          saving={Boolean(itemsSaving[activePedido.id])}
          onClose={() => setActiveItemsPedidoId(null)}
          onItemField={(itemId, field, value) => handleItemField(activePedido.id, itemId, field, value)}
          onSaveItem={(item) => void handleSaveItem(activePedido.id, item)}
          onDeleteItem={(itemId) => void handleDeleteItem(activePedido.id, itemId)}
          onFormField={(field, value) => handleItemForm(activePedido.id, field, value)}
          onSelectProduto={(option) => handleSelectProduto(activePedido.id, option)}
          onAddItem={() => void handleAddItem(activePedido.id)}
        />
      )}


      {editingPedido && (
        <EditPedidoDrawer
          pedido={editingPedido}
          readOnly={false}
          saving={Boolean(savingById[editingPedido.id])}
          itemsCount={itemsByPedido[editingPedido.id]?.length ?? 0}
          onClose={() => setEditingPedidoId(null)}
          onSave={(values) => void handleSavePedidoComercial(editingPedido.id, values).then((ok) => {
            if (ok) setEditingPedidoId(null)
          })}
          onCancelPedido={() => setCancelPedidoToConfirm(editingPedido)}
          onOpenAdicionarProduto={() => void handleOpenItemsModal(editingPedido.id)}
        />
      )}

      {viewingPedido && (
        <EditPedidoDrawer
          pedido={viewingPedido}
          readOnly
          saving={false}
          itemsCount={itemsByPedido[viewingPedido.id]?.length ?? 0}
          onClose={() => setViewingPedidoId(null)}
          onSave={() => {}}
          onCancelPedido={() => {}}
          onOpenAdicionarProduto={undefined}
        />
      )}

      {cancelPedidoToConfirm && (
        <CancelarPedidoModal
          open
          loading={Boolean(savingById[cancelPedidoToConfirm.id])}
          onConfirm={async (motivo) => {
            const success = await handleCancelarPedido(cancelPedidoToConfirm, motivo)
            if (success) {
              setCancelPedidoToConfirm(null)
              setEditingPedidoId(null)
            }
          }}
          onCancel={() => setCancelPedidoToConfirm(null)}
        />
      )}

      {quickApprovePedido && (
        <QuickApproveModal
          pedido={quickApprovePedido}
          initialChoice={
            quickApprovePedido.pagamentoConfirmado
              ? quickApprovePedido.statusEntrega === 'entregue'
                ? 'ambos'
                : 'entrega'
              : 'pagamento'
          }
          onConfirm={(choice) => void handleQuickApproveConfirm(choice)}
          onCancel={() => setQuickApprovePedido(null)}
        />
      )}

      {showCreateModal && (
        <CreatePedidoDiretoModal
          initialPerson={prefillPerson}
          onClose={() => {
            clearPedidoPrefillParams()
            setPrefillPerson(null)
            setShowCreateModal(false)
          }}
          onCreated={() => {
            clearPedidoPrefillParams()
            setPrefillPerson(null)
            setShowCreateModal(false)
            setPage(1)
            void fetchPedidos(1)
          }}
        />
      )}
    </div>
  )
}

export default function PedidosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <PedidosPageContent />
    </Suspense>
  )
}
