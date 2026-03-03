'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'
import { Button } from '@/components/common'
import { CheckCircle2, ClipboardList, Loader2, Plus, Truck, X } from 'lucide-react'

import { StatCard } from '@/components/features/pedidos/StatCard'
import { PedidosFilterBadges } from '@/components/features/pedidos/PedidosFilterBadges'
import { PedidosTabs } from '@/components/features/pedidos/PedidosTabs'
import { PedidosList } from '@/components/features/pedidos/PedidosList'
import { PedidosPagination } from '@/components/features/pedidos/PedidosPagination'
import { EditPedidoDrawer } from '@/components/features/pedidos/EditPedidoDrawer'
import { PedidoItemsModal } from '@/components/features/pedidos/PedidoItemsModal'
import { CreatePedidoDiretoModal } from '@/components/features/pedidos/CreatePedidoDiretoModal'
import { usePedidos } from '@/components/features/pedidos/hooks/usePedidos'
import { usePedidoItems } from '@/components/features/pedidos/hooks/usePedidoItems'
import type { Pedido, PedidoTab, QuickApproveChoice } from '@/components/features/pedidos/types'
import { QUICK_APPROVE_OPTIONS, STATUS_ENTREGA_LABEL } from '@/components/features/pedidos/constants'
import { buildItemForm, getPedidoSituacao } from '@/components/features/pedidos/utils'

function PedidosPageContent() {
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

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeItemsPedidoId, setActiveItemsPedidoId] = useState<string | null>(null)
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PedidoTab>('andamento')

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

  const handleQuickApprove = async (pedido: Pedido) => {
    if (getPedidoSituacao(pedido) !== 'pedido') return

    const initialChoice: QuickApproveChoice = pedido.pagamentoConfirmado
      ? pedido.statusEntrega === 'entregue'
        ? 'ambos'
        : 'entrega'
      : 'pagamento'

    const value = await new Promise<QuickApproveChoice | null>((resolve) => {
      let hasResolved = false
      const resolveOnce = (choice: QuickApproveChoice | null) => {
        if (hasResolved) return
        hasResolved = true
        resolve(choice)
      }

      const actionsHtml = (Object.entries(QUICK_APPROVE_OPTIONS) as Array<[QuickApproveChoice, string]>)
        .map(([choice, label]) => {
          const background =
            choice === 'pagamento' ? '#2563eb' : choice === 'entrega' ? '#0ea5e9' : '#16a34a'
          const ring = choice === initialChoice ? 'box-shadow:0 0 0 2px rgba(255,255,255,0.35);' : ''
          return `<button type="button" data-quick-approve="${choice}" class="swal2-styled" style="margin:0;background:${background};${ring}">${label}</button>`
        })
        .join('')

      void Swal.fire({
        icon: 'question',
        title: `Aprovar pedido #${pedido.numero}`,
        html: `
          <div style="text-align:left;font-size:12px;color:#6b7280;margin-bottom:10px">
            <div><strong>Status entrega:</strong> ${STATUS_ENTREGA_LABEL[pedido.statusEntrega] || 'Pendente'}</div>
            <div><strong>Pagamento:</strong> ${pedido.pagamentoConfirmado ? 'Confirmado' : 'Pendente'}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;text-align:left;margin-top:14px">
            ${actionsHtml}
          </div>
        `,
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: 'Cancelar',
        width: 520,
        reverseButtons: true,
        cancelButtonColor: '#6b7280',
        customClass: {
          popup: 'rounded-2xl',
          title: 'text-base font-semibold',
          cancelButton: 'rounded-lg px-4 py-2',
        },
        didOpen: () => {
          const popup = Swal.getPopup()
          if (!popup) return
          const buttons = popup.querySelectorAll<HTMLButtonElement>('[data-quick-approve]')
          buttons.forEach((button) => {
            button.addEventListener('click', () => {
              const selected = button.dataset.quickApprove as QuickApproveChoice | undefined
              resolveOnce(selected || null)
              void Swal.close()
            })
          })
        },
        willClose: () => resolveOnce(null),
      })
    })

    if (!value) return

    const nextPagamento = value === 'pagamento' || value === 'ambos' ? true : pedido.pagamentoConfirmado
    const nextStatusEntrega = value === 'entrega' || value === 'ambos' ? 'entregue' : pedido.statusEntrega

    if (nextPagamento === pedido.pagamentoConfirmado && nextStatusEntrega === pedido.statusEntrega) {
      await Swal.fire({ icon: 'info', title: 'Sem alteracoes', text: 'Este pedido ja esta com essa aprovacao.' })
      return
    }

    await handleSavePedidoOperacional(pedido.id, {
      statusEntrega: nextStatusEntrega,
      pagamentoConfirmado: nextPagamento,
    })
  }

  const clearListFilters = useCallback(() => {
    if (!searchParams.get('clienteId') && !searchParams.get('clienteNome') && !searchParams.get('statusEntrega')) return
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
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-1.5" />Novo Pedido
          </Button>
          <Link href="/oportunidades">
            <Button variant="outline">Ir para Orcamentos</Button>
          </Link>
        </div>
      </div>

      <PedidosFilterBadges
        clienteNomeFilter={clienteNomeFilter}
        statusEntregaFilter={statusEntregaFilter}
        hasClienteFilter={hasClienteFilter}
        hasStatusFilter={hasStatusFilter}
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

export default function PedidosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <PedidosPageContent />
    </Suspense>
  )
}
