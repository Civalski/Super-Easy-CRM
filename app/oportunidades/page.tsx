'use client'

import dynamic from 'next/dynamic'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Briefcase, DollarSign, FileText, Filter, Loader2, Plus } from '@/lib/icons'
import { Button } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { formatCurrency } from '@/lib/format'
import { CancelarOrcamentoModal, OrcamentosList, useOrcamentos } from '@/components/features/oportunidades'
import { OrcamentosFilters, type OrcamentosFiltersValues } from '@/components/features/oportunidades/OrcamentosFilters'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'

const CreateOrcamentoDrawer = dynamic(
  () => import('@/components/features/oportunidades/CreateOrcamentoDrawer'),
  { ssr: false }
)
const EditOrcamentoDrawer = dynamic(
  () => import('@/components/features/oportunidades/EditOrcamentoDrawer'),
  { ssr: false }
)
const VerOrcamentoDrawer = dynamic(
  () => import('@/components/features/oportunidades/VerOrcamentoDrawer'),
  { ssr: false }
)
const DuplicarOrcamentoDrawer = dynamic(
  () => import('@/components/features/oportunidades/DuplicarOrcamentoDrawer'),
  { ssr: false }
)

function OrcamentosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const minimal = usePageHeaderMinimal()
  const clienteIdFilter = searchParams.get('clienteId')?.trim() || ''
  const clienteNomeFilter = searchParams.get('clienteNome') || 'Cliente selecionado'
  const searchFilter = searchParams.get('search')?.trim() || ''
  const formaPagamentoFilter = searchParams.get('formaPagamento')?.trim() || ''
  const probabilidadeFilter = searchParams.get('probabilidade')?.trim() || ''
  const periodoFilter = searchParams.get('periodo')?.trim() || ''
  const hasClienteFilter = clienteIdFilter.length > 0
  const hasSearchFilter = searchFilter.length > 0
  const hasFiltersFilter = formaPagamentoFilter || probabilidadeFilter || periodoFilter
  const clienteQuery = hasClienteFilter ? `&clienteId=${encodeURIComponent(clienteIdFilter)}` : ''
  const searchQuery = hasSearchFilter ? `&search=${encodeURIComponent(searchFilter)}` : ''
  const filtersQueryParts: string[] = []
  if (formaPagamentoFilter) filtersQueryParts.push(`formaPagamento=${encodeURIComponent(formaPagamentoFilter)}`)
  if (probabilidadeFilter) filtersQueryParts.push(`probabilidade=${encodeURIComponent(probabilidadeFilter)}`)
  if (periodoFilter) {
    const days = parseInt(periodoFilter, 10)
    if (!Number.isNaN(days) && days > 0) {
      const dataFim = new Date()
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - days)
      dataInicio.setHours(0, 0, 0, 0)
      filtersQueryParts.push(`dataInicio=${dataInicio.toISOString().split('T')[0]}`)
      filtersQueryParts.push(`dataFim=${dataFim.toISOString().split('T')[0]}`)
    }
  }
  const filtersQuery = filtersQueryParts.length > 0 ? `&${filtersQueryParts.join('&')}` : ''

  const [activeTab, setActiveTab] = useState<'abertas' | 'canceladas'>('abertas')
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
        router.replace(nextQuery ? `/oportunidades?${nextQuery}` : '/oportunidades')
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
  const [editingOrcamentoId, setEditingOrcamentoId] = useState<string | null>(null)
  const [viewingOrcamentoId, setViewingOrcamentoId] = useState<string | null>(null)
  const [duplicandoOrcamentoId, setDuplicandoOrcamentoId] = useState<string | null>(null)
  const [cancelandoOrcamentoId, setCancelandoOrcamentoId] = useState<string | null>(null)
  const [prefillPerson, setPrefillPerson] = useState<AsyncSelectOption | null>(null)

  const {
    loading,
    orcamentosAbertos,
    historicoPerdidas,
    metaAbertas,
    metaPerdidas,
    pageAbertas,
    setPageAbertas,
    pagePerdidas,
    setPagePerdidas,
    creatingPedidoById,
    downloadingPdfById,
    stats,
    fetchOportunidades,
    handleTransformarEmPedido,
    handleDownloadOrcamentoPdf,
    handleReturnToPipeline,
    handleCancelarOrcamento,
    cancelandoLoading,
  } = useOrcamentos({ activeTab, clienteQuery, searchQuery, filtersQuery })

  useEffect(() => {
    const shouldOpen = searchParams.get('novoOrcamento') === '1'
    const clienteId = searchParams.get('clienteId')
    if (!shouldOpen || !clienteId) return
    const clienteNome = searchParams.get('clienteNome') || 'Cliente selecionado'
    setPrefillPerson({ id: clienteId, nome: clienteNome, tipo: 'cliente' })
    setShowCreateModal(true)
  }, [searchParams])

  useEffect(() => {
    const aba = searchParams.get('aba')
    if (aba === 'fechadas' || aba === 'historico' || aba === 'canceladas') {
      setActiveTab('canceladas')
    }
  }, [searchParams])

  const clearOrcamentoPrefillParams = useCallback(() => {
    if (!searchParams.get('novoOrcamento') && !searchParams.get('clienteId') && !searchParams.get('clienteNome')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('novoOrcamento')
    params.delete('clienteId')
    params.delete('clienteNome')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/oportunidades?${nextQuery}` : '/oportunidades')
  }, [router, searchParams])

  const clearClienteFilter = useCallback(() => {
    if (!searchParams.get('clienteId') && !searchParams.get('clienteNome') && !searchParams.get('aba')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('clienteId')
    params.delete('clienteNome')
    params.delete('aba')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/oportunidades?${nextQuery}` : '/oportunidades')
  }, [router, searchParams])

  const clearSearchFilter = useCallback(() => {
    if (!searchParams.get('search')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/oportunidades?${nextQuery}` : '/oportunidades')
    setSearchInput('')
  }, [router, searchParams])

  const clearFiltersFilter = useCallback(() => {
    if (!formaPagamentoFilter && !probabilidadeFilter && !periodoFilter) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('formaPagamento')
    params.delete('probabilidade')
    params.delete('periodo')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/oportunidades?${nextQuery}` : '/oportunidades')
  }, [router, searchParams, formaPagamentoFilter, probabilidadeFilter, periodoFilter])

  const handleFiltersChange = useCallback(
    (values: OrcamentosFiltersValues) => {
      const params = new URLSearchParams(searchParams.toString())
      if (values.formaPagamento) params.set('formaPagamento', values.formaPagamento)
      else params.delete('formaPagamento')
      if (values.probabilidade) params.set('probabilidade', values.probabilidade)
      else params.delete('probabilidade')
      if (values.periodo) params.set('periodo', values.periodo)
      else params.delete('periodo')
      const nextQuery = params.toString()
      router.replace(nextQuery ? `/oportunidades?${nextQuery}` : '/oportunidades')
    },
    [router, searchParams]
  )

  const handleOrcamentoCreated = () => {
    clearOrcamentoPrefillParams()
    setPrefillPerson(null)
    setShowCreateModal(false)
    setActiveTab('abertas')
    setPageAbertas(1)
    void fetchOportunidades(undefined, { pageAbertas: 1 })
  }

  const handleOrcamentoEdited = () => {
    setEditingOrcamentoId(null)
    void fetchOportunidades()
  }

  const handleOrcamentoDuplicated = () => {
    setDuplicandoOrcamentoId(null)
    setActiveTab('abertas')
    setPageAbertas(1)
    void fetchOportunidades(undefined, { pageAbertas: 1 })
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {!minimal && (
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seus orçamentos comerciais</p>
            </div>
          </div>
        )}
        <div className={minimal ? 'sm:ml-auto' : ''}>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={20} className="mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex flex-1 max-w-[400px] items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por número ou nome do cliente"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
          <div className="absolute right-2 flex items-center">
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`rounded p-1.5 transition-colors ${
                hasFiltersFilter
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              }`}
              title="Filtrar orçamentos"
              aria-label="Filtrar orçamentos"
            >
              <Filter size={18} />
            </button>
          </div>
          <div className="absolute right-2 top-full">
            <OrcamentosFilters
              open={filtersOpen}
              anchorRef={filterButtonRef}
              values={{
                formaPagamento: formaPagamentoFilter,
                probabilidade: probabilidadeFilter,
                periodo: periodoFilter,
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
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
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
          {formaPagamentoFilter && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Pagamento: {formaPagamentoFilter}
            </span>
          )}
          {probabilidadeFilter && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              Probabilidade: {probabilidadeFilter}
            </span>
          )}
          {periodoFilter && (
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
              Período: últimos {periodoFilter} dias
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Briefcase size={16} />
            <span className="text-xs font-medium">Em Aberto</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.abertas}</p>
        </div>
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Valor Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.valorTotal)}</p>
        </div>
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <FileText size={16} />
            <span className="text-xs font-medium">Orçamento</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.emOrcamento}</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('abertas')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'abertas'
            ? 'border-purple-700 text-purple-700 dark:border-purple-500 dark:text-purple-500'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Briefcase size={16} />
          Orçamentos ({metaAbertas.total})
        </button>
        <button
          onClick={() => setActiveTab('canceladas')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'canceladas'
            ? 'border-purple-700 text-purple-700 dark:border-purple-500 dark:text-purple-500'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Orçamentos cancelados ({metaPerdidas.total})
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-600 dark:text-gray-400">Carregando orçamentos...</p>
          </div>
        </div>
      )}

      {!loading && activeTab === 'abertas' && (
        <OrcamentosList
          orcamentos={orcamentosAbertos}
          meta={metaAbertas}
          page={pageAbertas}
          onPageChange={setPageAbertas}
          onVerDetalhes={setViewingOrcamentoId}
          onEdit={setEditingOrcamentoId}
          tab="abertas"
          onDownloadPdf={handleDownloadOrcamentoPdf}
          downloadingPdfById={downloadingPdfById}
          onTransformarEmPedido={handleTransformarEmPedido}
          creatingPedidoById={creatingPedidoById}
          onShowCreateModal={() => setShowCreateModal(true)}
          onDuplicar={setDuplicandoOrcamentoId}
          onCancelar={setCancelandoOrcamentoId}
        />
      )}

      {!loading && activeTab === 'canceladas' && (
        <OrcamentosList
          orcamentos={historicoPerdidas}
          meta={metaPerdidas}
          page={pagePerdidas}
          onPageChange={setPagePerdidas}
          onVerDetalhes={setViewingOrcamentoId}
          onEdit={setEditingOrcamentoId}
          tab="canceladas"
          onReturnToPipeline={handleReturnToPipeline}
        />
      )}

      {showCreateModal && (
        <CreateOrcamentoDrawer
          onClose={() => {
            clearOrcamentoPrefillParams()
            setPrefillPerson(null)
            setShowCreateModal(false)
          }}
          onCreated={handleOrcamentoCreated}
          initialPerson={prefillPerson}
        />
      )}

      {editingOrcamentoId && (
        <EditOrcamentoDrawer
          oportunidadeId={editingOrcamentoId}
          onClose={() => setEditingOrcamentoId(null)}
          onSaved={handleOrcamentoEdited}
        />
      )}

      {viewingOrcamentoId && (
        <VerOrcamentoDrawer
          oportunidadeId={viewingOrcamentoId}
          onClose={() => setViewingOrcamentoId(null)}
        />
      )}

      {duplicandoOrcamentoId && (
        <DuplicarOrcamentoDrawer
          oportunidadeId={duplicandoOrcamentoId}
          onClose={() => setDuplicandoOrcamentoId(null)}
          onDuplicated={handleOrcamentoDuplicated}
        />
      )}

      <CancelarOrcamentoModal
        open={Boolean(cancelandoOrcamentoId)}
        onConfirm={async (motivo) => {
          if (cancelandoOrcamentoId) {
            await handleCancelarOrcamento(cancelandoOrcamentoId, motivo)
            setCancelandoOrcamentoId(null)
          }
        }}
        onCancel={() => setCancelandoOrcamentoId(null)}
        loading={cancelandoLoading}
      />
    </div>
  )
}

export default function OrcamentosPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
          Carregando orcamentos...
        </div>
      }
    >
      <OrcamentosPageContent />
    </Suspense>
  )
}
