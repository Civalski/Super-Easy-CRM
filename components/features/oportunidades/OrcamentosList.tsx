'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/common'
import { ClipboardList, DocumentDuplicate, Download, Eye, MoreVertical, Pencil, Plus, Trash2 } from '@/lib/icons'
import { formatCurrency, formatDate } from '@/lib/format'
import { getProbabilityBadgeClass, getProbabilityLabel } from '@/lib/domain/probabilidade'
import type { Oportunidade, PaginationMeta } from './types'

interface OrcamentosListProps {
  orcamentos: Oportunidade[]
  meta: PaginationMeta
  page: number
  onPageChange: (page: number) => void
  onVerDetalhes: (id: string) => void
  onEdit: (id: string) => void
  tab: 'abertas' | 'canceladas'
  onDownloadPdf?: (oportunidade: Oportunidade) => void
  downloadingPdfById?: Record<string, boolean>
  onTransformarEmPedido?: (oportunidade: Oportunidade) => void
  creatingPedidoById?: Record<string, boolean>
  onReturnToPipeline?: (id: string, previousStatus: string) => void
  onShowCreateModal?: () => void
  onDuplicar?: (id: string) => void
  onCancelar?: (id: string) => void
}

export default function OrcamentosList({
  orcamentos, meta, page, onPageChange, onVerDetalhes,
  onEdit, tab, onDownloadPdf, downloadingPdfById = {}, onTransformarEmPedido,
  creatingPedidoById = {},   onReturnToPipeline, onShowCreateModal, onDuplicar, onCancelar,
}: OrcamentosListProps) {
  const isAbertas = tab === 'abertas'
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!openMenuId || typeof document === 'undefined') return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const btn = document.querySelector(`[data-orc-menu-btn="${openMenuId}"]`)
      if (btn?.contains(target)) return
      const menuEl = document.getElementById(`orc-menu-${openMenuId}`)
      if (menuEl?.contains(target)) return
      setOpenMenuId(null)
    }

    const updatePosition = () => {
      const btn = document.querySelector(`[data-orc-menu-btn="${openMenuId}"]`) as HTMLElement
      if (btn) {
        const rect = btn.getBoundingClientRect()
        setMenuPosition({ top: rect.bottom + 4, left: rect.right - 192 })
      }
    }

    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [openMenuId])

  const openOrc = openMenuId ? orcamentos.find((o) => o.id === openMenuId) : null

  if (isAbertas && orcamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Nenhum orçamento em aberto.</p>
        <Button onClick={onShowCreateModal}>
          <Plus size={20} className="mr-2" />
          Novo Orçamento
        </Button>
      </div>
    )
  }

  return (
    <>
      {orcamentos.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Nenhum orçamento perdido registrado.
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-x-auto">
          <div className="crm-table-head grid min-w-[940px] grid-cols-[minmax(48px,60px)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(80px,100px)_minmax(80px,100px)_minmax(80px,100px)_minmax(52px,68px)_minmax(88px,110px)_minmax(60px,80px)_32px] gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            <div className="text-right">Nº</div>
            <div className="min-w-0">Cliente</div>
            <div className="min-w-0">Título</div>
            <div className="text-right">Criada</div>
            <div className="text-right">{isAbertas ? 'Previsão' : 'Cancelado em'}</div>
            <div className="text-right">Próx. ação</div>
            <div className="text-right">Forma pgto</div>
            <div className="text-right">Valor</div>
            <div className="text-right">Probab.</div>
            <div />
          </div>
          {orcamentos.map((orc) => (
            <OrcamentoRow
              key={orc.id}
              orc={orc}
              isAbertas={isAbertas}
              onEdit={onEdit}
              onDownloadPdf={onDownloadPdf}
              downloadingPdf={downloadingPdfById[orc.id]}
              onTransformarEmPedido={onTransformarEmPedido}
              creatingPedido={creatingPedidoById[orc.id]}
              onReturnToPipeline={onReturnToPipeline}
              openMenuId={openMenuId}
              onMenuToggle={setOpenMenuId}
              onVerDetalhes={onVerDetalhes}
            />
          ))}
        </div>
      )}

      {openOrc && menuPosition && typeof document !== 'undefined' && createPortal(
        <OrcamentoMenuDropdown
          orc={openOrc}
          isAbertas={isAbertas}
          position={menuPosition}
          onClose={() => setOpenMenuId(null)}
          onEdit={(id) => { setOpenMenuId(null); onEdit(id) }}
          onVerDetalhes={(id) => { setOpenMenuId(null); onVerDetalhes(id) }}
          onDownloadPdf={onDownloadPdf}
          downloadingPdf={downloadingPdfById[openOrc.id]}
          onTransformarEmPedido={onTransformarEmPedido}
          creatingPedido={creatingPedidoById[openOrc.id]}
          onReturnToPipeline={onReturnToPipeline}
          onDuplicar={onDuplicar}
          onCancelar={onCancelar}
        />,
        document.body
      )}

      {meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Anterior
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Página {page} de {meta.pages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= meta.pages} onClick={() => onPageChange(page + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </>
  )
}

function OrcamentoMenuDropdown({
  orc, isAbertas, position, onClose, onEdit, onVerDetalhes, onDownloadPdf, downloadingPdf,
  onTransformarEmPedido, creatingPedido, onReturnToPipeline, onDuplicar, onCancelar,
}: {
  orc: Oportunidade
  isAbertas: boolean
  position: { top: number; left: number }
  onClose: () => void
  onEdit: (id: string) => void
  onVerDetalhes: (id: string) => void
  onDownloadPdf?: (o: Oportunidade) => void
  downloadingPdf?: boolean
  onTransformarEmPedido?: (o: Oportunidade) => void
  creatingPedido?: boolean
  onReturnToPipeline?: (id: string, previousStatus: string) => void
  onDuplicar?: (id: string) => void
  onCancelar?: (id: string) => void
}) {
  const pedidoNumero = orc.pedido?.numero ?? null
  const pedidoLabel = pedidoNumero != null ? `Pedido #${pedidoNumero}` : 'Transformar em pedido'
  const statusToReturn = orc.statusAnterior || 'orcamento'

  return (
    <div
      id={`orc-menu-${orc.id}`}
      className="fixed z-[9999] w-48 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      style={{ top: position.top, left: position.left }}
    >
      <button
        type="button"
        onClick={() => { onVerDetalhes(orc.id) }}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Eye size={12} />
        Ver detalhes
      </button>
      {isAbertas && (
        <>
          <button
            type="button"
            onClick={() => { onDownloadPdf?.(orc); onClose() }}
            disabled={Boolean(downloadingPdf)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <Download size={12} />
            {downloadingPdf ? 'Baixando...' : 'Gerar PDF'}
          </button>
          {orc.pedido ? (
            <a
              href="/pedidos"
              onClick={onClose}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ClipboardList size={12} />
              Abrir pedido
            </a>
          ) : (
            <button
              type="button"
              onClick={() => { onTransformarEmPedido?.(orc); onClose() }}
              disabled={Boolean(creatingPedido)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <ClipboardList size={12} />
              {creatingPedido ? 'Convertendo...' : pedidoLabel}
            </button>
          )}
        </>
      )}
      {!isAbertas && (
        <button
          type="button"
          onClick={() => { onReturnToPipeline?.(orc.id, statusToReturn); onClose() }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Reabrir
        </button>
      )}
      {isAbertas && onDuplicar && (
        <button
          type="button"
          onClick={() => { onDuplicar(orc.id); onClose() }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <DocumentDuplicate size={12} />
          Duplicar
        </button>
      )}
      <button
        type="button"
        onClick={() => { onEdit(orc.id) }}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Pencil size={12} />
        Editar
      </button>
      {isAbertas && onCancelar && (
        <button
          type="button"
          onClick={() => { onCancelar(orc.id); onClose() }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Trash2 size={12} />
          Cancelar orçamento
        </button>
      )}
    </div>
  )
}

function OrcamentoRow({
  orc, isAbertas, onEdit,
  onDownloadPdf, downloadingPdf, onTransformarEmPedido, creatingPedido, onReturnToPipeline,
  openMenuId, onMenuToggle, onVerDetalhes,
}: {
  orc: Oportunidade
  isAbertas: boolean
  onEdit: (id: string) => void
  onDownloadPdf?: (o: Oportunidade) => void
  downloadingPdf?: boolean
  onTransformarEmPedido?: (o: Oportunidade) => void
  creatingPedido?: boolean
  onReturnToPipeline?: (id: string, previousStatus: string) => void
  openMenuId: string | null
  onMenuToggle: (id: string | null) => void
  onVerDetalhes: (id: string) => void
}) {
  const lostDate = orc.dataFechamento || orc.updatedAt || orc.createdAt || null

  const gridCols = 'min-w-[940px] grid-cols-[minmax(48px,60px)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(80px,100px)_minmax(80px,100px)_minmax(80px,100px)_minmax(52px,68px)_minmax(88px,110px)_minmax(60px,80px)_32px]'

  return (
    <div>
      <div className={`grid ${gridCols} gap-3 px-3 py-2 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/35 items-center`}>
        <div className="text-right text-sm font-medium text-gray-600 dark:text-gray-300 tabular-nums">
          {orc.numero != null ? orc.numero : '-'}
        </div>
        <div className="min-w-0 truncate text-sm text-gray-700 dark:text-gray-300" title={orc.cliente.nome}>
          {orc.cliente.nome}
        </div>
        <div className="min-w-0 truncate text-sm text-gray-900 dark:text-white" title={orc.titulo || undefined}>
          {orc.titulo || '-'}
        </div>

        <div className="text-right text-sm text-gray-600 dark:text-gray-400 tabular-nums">
          {orc.createdAt ? formatDate(orc.createdAt) : '-'}
        </div>

        <div className="text-right text-sm text-gray-600 dark:text-gray-400 tabular-nums">
          {isAbertas ? (orc.dataFechamento ? formatDate(orc.dataFechamento) : '-') : (lostDate ? formatDate(lostDate) : '-')}
        </div>

        <div className="text-right text-sm text-gray-600 dark:text-gray-400 tabular-nums">
          {isAbertas ? (orc.proximaAcaoEm ? formatDate(orc.proximaAcaoEm) : '-') : '-'}
        </div>

        <div className="text-right text-sm text-gray-600 dark:text-gray-400 truncate" title={orc.formaPagamento || undefined}>
          {orc.formaPagamento || '-'}
        </div>

        <div className="min-w-0 text-right text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums truncate" title={formatCurrency(orc.valor)}>
          {formatCurrency(orc.valor)}
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getProbabilityBadgeClass(orc.probabilidade)}`}>
            {getProbabilityLabel(orc.probabilidade)}
          </span>
        </div>

        <div className="relative flex shrink-0 items-center justify-end">
          <button
            type="button"
            data-orc-menu-btn={orc.id}
            onClick={() => onMenuToggle(openMenuId === orc.id ? null : orc.id)}
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
