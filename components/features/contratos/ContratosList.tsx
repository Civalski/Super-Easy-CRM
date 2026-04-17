'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Download, DocumentCheck, Edit2, Eye, Loader2, MoreVertical, Trash2, XCircle } from '@/lib/icons'
import { useConfirm } from '@/components/common'
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

function formatDate(v: Date | string | null | undefined) {
  if (!v) return '-'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR')
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

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const btn = document.querySelector(`[data-contrato-menu-btn="${openMenuId}"]`)
      const menuEl = document.getElementById(`contrato-menu-${openMenuId}`)
      if (btn?.contains(target) || menuEl?.contains(target)) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                  aria-label="Abrir menu de ações"
                >
                  <MoreVertical size={18} />
                </button>
                {openMenuId === c.id && (
                  <div
                    id={`contrato-menu-${c.id}`}
                    className="absolute right-0 top-full z-10 mt-1 w-48 min-w-[140px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onView(c)
                        setOpenMenuId(null)
                      }}
                      className="flex w-full min-h-[40px] items-center gap-2 px-4 py-2 text-sm text-violet-600 transition-colors hover:bg-gray-100 dark:text-violet-400 dark:hover:bg-gray-700"
                    >
                      <Eye size={16} />
                      Ver preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDownloadPdf(c)
                        setOpenMenuId(null)
                      }}
                      disabled={Boolean(downloadingPdfById[c.id])}
                      className="flex w-full min-h-[40px] items-center gap-2 px-4 py-2 text-sm text-blue-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-gray-700"
                    >
                      {downloadingPdfById[c.id] ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {downloadingPdfById[c.id] ? 'Gerando...' : 'Baixar PDF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onEdit(c)
                        setOpenMenuId(null)
                      }}
                      className="flex w-full min-h-[40px] items-center gap-2 px-4 py-2 text-sm text-amber-600 transition-colors hover:bg-gray-100 dark:text-amber-400 dark:hover:bg-gray-700"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeStatus(c, 'aprovado_assinado')
                        setOpenMenuId(null)
                      }}
                      className="flex w-full min-h-[40px] items-center gap-2 px-4 py-2 text-sm text-emerald-600 transition-colors hover:bg-gray-100 dark:text-emerald-400 dark:hover:bg-gray-700"
                    >
                      <CheckCircle2 size={16} />
                      Marcar aprovado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeStatus(c, 'rejeitado')
                        setOpenMenuId(null)
                      }}
                      className="flex w-full min-h-[40px] items-center gap-2 px-4 py-2 text-sm text-orange-600 transition-colors hover:bg-gray-100 dark:text-orange-400 dark:hover:bg-gray-700"
                    >
                      <XCircle size={16} />
                      Marcar rejeitado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(c)
                        setOpenMenuId(null)
                      }}
                      className="flex w-full min-h-[40px] items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                )}
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
    </div>
  )
}
