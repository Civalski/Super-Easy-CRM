'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Download, DocumentCheck, Edit2, Eye, Loader2, MoreVertical, Trash2, XCircle } from '@/lib/icons'
import { useConfirm } from '@/components/common'
import { clampFixedMenuPosition } from '@/lib/ui/clampFixedMenuPosition'
import type { Contrato } from './types'
import { getTipoDocumentoLabel } from './constants'
import { NovoContratoMenuButton } from './NovoContratoMenuButton'

interface ContratosListProps {
  listVariant?: 'contrato' | 'proposta'
  contratos: Contrato[]
  loading: boolean
  downloadingPdfById: Record<string, boolean>
  onNovo: (mode: 'manual' | 'ia') => void
  onDownloadPdf: (c: Contrato) => void
  onDelete: (c: Contrato) => void
  onChangeStatus: (c: Contrato, status: 'em_andamento' | 'aprovado_assinado' | 'rejeitado') => void
  onEdit: (c: Contrato) => void
  onView: (c: Contrato) => void
  showTopAction?: boolean
}

const CNT_MENU_WIDTH = 192
const CNT_MENU_HEIGHT_EST = 360

function formatDate(v: Date | string | null | undefined) {
  if (!v) return '-'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR')
}

function ContratoMenuDropdown({
  contrato,
  position,
  downloadingPdf,
  onClose,
  onView,
  onDownloadPdf,
  onEdit,
  onChangeStatus,
  onDelete,
}: {
  contrato: Contrato
  position: { top: number; left: number }
  downloadingPdf: boolean
  onClose: () => void
  onView: () => void
  onDownloadPdf: () => void
  onEdit: () => void
  onChangeStatus: (status: 'em_andamento' | 'aprovado_assinado' | 'rejeitado') => void
  onDelete: () => void
}) {
  const row =
    'flex w-full min-h-[44px] items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-100 lg:min-h-[40px] dark:hover:bg-gray-700'

  return (
    <div
      id={`contrato-menu-${contrato.id}`}
      className="fixed z-[9999] w-48 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      style={{ top: position.top, left: position.left }}
    >
      <button type="button" onClick={() => { onView(); onClose() }} className={`${row} text-violet-600 dark:text-violet-400`}>
        <Eye size={16} />
        Ver preview
      </button>
      <button
        type="button"
        onClick={() => {
          onDownloadPdf()
          onClose()
        }}
        disabled={downloadingPdf}
        className={`${row} text-blue-600 disabled:opacity-50 dark:text-blue-400`}
      >
        {downloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {downloadingPdf ? 'Gerando...' : 'Baixar PDF'}
      </button>
      <button type="button" onClick={() => { onEdit(); onClose() }} className={`${row} text-amber-600 dark:text-amber-400`}>
        <Edit2 size={16} />
        Editar
      </button>
      <button
        type="button"
        onClick={() => {
          onChangeStatus('aprovado_assinado')
          onClose()
        }}
        className={`${row} text-emerald-600 dark:text-emerald-400`}
      >
        <CheckCircle2 size={16} />
        Marcar aprovado
      </button>
      <button
        type="button"
        onClick={() => {
          onChangeStatus('rejeitado')
          onClose()
        }}
        className={`${row} text-orange-600 dark:text-orange-400`}
      >
        <XCircle size={16} />
        Marcar rejeitado
      </button>
      <button type="button" onClick={() => { onDelete(); onClose() }} className={`${row} text-red-600 dark:text-red-400`}>
        <Trash2 size={16} />
        Excluir
      </button>
    </div>
  )
}

export function ContratosList({
  listVariant = 'contrato',
  contratos,
  loading,
  downloadingPdfById,
  onNovo,
  onDownloadPdf,
  onDelete,
  onChangeStatus,
  onEdit,
  onView,
  showTopAction = true,
}: ContratosListProps) {
  const isPropostaList = listVariant === 'proposta'
  const { confirm } = useConfirm()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!openMenuId || typeof document === 'undefined') return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      const btn = document.querySelector(`[data-contrato-menu-btn="${openMenuId}"]`)
      if (btn?.contains(target)) return
      const menuEl = document.getElementById(`contrato-menu-${openMenuId}`)
      if (menuEl?.contains(target)) return
      setOpenMenuId(null)
    }

    const updatePosition = () => {
      const btn = document.querySelector(`[data-contrato-menu-btn="${openMenuId}"]`) as HTMLElement | null
      if (btn) {
        const rect = btn.getBoundingClientRect()
        setMenuPosition(clampFixedMenuPosition(rect, CNT_MENU_WIDTH, CNT_MENU_HEIGHT_EST, true))
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

  const handleDelete = async (c: Contrato) => {
    const ok = await confirm({
      title: isPropostaList ? 'Excluir proposta' : 'Excluir contrato',
      description: `Deseja excluir ${isPropostaList ? 'a proposta' : 'o contrato'} "${c.titulo}"?`,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
    })
    if (ok) onDelete(c)
  }

  const openContrato = openMenuId ? contratos.find((x) => x.id === openMenuId) : null

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (contratos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700">
        <DocumentCheck className="mb-4 h-12 w-12 text-gray-400" />
        <p className="mb-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
          {isPropostaList ? 'Nenhuma proposta cadastrada' : 'Nenhum contrato cadastrado'}
        </p>
        <p className="mb-4 max-w-sm text-center text-xs text-gray-500 dark:text-gray-500">
          {isPropostaList
            ? 'Monte propostas comerciais com escopo, condições e PDF profissional — sem cláusulas de contrato.'
            : 'Crie contratos com cláusulas, partes e PDF formal.'}
        </p>
        <NovoContratoMenuButton variant={isPropostaList ? 'proposta' : 'contrato'} onSelect={onNovo} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showTopAction ? (
        <div className="flex justify-end">
          <NovoContratoMenuButton variant={isPropostaList ? 'proposta' : 'contrato'} onSelect={onNovo} />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contratos.map((c) => (
          <div
            key={c.id}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 dark:text-white">{c.titulo}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  #{String(c.numero).padStart(5, '0')} · {getTipoDocumentoLabel(c.tipo)}
                </p>
              </div>
              <div className="relative shrink-0">
                <button
                  type="button"
                  data-contrato-menu-btn={c.id}
                  onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:min-h-[36px] lg:min-w-[36px] dark:hover:bg-gray-600 dark:hover:text-gray-300"
                  aria-label="Abrir menu de ações"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
            {c.cliente ? (
              <p className="mb-2 truncate text-sm text-gray-600 dark:text-gray-300">
                Cliente: {c.cliente.nome}
              </p>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Criado em {formatDate(c.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {openContrato && menuPosition && typeof document !== 'undefined' &&
        createPortal(
          <ContratoMenuDropdown
            contrato={openContrato}
            position={menuPosition}
            downloadingPdf={Boolean(downloadingPdfById[openContrato.id])}
            onClose={() => setOpenMenuId(null)}
            onView={() => onView(openContrato)}
            onDownloadPdf={() => onDownloadPdf(openContrato)}
            onEdit={() => onEdit(openContrato)}
            onChangeStatus={(status) => onChangeStatus(openContrato, status)}
            onDelete={() => void handleDelete(openContrato)}
          />,
          document.body
        )}
    </div>
  )
}
