'use client'

import dynamic from 'next/dynamic'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import { Button } from '@/components/common'
import { CheckCircle2, ClipboardList, Loader2, Plus, Search, Truck, X } from '@/lib/icons'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'

import { StatCard } from '@/components/features/pedidos/StatCard'
import { PedidosFilterBadges } from '@/components/features/pedidos/PedidosFilterBadges'
import { PedidosTabs } from '@/components/features/pedidos/PedidosTabs'
import { PedidosList } from '@/components/features/pedidos/PedidosList'
import { PedidosPagination } from '@/components/features/pedidos/PedidosPagination'
import { usePedidos } from '@/components/features/pedidos/hooks/usePedidos'
import { usePedidoItems } from '@/components/features/pedidos/hooks/usePedidoItems'

const EditPedidoDrawer = dynamic(
  () => import('@/components/features/pedidos/EditPedidoDrawer').then((m) => ({ default: m.EditPedidoDrawer })),
  { ssr: false }
)
const PedidoItemsModal = dynamic(
  () => import('@/components/features/pedidos/PedidoItemsModal').then((m) => ({ default: m.PedidoItemsModal })),
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
import type { Pedido, PedidoTab, QuickApproveChoice } from '@/components/features/pedidos/types'
import { buildItemForm, getPedidoSituacao } from '@/components/features/pedidos/utils'

function PedidosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdFilter = searchParams.get('clienteId')?.trim() || ''
  const clienteNomeFilter = searchParams.get('clienteNome') || 'Cliente selecionado'
  const statusEntregaFilter = searchParams.get('statusEntrega')?.trim() || ''
  const searchFilter = searchParams.get('search')?.trim() || ''
  const hasClienteFilter = clienteIdFilter.length > 0
  const hasStatusFilter = statusEntregaFilter.length > 0
  const hasSearchFilter = searchFilter.length > 0
  const queryFilter = [
    hasClienteFilter ? `clienteId=${encodeURIComponent(clienteIdFilter)}` : null,
    hasStatusFilter ? `statusEntrega=${encodeURIComponent(statusEntregaFilter)}` : null,
    hasSearchFilter ? `search=${encodeURIComponent(searchFilter)}` : null,
  ]
    .filter(Boolean)
    .join('&')

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

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [prefillPerson, setPrefillPerson] = useState<AsyncSelectOption | null>(null)
  const [quickApprovePedido, setQuickApprovePedido] = useState<Pedido | null>(null)
  const [activeItemsPedidoId, setActiveItemsPedidoId] = useState<string | null>(null)
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PedidoTab>('andamento')

  useEffect(() => {
    const aba = searchParams.get('aba')
    if (aba === 'vendas' || aba === 'cancelados' || aba === 'andamento') {
      setActiveTab(aba)
    }
  }, [searchParams])

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

  const activePedidos = useMemo(() => {
    if (activeTab === 'vendas') return pedidosByStatus.vendas
    if (activeTab === 'cancelados') return pedidosByStatus.cancelados
    return pedidosByStatus.andamento
  }, [activeTab, pedidosByStatus])

  const activePedido = useMemo(
    () => pedidos.find((p) => p.id === activeItemsPedidoId) || null,
    [activeItemsPedidoId, pedidos]
  )
  const editingPedido = useMemo(
    () => pedidos.find((p) => p.id === editingPedidoId) || null,
    [editingPedidoId, pedidos]
  )

  const handleOpenItemsModal = async (pedidoId: string) => {
    setActiveItemsPedidoId(pedidoId)
    if (!itemsLoaded[pedidoId]) await loadItems(pedidoId)
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

  const clearListFilters = useCallback(() => {
    if (!searchParams.get('clienteId') && !searchParams.get('clienteNome') && !searchParams.get('statusEntrega') && !searchParams.get('search')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('clienteId')
    params.delete('clienteNome')
    params.delete('statusEntrega')
    params.delete('search')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/pedidos?${nextQuery}` : '/pedidos')
    setSearchInput('')
  }, [router, searchParams])

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
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-1.5" />Novo Pedido
          </Button>
          <Link href="/oportunidades">
            <Button variant="outline">Ir para Orcamentos</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número ou nome do cliente"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
      </div>

      <PedidosFilterBadges
        clienteNomeFilter={clienteNomeFilter}
        statusEntregaFilter={statusEntregaFilter}
        searchFilter={searchFilter}
        hasClienteFilter={hasClienteFilter}
        hasStatusFilter={hasStatusFilter}
        hasSearchFilter={hasSearchFilter}
        onClearFilters={clearListFilters}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ClipboardList size={16} />} title="Total de Pedidos" value={String(stats.total)} />
        <StatCard icon={<Truck size={16} />} title="Em Andamento" value={String(stats.emAndamento)} />
        <StatCard icon={<CheckCircle2 size={16} />} title="Vendas" value={String(stats.vendas)} />
        <StatCard icon={<X size={16} />} title="Cancelados" value={String(stats.cancelados)} />
      </div>

      <PedidosTabs activeTab={activeTab} stats={stats} onTabChange={setActiveTab} />

      {loading && (
        <div className="flex min-h-[220px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && (
        <PedidosList
          activeTab={activeTab}
          pedidos={activePedidos}
          savingById={savingById}
          onQuickApprove={(pedido) => void handleQuickApprove(pedido)}
          onOpenItems={(id) => void handleOpenItemsModal(id)}
          onEdit={(id) => setEditingPedidoId(id)}
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
        <PedidoItemsModal
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
          saving={Boolean(savingById[editingPedido.id])}
          onClose={() => setEditingPedidoId(null)}
          onSave={(values) => void handleSavePedidoComercial(editingPedido.id, values).then((ok) => {
            if (ok) setEditingPedidoId(null)
          })}
          onCancelPedido={async () => {
            const success = await handleCancelarPedido(editingPedido)
            if (success) setEditingPedidoId(null)
          }}
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
