'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ContratosFilters,
  type ContratosFiltersValues,
} from '@/components/features/contratos/ContratosFilters'
import { ContratosList } from '@/components/features/contratos/ContratosList'
import {
  CONTRATOS_WORKSPACE_VARIANT_UI,
  type ContratosWorkspaceVariant,
} from '@/components/features/contratos/ContratosWorkspace.config'
import { CreateContratoModal } from '@/components/features/contratos/CreateContratoModal'
import { ContratoPreviewDrawer } from '@/components/features/contratos/ContratoPreviewDrawer'
import { EditContratoDrawer } from '@/components/features/contratos/EditContratoDrawer'
import { useContratos } from '@/components/features/contratos/hooks/useContratos'
import type { Contrato } from '@/components/features/contratos/types'
import { NovoContratoMenuButton } from '@/components/features/contratos/NovoContratoMenuButton'
import {
  fetchContractPdfWithFallback,
  getDownloadFileNameFromHeader,
} from '@/components/features/contratos/download-contract-pdf'
import { Filter } from '@/lib/icons'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'

export function ContratosWorkspace({ variant }: { variant: ContratosWorkspaceVariant }) {
  const minimal = usePageHeaderMinimal()
  const ui = CONTRATOS_WORKSPACE_VARIANT_UI[variant]
  const isPropostaContext = variant === 'propostas'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createMode, setCreateMode] = useState<'manual' | 'ia' | null>(null)
  const [editContrato, setEditContrato] = useState<Contrato | null>(null)
  const [previewContrato, setPreviewContrato] = useState<Contrato | null>(null)
  const [activeStatus, setActiveStatus] = useState<'em_andamento' | 'aprovado_assinado' | 'rejeitado'>(
    'em_andamento'
  )
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)

  const [filters, setFilters] = useState<ContratosFiltersValues>(() =>
    isPropostaContext ? { tipo: 'proposta', dataInicio: '', dataFim: '' } : { tipo: '', dataInicio: '', dataFim: '' }
  )

  const [downloadingPdfById, setDownloadingPdfById] = useState<Record<string, boolean>>({})

  const hasActiveFilters = useMemo(() => {
    if (isPropostaContext) return Boolean(filters.dataInicio || filters.dataFim)
    return Boolean(filters.tipo || filters.dataInicio || filters.dataFim)
  }, [filters.dataFim, filters.dataInicio, filters.tipo, isPropostaContext])

  const tipoLocked = isPropostaContext ? 'proposta' : undefined

  const {
    loading,
    contratos,
    saving,
    createContrato,
    deleteContrato,
    updateContrato,
    updateContratoStatus,
    fetchContratos,
  } = useContratos({ ...filters, status: activeStatus })

  const handleDownloadPdf = useCallback(
    async (c: Contrato) => {
      try {
        setDownloadingPdfById((prev) => ({ ...prev, [c.id]: true }))
        const res = await fetchContractPdfWithFallback(c.id)
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download =
          getDownloadFileNameFromHeader(res.headers.get('Content-Disposition')) ?? ui.downloadFallback
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error(error)
      } finally {
        setDownloadingPdfById((prev) => ({ ...prev, [c.id]: false }))
      }
    },
    [ui.downloadFallback]
  )

  const handleSave = useCallback(
    async (values: Parameters<typeof createContrato>[0]) => {
      const created = await createContrato(values)
      return created
    },
    [createContrato]
  )

  const handleUpdateContrato = useCallback(
    async (id: string, values: Parameters<typeof updateContrato>[1]) => {
      const updated = await updateContrato(id, values)
      return updated
    },
    [updateContrato]
  )

  const HeroIcon = ui.heroIcon

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!minimal && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-indigo-500/25">
              <HeroIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ui.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ui.subtitle}</p>
            </div>
          </div>
        )}
        {!minimal ? (
          <div className="flex items-center gap-2">
            <button
              ref={filterButtonRef}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                hasActiveFilters
                  ? 'border-gray-300 bg-white text-blue-600 hover:bg-gray-50 dark:border-purple-500 dark:bg-purple-900/40 dark:text-purple-200 dark:hover:bg-purple-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800'
              }`}
              onClick={() => setFiltersOpen((open) => !open)}
              title={ui.filterAria}
              aria-label={ui.filterAria}
            >
              <Filter size={16} />
            </button>
            <NovoContratoMenuButton
              variant={isPropostaContext ? 'proposta' : 'contrato'}
              onSelect={(mode) => {
                setCreateMode(mode)
                setShowCreateModal(true)
              }}
            />
          </div>
        ) : null}
      </div>

      <ContratosFilters
        open={filtersOpen}
        anchorRef={filterButtonRef}
        values={filters}
        onChange={(next) => {
          if (tipoLocked === 'proposta') setFilters({ ...next, tipo: 'proposta' })
          else setFilters(next)
        }}
        onClose={() => setFiltersOpen(false)}
        onClear={() =>
          setFilters(
            isPropostaContext
              ? { tipo: 'proposta', dataInicio: '', dataFim: '' }
              : { tipo: '', dataInicio: '', dataFim: '' }
          )
        }
        tipoLocked={tipoLocked}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveStatus('em_andamento')}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            activeStatus === 'em_andamento'
              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Em andamento
        </button>
        <button
          type="button"
          onClick={() => setActiveStatus('aprovado_assinado')}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            activeStatus === 'aprovado_assinado'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Aprovados
        </button>
        <button
          type="button"
          onClick={() => setActiveStatus('rejeitado')}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            activeStatus === 'rejeitado'
              ? 'border-red-600 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Rejeitados
        </button>
      </div>

      <ContratosList
        contratos={contratos}
        loading={loading}
        downloadingPdfById={downloadingPdfById}
        showTopAction={minimal}
        onNovo={(mode) => {
          setCreateMode(mode)
          setShowCreateModal(true)
        }}
        onDownloadPdf={(c) => void handleDownloadPdf(c)}
        onDelete={(c) => void deleteContrato(c.id)}
        onChangeStatus={(c, status) => void updateContratoStatus(c.id, status)}
        onEdit={(c) => setEditContrato(c)}
        onView={(c) => setPreviewContrato(c)}
      />

      <EditContratoDrawer
        open={Boolean(editContrato)}
        contrato={editContrato}
        saving={saving}
        onClose={() => setEditContrato(null)}
        onSave={handleUpdateContrato}
      />

      <ContratoPreviewDrawer
        open={Boolean(previewContrato)}
        contrato={previewContrato}
        onClose={() => setPreviewContrato(null)}
      />

      <CreateContratoModal
        open={showCreateModal}
        initialMode={createMode}
        documentKind={isPropostaContext ? 'proposta' : 'contrato'}
        onClose={() => {
          setShowCreateModal(false)
          setCreateMode(null)
        }}
        onCreated={() => {
          setShowCreateModal(false)
          setCreateMode(null)
          void fetchContratos(1)
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}
