'use client'

import { Button } from '@/components/common'
import { ChevronDown, ChevronRight, ClipboardList, Download, Plus } from '@/lib/icons'
import { formatCurrency, formatDate } from '@/lib/format'
import { getProbabilityBadgeClass, getProbabilityLabel } from '@/lib/domain/probabilidade'
import type { Oportunidade, PaginationMeta } from './types'
import { STATUS_CONFIG } from './constants'

interface OrcamentosListProps {
  orcamentos: Oportunidade[]
  meta: PaginationMeta
  page: number
  onPageChange: (page: number) => void
  expandedId: string | null
  onToggleExpand: (id: string) => void
  onEdit: (id: string) => void
  tab: 'abertas' | 'canceladas'
  onDownloadPdf?: (oportunidade: Oportunidade) => void
  downloadingPdfById?: Record<string, boolean>
  onTransformarEmPedido?: (oportunidade: Oportunidade) => void
  creatingPedidoById?: Record<string, boolean>
  onReturnToPipeline?: (id: string, previousStatus: string) => void
  onShowCreateModal?: () => void
}

export default function OrcamentosList({
  orcamentos, meta, page, onPageChange, expandedId, onToggleExpand,
  onEdit, tab, onDownloadPdf, downloadingPdfById = {}, onTransformarEmPedido,
  creatingPedidoById = {}, onReturnToPipeline, onShowCreateModal,
}: OrcamentosListProps) {
  const isAbertas = tab === 'abertas'

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
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="crm-table-head grid grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto] gap-3 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            <div className="min-w-0">Orçamento</div>
            <div className="text-right">Valor</div>
            <div className="text-right">Ações</div>
          </div>
          {orcamentos.map((orc) => (
            <OrcamentoRow
              key={orc.id}
              orc={orc}
              isAbertas={isAbertas}
              isExpanded={expandedId === orc.id}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDownloadPdf={onDownloadPdf}
              downloadingPdf={downloadingPdfById[orc.id]}
              onTransformarEmPedido={onTransformarEmPedido}
              creatingPedido={creatingPedidoById[orc.id]}
              onReturnToPipeline={onReturnToPipeline}
            />
          ))}
        </div>
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

function OrcamentoRow({
  orc, isAbertas, isExpanded, onToggleExpand, onEdit,
  onDownloadPdf, downloadingPdf, onTransformarEmPedido, creatingPedido, onReturnToPipeline,
}: {
  orc: Oportunidade
  isAbertas: boolean
  isExpanded: boolean
  onToggleExpand: (id: string) => void
  onEdit: (id: string) => void
  onDownloadPdf?: (o: Oportunidade) => void
  downloadingPdf?: boolean
  onTransformarEmPedido?: (o: Oportunidade) => void
  creatingPedido?: boolean
  onReturnToPipeline?: (id: string, previousStatus: string) => void
}) {
  const statusInfo = STATUS_CONFIG[orc.status] || STATUS_CONFIG[isAbertas ? 'orcamento' : 'perdida']
  const StatusIcon = statusInfo.icon
  const orcLabel = orc.numero != null ? `Orçamento #${orc.numero}` : 'Orçamento'
  const pedidoNumero = orc.pedido?.numero ?? null
  const pedidoLabel = pedidoNumero != null ? `Pedido #${pedidoNumero}` : 'Criar pedido'

  const lostDate = orc.dataFechamento || orc.updatedAt || orc.createdAt || null
  const statusToReturn = orc.statusAnterior || 'orcamento'

  const createdLabel = orc.createdAt ? `Criada ${formatDate(orc.createdAt)}` : null
  const previsaoLabel = orc.dataFechamento ? `Previsão ${formatDate(orc.dataFechamento)}` : null
  const proximaAcaoLabel = orc.proximaAcaoEm ? `Próxima ação ${formatDate(orc.proximaAcaoEm)}` : null
  const datesLabel = isAbertas ? [createdLabel, previsaoLabel, proximaAcaoLabel].filter(Boolean).join(' • ') : ''

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto] gap-3 px-4 py-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/35">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleExpand(orc.id)}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              title={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
              aria-label={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">{orcLabel}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none flex items-center gap-1 ${statusInfo.color}`} title={statusInfo.label}>
              <StatusIcon size={10} />
              <span className="hidden sm:inline">{statusInfo.label}</span>
            </span>
          </div>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
            <span className="min-w-0 truncate">{orc.cliente.nome}</span>
            {isAbertas && orc.titulo && (
              <span className="hidden md:inline min-w-0 truncate text-gray-500 dark:text-gray-500">• {orc.titulo}</span>
            )}
            {isAbertas && pedidoNumero && (
              <span className="shrink-0 font-semibold text-blue-600 dark:text-blue-400">• Pedido #{pedidoNumero}</span>
            )}
            {orc.descricao && (
              <span className="hidden md:inline min-w-0 truncate text-gray-500 dark:text-gray-500">• {orc.descricao}</span>
            )}
            {isAbertas && datesLabel && (
              <span className="hidden xl:inline min-w-0 truncate text-gray-500 dark:text-gray-500">• {datesLabel}</span>
            )}
            {!isAbertas && lostDate && (
              <span className="hidden xl:inline min-w-0 truncate text-gray-500 dark:text-gray-500">• Cancelado em {formatDate(lostDate)}</span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(orc.valor)}</p>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${getProbabilityBadgeClass(orc.probabilidade)}`}>
            {getProbabilityLabel(orc.probabilidade)}
          </span>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5">
          {isAbertas ? (
            <>
              <Button size="sm" variant="outline" className="px-2 py-1 text-xs" title="Baixar orçamento em PDF" onClick={() => onDownloadPdf?.(orc)} disabled={Boolean(downloadingPdf)}>
                <Download size={14} className="mr-1" />
                <span className="hidden sm:inline">{downloadingPdf ? 'Baixando...' : 'PDF'}</span>
              </Button>
              {orc.pedido ? (
                <a href="/pedidos" title="Abrir pedido">
                  <Button size="sm" variant="outline" className="px-2 py-1 text-xs">
                    <ClipboardList size={14} className="mr-1" />
                    <span className="hidden sm:inline">Abrir pedido</span>
                  </Button>
                </a>
              ) : (
                <Button size="sm" variant="outline" className="px-2 py-1 text-xs" title="Transformar em pedido" onClick={() => onTransformarEmPedido?.(orc)} disabled={Boolean(creatingPedido)}>
                  <ClipboardList size={14} className="mr-1" />
                  <span className="hidden sm:inline">{creatingPedido ? 'Convertendo...' : pedidoLabel}</span>
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" variant="outline" className="px-2 py-1 text-xs" onClick={() => onReturnToPipeline?.(orc.id, statusToReturn)}>
              Reabrir
            </Button>
          )}
          <Button size="sm" variant="outline" className="px-2 py-1 text-xs" title="Editar orcamento" onClick={() => onEdit(orc.id)}>
            Editar
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mx-4 mb-4 rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <p><span className="font-semibold">Cliente:</span> {orc.cliente.nome}</p>
            {isAbertas ? (
              <>
                <p><span className="font-semibold">Criada em:</span> {formatDate(orc.createdAt)}</p>
                <p><span className="font-semibold">Previsao:</span> {formatDate(orc.dataFechamento)}</p>
                <p><span className="font-semibold">Proxima acao:</span> {formatDate(orc.proximaAcaoEm)}</p>
                <p><span className="font-semibold">Forma pgto:</span> {orc.formaPagamento || '-'}</p>
                <p><span className="font-semibold">Parcelas:</span> {orc.parcelas ?? '-'}</p>
                <p><span className="font-semibold">Desconto:</span> {formatCurrency(orc.desconto ?? null)}</p>
              </>
            ) : (
              <>
                <p><span className="font-semibold">Cancelado em:</span> {formatDate(lostDate)}</p>
                <p><span className="font-semibold">Status anterior:</span> {statusToReturn}</p>
              </>
            )}
          </div>
          {orc.descricao && (
            <p className="mt-2"><span className="font-semibold">Descricao:</span> {orc.descricao}</p>
          )}
        </div>
      )}
    </div>
  )
}
