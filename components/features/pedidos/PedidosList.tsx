'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  MoreVertical,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
  Truck,
  X,
} from '@/lib/icons'
import { Button } from '@/components/common'
import { formatCurrency, formatDate } from '@/lib/format'
import { clampFixedMenuPosition } from '@/lib/ui/clampFixedMenuPosition'
import type { Pedido, PedidoTab } from './types'
import { SITUACAO_PEDIDO_BADGE, SITUACAO_PEDIDO_LABEL, STATUS_ENTREGA_LABEL } from './constants'
import { getPedidoSituacao } from './utils'

interface PedidosListProps {
  activeTab: PedidoTab
  pedidos: Pedido[]
  savingById: Record<string, boolean>
  downloadingPdfById?: Record<string, boolean>
  onQuickApprove: (pedido: Pedido) => void
  onOpenItems: (pedidoId: string) => void
  onView: (pedidoId: string) => void
  onEdit: (pedidoId: string) => void
  onDownloadPdf?: (pedido: Pedido) => void
  onCancelPedido?: (pedido: Pedido) => void
  onShowCreateModal?: () => void
}

const TAB_LABELS: Record<PedidoTab, { title: string; empty: string; emptySub: string }> = {
  andamento: {
    title: 'Pedidos em andamento',
    empty: 'Nenhum pedido em andamento',
    emptySub: 'Crie um novo pedido ou ajuste os filtros',
  },
  vendas: {
    title: 'Vendas concluidas',
    empty: 'Nenhuma venda concluida',
    emptySub: 'A lista sera atualizada automaticamente quando houver pedidos neste status',
  },
  cancelados: {
    title: 'Pedidos cancelados',
    empty: 'Nenhum pedido cancelado',
    emptySub: 'A lista sera atualizada automaticamente quando houver pedidos neste status',
  },
}

const TAB_ICON: Record<PedidoTab, React.ReactNode> = {
  andamento: <Truck className="text-blue-600 dark:text-blue-400" size={18} />,
  vendas: <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />,
  cancelados: <X className="text-red-600 dark:text-red-400" size={18} />,
}

const TAB_COUNT_CLASS: Record<PedidoTab, string> = {
  andamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  vendas: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelados: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const GRID_COLS =
  'min-w-[980px] grid-cols-[minmax(48px,60px)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(80px,100px)_minmax(0,1fr)_minmax(52px,68px)_minmax(88px,110px)_minmax(70px,90px)_32px]'

const PED_MENU_WIDTH = 192
const PED_MENU_HEIGHT_EST = 320

export function PedidosList({
  activeTab,
  pedidos,
  savingById,
  downloadingPdfById = {},
  onQuickApprove,
  onOpenItems,
  onView,
  onEdit,
  onDownloadPdf,
  onCancelPedido,
  onShowCreateModal,
}: PedidosListProps) {
  const labels = TAB_LABELS[activeTab]
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!openMenuId || typeof document === 'undefined') return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      const btn = document.querySelector(`[data-ped-menu-btn="${openMenuId}"]`)
      if (btn?.contains(target)) return
      const menuEl = document.getElementById(`ped-menu-${openMenuId}`)
      if (menuEl?.contains(target)) return
      setOpenMenuId(null)
    }

    const updatePosition = () => {
      const desktop = window.matchMedia('(min-width: 1024px)').matches
      const scope = desktop
        ? document.querySelector('.ped-list-desktop-scope')
        : document.querySelector('.ped-list-mobile-scope')
      const btn = scope?.querySelector(`[data-ped-menu-btn="${openMenuId}"]`) as HTMLElement | undefined
      if (btn) {
        const rect = btn.getBoundingClientRect()
        setMenuPosition(clampFixedMenuPosition(rect, PED_MENU_WIDTH, PED_MENU_HEIGHT_EST, true))
      }
    }

    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [openMenuId])

  const openPedido = openMenuId ? pedidos.find((p) => p.id === openMenuId) : null

  if (activeTab === 'andamento' && pedidos.length === 0 && onShowCreateModal) {
    return (
      <section className="crm-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {TAB_ICON[activeTab]}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{labels.title}</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{labels.empty}</p>
          <Button onClick={onShowCreateModal}>
            <Plus size={16} className="mr-1.5" />
            Novo Pedido
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="crm-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {TAB_ICON[activeTab]}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{labels.title}</h2>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${TAB_COUNT_CLASS[activeTab]}`}>
          {pedidos.length}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{labels.empty}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{labels.emptySub}</p>
        </div>
      ) : (
        <>
          <div className="ped-list-mobile-scope divide-y divide-gray-100 dark:divide-gray-700 lg:hidden">
            {pedidos.map((pedido) => (
              <PedidoMobileCard
                key={pedido.id}
                pedido={pedido}
                activeTab={activeTab}
                openMenuId={openMenuId}
                onMenuToggle={setOpenMenuId}
              />
            ))}
          </div>

          <div className="ped-list-desktop-scope hidden lg:block">
            <div className="divide-y divide-gray-100 overflow-x-auto dark:divide-gray-700">
              <div
                className={`crm-table-head grid ${GRID_COLS} gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300`}
              >
                <div className="text-right">Nº</div>
                <div className="min-w-0">Cliente</div>
                <div className="min-w-0">Título</div>
                <div className="text-right">
                  {activeTab === 'andamento' ? 'Criada' : activeTab === 'vendas' ? 'Entrega' : 'Cancelado em'}
                </div>
                <div className="min-w-0">
                  {activeTab === 'andamento' ? 'Status' : activeTab === 'cancelados' ? 'Motivo' : '-'}
                </div>
                <div className="text-right">Forma pgto</div>
                <div className="text-right">Valor</div>
                <div className="text-right">{activeTab === 'andamento' ? 'Pgto/Entr.' : '-'}</div>
                <div />
              </div>
              {pedidos.map((pedido) => (
                <PedidoRow
                  key={pedido.id}
                  pedido={pedido}
                  activeTab={activeTab}
                  saving={Boolean(savingById[pedido.id])}
                  onQuickApprove={onQuickApprove}
                  onOpenItems={onOpenItems}
                  onEdit={onEdit}
                  openMenuId={openMenuId}
                  onMenuToggle={setOpenMenuId}
                />
              ))}
            </div>
          </div>

          {openPedido && menuPosition && typeof document !== 'undefined' && createPortal(
            <PedidoMenuDropdown
              pedido={openPedido}
              activeTab={activeTab}
              position={menuPosition}
              saving={Boolean(savingById[openPedido.id])}
              downloadingPdf={Boolean(downloadingPdfById[openPedido.id])}
              onClose={() => setOpenMenuId(null)}
              onView={(id) => {
                setOpenMenuId(null)
                onView(id)
              }}
              onEdit={(id) => {
                setOpenMenuId(null)
                onEdit(id)
              }}
              onOpenItems={(id) => {
                setOpenMenuId(null)
                onOpenItems(id)
              }}
              onDownloadPdf={onDownloadPdf}
              onQuickApprove={onQuickApprove}
              onCancelPedido={onCancelPedido}
            />,
            document.body
          )}
        </>
      )}
    </section>
  )
}

function PedidoMobileCard({
  pedido,
  activeTab,
  openMenuId,
  onMenuToggle,
}: {
  pedido: Pedido
  activeTab: PedidoTab
  openMenuId: string | null
  onMenuToggle: (id: string | null) => void
}) {
  const dataCol =
    activeTab === 'andamento'
      ? pedido.createdAt || pedido.oportunidade.createdAt
      : activeTab === 'vendas'
        ? pedido.dataEntrega || pedido.dataAprovacao
        : pedido.oportunidade.updatedAt || pedido.oportunidade.createdAt
  const extraCol =
    activeTab === 'andamento'
      ? STATUS_ENTREGA_LABEL[pedido.statusEntrega] || pedido.statusEntrega
      : activeTab === 'cancelados'
        ? pedido.oportunidade.motivoPerda || '-'
        : '-'

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Pedido #{pedido.numero}</div>
          <div className="truncate text-base font-semibold text-gray-900 dark:text-white" title={pedido.oportunidade.cliente.nome}>
            {pedido.oportunidade.cliente.nome}
          </div>
          <div className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400" title={pedido.oportunidade.titulo || undefined}>
            {pedido.oportunidade.titulo || '-'}
          </div>
        </div>
        <button
          type="button"
          data-ped-menu-btn={pedido.id}
          onClick={() => onMenuToggle(openMenuId === pedido.id ? null : pedido.id)}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          title="Ações"
          aria-label="Ações"
        >
          <MoreVertical size={18} />
        </button>
      </div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(pedido.totalLiquido)}</span>
        <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
        <span>{dataCol ? formatDate(dataCol) : '-'}</span>
      </div>
      {pedido.formaPagamento ? (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pagamento: {pedido.formaPagamento}</div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {typeof extraCol === 'string' && extraCol !== '-' ? (
          <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {extraCol}
          </span>
        ) : null}
        {activeTab === 'andamento' ? (
          <>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {STATUS_ENTREGA_LABEL[pedido.statusEntrega] || pedido.statusEntrega}
            </span>
            {pedido.pagamentoConfirmado ? (
              <span className="text-green-500" title="Pagamento confirmado">
                <CheckCircle2 size={14} />
              </span>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

function PedidoMenuDropdown({
  pedido,
  activeTab,
  position,
  saving,
  downloadingPdf,
  onClose,
  onView,
  onEdit,
  onOpenItems,
  onDownloadPdf,
  onQuickApprove,
  onCancelPedido,
}: {
  pedido: Pedido
  activeTab: PedidoTab
  position: { top: number; left: number }
  saving: boolean
  downloadingPdf: boolean
  onClose: () => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  onOpenItems: (id: string) => void
  onDownloadPdf?: (pedido: Pedido) => void
  onQuickApprove: (pedido: Pedido) => void
  onCancelPedido?: (pedido: Pedido) => void
}) {
  const situacao = getPedidoSituacao(pedido)

  return (
    <div
      id={`ped-menu-${pedido.id}`}
      className="fixed z-[9999] w-48 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        onClick={() => { onView(pedido.id); onClose() }}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Eye size={12} />
        Ver pedido
      </button>
      <button
        type="button"
        onClick={() => { onEdit(pedido.id); onClose() }}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Pencil size={12} />
        Editar
      </button>
      <button
        type="button"
        onClick={() => { onOpenItems(pedido.id); onClose() }}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <PackagePlus size={12} />
        Adicionar produto
      </button>
      {onDownloadPdf && (
        <button
          type="button"
          onClick={() => { onDownloadPdf(pedido); onClose() }}
          disabled={downloadingPdf}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <Download size={12} />
          {downloadingPdf ? 'Gerando...' : 'Gerar PDF'}
        </button>
      )}
      {situacao === 'pedido' && (
        <button
          type="button"
          onClick={() => { onQuickApprove(pedido); onClose() }}
          disabled={saving}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <CheckCircle2 size={12} />
          Aprovar pagamento/entrega
        </button>
      )}
      {situacao === 'pedido' && onCancelPedido && (
        <button
          type="button"
          onClick={() => { onCancelPedido(pedido); onClose() }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Trash2 size={12} />
          Cancelar pedido
        </button>
      )}
    </div>
  )
}

function PedidoRow({
  pedido,
  activeTab,
  saving,
  onQuickApprove,
  onOpenItems,
  onEdit,
  openMenuId,
  onMenuToggle,
}: {
  pedido: Pedido
  activeTab: PedidoTab
  saving: boolean
  onQuickApprove: (pedido: Pedido) => void
  onOpenItems: (pedidoId: string) => void
  onEdit: (pedidoId: string) => void
  openMenuId: string | null
  onMenuToggle: (id: string | null) => void
}) {
  const situacao = getPedidoSituacao(pedido)
  const dataCol =
    activeTab === 'andamento'
      ? pedido.createdAt || pedido.oportunidade.createdAt
      : activeTab === 'vendas'
        ? pedido.dataEntrega || pedido.dataAprovacao
        : pedido.oportunidade.updatedAt || pedido.oportunidade.createdAt
  const extraCol =
    activeTab === 'andamento'
      ? STATUS_ENTREGA_LABEL[pedido.statusEntrega] || pedido.statusEntrega
      : activeTab === 'cancelados'
        ? pedido.oportunidade.motivoPerda || '-'
        : '-'

  return (
    <div>
      <div
        className={`grid ${GRID_COLS} gap-3 px-3 py-2 items-center transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/35`}
      >
        <div className="text-right text-sm font-medium text-gray-600 dark:text-gray-300 tabular-nums">
          {pedido.numero}
        </div>
        <div className="min-w-0 truncate text-sm text-gray-700 dark:text-gray-300" title={pedido.oportunidade.cliente.nome}>
          {pedido.oportunidade.cliente.nome}
        </div>
        <div className="min-w-0 truncate text-sm text-gray-900 dark:text-white" title={pedido.oportunidade.titulo || undefined}>
          {pedido.oportunidade.titulo || '-'}
        </div>

        <div className="text-right text-sm text-gray-600 dark:text-gray-400 tabular-nums">
          {dataCol ? formatDate(dataCol) : '-'}
        </div>

        <div className="min-w-0 truncate text-sm text-gray-600 dark:text-gray-400" title={typeof extraCol === 'string' ? extraCol : undefined}>
          {extraCol}
        </div>

        <div className="text-right text-sm text-gray-600 dark:text-gray-400 truncate" title={pedido.formaPagamento || undefined}>
          {pedido.formaPagamento || '-'}
        </div>

        <div className="min-w-0 text-right text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums truncate" title={formatCurrency(pedido.totalLiquido)}>
          {formatCurrency(pedido.totalLiquido)}
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1">
          {activeTab === 'andamento' && (
            <>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {STATUS_ENTREGA_LABEL[pedido.statusEntrega] || pedido.statusEntrega}
              </span>
              {pedido.pagamentoConfirmado && (
                <span title="Pagamento confirmado">
                  <CheckCircle2 size={12} className="text-green-500" />
                </span>
              )}
            </>
          )}
        </div>

        <div className="relative flex shrink-0 items-center justify-end">
          <button
            type="button"
            data-ped-menu-btn={pedido.id}
            onClick={() => onMenuToggle(openMenuId === pedido.id ? null : pedido.id)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            title="Ações"
            aria-label="Ações"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
