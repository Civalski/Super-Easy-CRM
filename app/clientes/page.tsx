'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from '@/lib/icons'
import { ConfirmDialog } from '@/components/common'
import {
  ClientesHeader,
  ClientesFilters,
  ClientesTable,
  ClientesEmptyState,
  CreateClienteDrawer,
  useClientesPage,
} from '@/components/features/clientes'

type OptionalFilterKey =
  | 'profile'
  | 'topCustomers'
  | 'cidade'
  | 'estado'
  | 'commercialStatus'
  | 'lastPurchaseDays'
  | 'lastContactDays'
  | 'revenueRange'

export default function ClientesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [enabledFilters, setEnabledFilters] = useState<OptionalFilterKey[]>([])
  const [cidadeInput, setCidadeInput] = useState('')
  const [estadoInput, setEstadoInput] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [cidadeFilter, setCidadeFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [commercialStatusFilter, setCommercialStatusFilter] = useState('')
  const [lastPurchaseDaysFilter, setLastPurchaseDaysFilter] = useState('')
  const [lastContactDaysFilter, setLastContactDaysFilter] = useState('')
  const [revenueRangeFilter, setRevenueRangeFilter] = useState('')
  const [topCustomersOnly, setTopCustomersOnly] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchFilter(searchInput.trim())
      setCidadeFilter(cidadeInput.trim())
      setEstadoFilter(estadoInput.trim().toUpperCase())
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput, cidadeInput, estadoInput])

  const queryFilter = useMemo(() => {
    const params: string[] = []
    if (searchFilter) params.push(`search=${encodeURIComponent(searchFilter)}`)
    if (enabledFilters.includes('cidade') && cidadeFilter) params.push(`cidade=${encodeURIComponent(cidadeFilter)}`)
    if (enabledFilters.includes('estado') && estadoFilter) params.push(`estado=${encodeURIComponent(estadoFilter)}`)
    if (enabledFilters.includes('commercialStatus') && commercialStatusFilter) {
      params.push(`commercialStatus=${encodeURIComponent(commercialStatusFilter)}`)
    }
    if (enabledFilters.includes('lastPurchaseDays') && lastPurchaseDaysFilter) {
      params.push(`lastPurchaseDays=${encodeURIComponent(lastPurchaseDaysFilter)}`)
    }
    if (enabledFilters.includes('lastContactDays') && lastContactDaysFilter) {
      params.push(`lastContactDays=${encodeURIComponent(lastContactDaysFilter)}`)
    }
    if (enabledFilters.includes('revenueRange') && revenueRangeFilter) {
      params.push(`revenueRange=${encodeURIComponent(revenueRangeFilter)}`)
    }
    if (enabledFilters.includes('topCustomers') && topCustomersOnly) params.push('topCustomers=true')
    return params.join('&')
  }, [
    cidadeFilter,
    commercialStatusFilter,
    enabledFilters,
    estadoFilter,
    lastContactDaysFilter,
    lastPurchaseDaysFilter,
    revenueRangeFilter,
    searchFilter,
    topCustomersOnly,
  ])

  const {
    clientes,
    loading,
    page,
    profile,
    meta,
    deletingId,
    clienteToDelete,
    showCreateDrawer,
    creating,
    createForm,
    showEditDrawer,
    editForm,
    savingEdit,
    setPage,
    setProfile,
    setClienteToDelete,
    openCreateDrawer,
    closeCreateDrawer,
    openEditDrawer,
    closeEditDrawer,
    handleDeleteCliente,
    handleCreateInputChange,
    handleAddCustomField,
    handleCustomFieldChange,
    handleRemoveCustomField,
    handleCreateCliente,
    handleEditInputChange,
    handleEditCustomFieldChange,
    handleEditAddCustomField,
    handleEditRemoveCustomField,
    handleUpdateCliente,
    backupLoading,
    handleDownloadBackup,
    handleRestoreBackup,
  } = useClientesPage({ queryFilter })

  const hasActiveFilters = Boolean(
    searchFilter ||
      (enabledFilters.includes('profile') && profile) ||
      (enabledFilters.includes('cidade') && cidadeFilter) ||
      (enabledFilters.includes('estado') && estadoFilter) ||
      (enabledFilters.includes('commercialStatus') && commercialStatusFilter) ||
      (enabledFilters.includes('lastPurchaseDays') && lastPurchaseDaysFilter) ||
      (enabledFilters.includes('lastContactDays') && lastContactDaysFilter) ||
      (enabledFilters.includes('revenueRange') && revenueRangeFilter) ||
      (enabledFilters.includes('topCustomers') && topCustomersOnly)
  )

  const toggleEnabledFilter = (key: OptionalFilterKey) => {
    setEnabledFilters((prev) => {
      if (prev.includes(key)) {
        if (key === 'profile') {
          setProfile('')
          setPage(1)
        }
        return prev.filter((item) => item !== key)
      }
      return [...prev, key]
    })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setCidadeInput('')
    setEstadoInput('')
    setSearchFilter('')
    setCidadeFilter('')
    setEstadoFilter('')
    setCommercialStatusFilter('')
    setLastPurchaseDaysFilter('')
    setLastContactDaysFilter('')
    setRevenueRangeFilter('')
    setTopCustomersOnly(false)
    setPage(1)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ClientesHeader
        onCreateClick={openCreateDrawer}
        onFilterClick={() => setFiltersOpen((prev) => !prev)}
        onDownloadBackup={handleDownloadBackup}
        onRestoreBackup={handleRestoreBackup}
        backupLoading={backupLoading}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      <ClientesFilters
        open={filtersOpen}
        searchValue={searchInput}
        profileValue={profile}
        enabledFilters={enabledFilters}
        cidadeValue={cidadeInput}
        estadoValue={estadoInput}
        commercialStatusValue={commercialStatusFilter}
        lastPurchaseDaysValue={lastPurchaseDaysFilter}
        lastContactDaysValue={lastContactDaysFilter}
        revenueRangeValue={revenueRangeFilter}
        topCustomersOnly={topCustomersOnly}
        onToggleFilter={toggleEnabledFilter}
        onClose={() => setFiltersOpen(false)}
        onProfileChange={(value) => {
          setProfile(value)
          setPage(1)
        }}
        onCidadeChange={setCidadeInput}
        onEstadoChange={(value) => setEstadoInput(value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())}
        onCommercialStatusChange={setCommercialStatusFilter}
        onLastPurchaseDaysChange={setLastPurchaseDaysFilter}
        onLastContactDaysChange={setLastContactDaysFilter}
        onRevenueRangeChange={setRevenueRangeFilter}
        onTopCustomersOnlyChange={setTopCustomersOnly}
        onClearFilters={handleClearFilters}
      />

      {clientes.length === 0 ? (
        <ClientesEmptyState
          onCreateClick={openCreateDrawer}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <>
          <ClientesTable
            clientes={clientes}
            deletingId={deletingId}
            onDeleteClick={setClienteToDelete}
            onEditClick={(c) => void openEditDrawer(c.id)}
          />
          {meta.pages > 1 ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
              <span className="text-gray-600 dark:text-gray-300">
                Pagina {meta.page} de {meta.pages} ({meta.total} clientes)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={meta.page >= meta.pages}
                  onClick={() => setPage((prev) => Math.min(meta.pages, prev + 1))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                >
                  Proxima
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={Boolean(clienteToDelete)}
        title="Excluir cliente"
        description={
          clienteToDelete
            ? `Deseja realmente excluir ${clienteToDelete.nome}? Esta acao nao pode ser desfeita.`
            : undefined
        }
        confirmLabel="Sim, excluir"
        confirmVariant="danger"
        confirmLoading={clienteToDelete ? deletingId === clienteToDelete.id : false}
        onCancel={() => {
          if (clienteToDelete && deletingId === clienteToDelete.id) return
          setClienteToDelete(null)
        }}
        onConfirm={() => {
          if (clienteToDelete) {
            handleDeleteCliente(clienteToDelete.id)
          }
        }}
      />

      <CreateClienteDrawer
        open={showCreateDrawer}
        creating={creating}
        form={createForm}
        onClose={closeCreateDrawer}
        onSubmit={handleCreateCliente}
        onInputChange={handleCreateInputChange}
        onAddCustomField={handleAddCustomField}
        onCustomFieldChange={handleCustomFieldChange}
        onRemoveCustomField={handleRemoveCustomField}
      />

      <CreateClienteDrawer
        open={showEditDrawer}
        creating={savingEdit}
        mode="edit"
        form={editForm}
        onClose={closeEditDrawer}
        onSubmit={handleUpdateCliente}
        onInputChange={handleEditInputChange}
        onAddCustomField={handleEditAddCustomField}
        onCustomFieldChange={handleEditCustomFieldChange}
        onRemoveCustomField={handleEditRemoveCustomField}
      />
    </div>
  )
}
