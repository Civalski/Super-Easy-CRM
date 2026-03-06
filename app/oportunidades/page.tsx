'use client'

import dynamic from 'next/dynamic'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Briefcase, DollarSign, FileText, Loader2, Plus, Search } from '@/lib/icons'
import { Button } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { formatCurrency } from '@/lib/format'
import { OrcamentosList, useOrcamentos } from '@/components/features/oportunidades'

const CreateOrcamentoDrawer = dynamic(
  () => import('@/components/features/oportunidades/CreateOrcamentoDrawer'),
  { ssr: false }
)
const EditOrcamentoDrawer = dynamic(
  () => import('@/components/features/oportunidades/EditOrcamentoDrawer'),
  { ssr: false }
)

function OrcamentosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdFilter = searchParams.get('clienteId')?.trim() || ''
  const clienteNomeFilter = searchParams.get('clienteNome') || 'Cliente selecionado'
  const searchFilter = searchParams.get('search')?.trim() || ''
  const hasClienteFilter = clienteIdFilter.length > 0
  const hasSearchFilter = searchFilter.length > 0
  const clienteQuery = hasClienteFilter ? `&clienteId=${encodeURIComponent(clienteIdFilter)}` : ''
  const searchQuery = hasSearchFilter ? `&search=${encodeURIComponent(searchFilter)}` : ''

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOrcamentoId, setEditingOrcamentoId] = useState<string | null>(null)
  const [prefillPerson, setPrefillPerson] = useState<AsyncSelectOption | null>(null)
  const [expandedOrcamentoId, setExpandedOrcamentoId] = useState<string | null>(null)

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
  } = useOrcamentos({ activeTab, clienteQuery, searchQuery })

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

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seus orçamentos comerciais</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {hasSearchFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200">
            Busca: {searchFilter}
          </span>
          <Button size="sm" variant="outline" onClick={clearSearchFilter}>
            Limpar busca
          </Button>
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
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.valorTotal)}</p>
        </div>
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
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
          expandedId={expandedOrcamentoId}
          onToggleExpand={(id) => setExpandedOrcamentoId((prev) => (prev === id ? null : id))}
          onEdit={setEditingOrcamentoId}
          tab="abertas"
          onDownloadPdf={handleDownloadOrcamentoPdf}
          downloadingPdfById={downloadingPdfById}
          onTransformarEmPedido={handleTransformarEmPedido}
          creatingPedidoById={creatingPedidoById}
          onShowCreateModal={() => setShowCreateModal(true)}
        />
      )}

      {!loading && activeTab === 'canceladas' && (
        <OrcamentosList
          orcamentos={historicoPerdidas}
          meta={metaPerdidas}
          page={pagePerdidas}
          onPageChange={setPagePerdidas}
          expandedId={expandedOrcamentoId}
          onToggleExpand={(id) => setExpandedOrcamentoId((prev) => (prev === id ? null : id))}
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
