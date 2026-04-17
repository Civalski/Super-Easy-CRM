'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { DocumentCheck, Filter } from '@/lib/icons'
import {
  CreateContratoModal,
  ContratosList,
  EditContratoDrawer,
  ContratoPreviewDrawer,
  useContratos,
} from '@/components/features/contratos'
import { NovoContratoMenuButton } from '@/components/features/contratos/NovoContratoMenuButton'
import { ContratosFilters, type ContratosFiltersValues } from '@/components/features/contratos/ContratosFilters'
import type { Contrato } from '@/components/features/contratos'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'

function getDownloadFileNameFromHeader(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/filename\*?=['"]?(?:UTF-8'')?([^'";\n]+)['"]?/i)
  if (match) return decodeURIComponent(match[1].trim())
  const simple = header.match(/filename=["']?([^"';]+)["']?/i)
  return simple ? simple[1].trim() : null
}

async function fetchContractPdfWithFallback(contractId: string) {
  const urls = [`/api/contratos/${contractId}/pdf-v2`, `/api/contratos/${contractId}/pdf`]
  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Nao foi possivel gerar o PDF.')
      }
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro ao gerar PDF.')
    }
  }

  throw lastError || new Error('Nao foi possivel gerar o PDF.')
}

export default function ContratosPage() {
  const minimal = usePageHeaderMinimal()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createMode, setCreateMode] = useState<'manual' | 'ia' | null>(null)
  const [editContrato, setEditContrato] = useState<Contrato | null>(null)
  const [previewContrato, setPreviewContrato] = useState<Contrato | null>(null)
  const [activeStatus, setActiveStatus] = useState<'em_andamento' | 'aprovado_assinado' | 'rejeitado'>(
    'em_andamento'
  )
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const [filters, setFilters] = useState<ContratosFiltersValues>({
    tipo: '',
    dataInicio: '',
    dataFim: '',
  })
  const [downloadingPdfById, setDownloadingPdfById] = useState<Record<string, boolean>>({})

  const hasActiveFilters = useMemo(
    () => Boolean(filters.tipo || filters.dataInicio || filters.dataFim),
    [filters.dataFim, filters.dataInicio, filters.tipo]
  )

  const {
    loading,
    contratos,
    saving,
    createContrato,
    deleteContrato,
    updateContrato,
    updateContratoStatus,
    fetchContratos,
  } = useContratos({ ...filters, excludeTipo: 'proposta', status: activeStatus })

  const handleDownloadPdf = useCallback(async (c: Contrato) => {
    try {
      setDownloadingPdfById((prev) => ({ ...prev, [c.id]: true }))
      const res = await fetchContractPdfWithFallback(c.id)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = getDownloadFileNameFromHeader(res.headers.get('Content-Disposition')) || 'Contrato.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
    } finally {
      setDownloadingPdfById((prev) => ({ ...prev, [c.id]: false }))
    }
  }, [])

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!minimal && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-indigo-500/25">
              <DocumentCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contratos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Formalize acordos com cláusulas, partes assinantes e PDF
              </p>
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
              title="Filtrar contratos"
              aria-label="Filtrar contratos"
            >
              <Filter size={16} />
            </button>
            <NovoContratoMenuButton
              variant="contrato"
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
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onClear={() => setFilters({ tipo: '', dataInicio: '', dataFim: '' })}
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
        listVariant="contrato"
        contratos={contratos}
        loading={loading}
        downloadingPdfById={downloadingPdfById}
        showTopAction={minimal}
        onNovo={(mode) => {
          setCreateMode(mode)
          setShowCreateModal(true)
        }}
        onDownloadPdf={(c) => void handleDownloadPdf(c)}
        onDelete={(c) => void deleteContrato(c)}
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

