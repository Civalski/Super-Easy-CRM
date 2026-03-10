'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit2, Loader2, Trash2 } from '@/lib/icons'
import { Button, ConfirmDialog } from '@/components/common'
import { CreateClienteDrawer } from '@/components/features/clientes'
import {
  ClienteInfoCards,
  HistoricoComercial,
  ProspectoDados,
  ClienteSidebar,
  useClienteDetalhes,
} from '@/components/features/clientes/detalhes'

function ClienteDetalhesPageContent() {
  const {
    cliente,
    formData,
    loading,
    saving,
    deleting,
    editMode,
    setEditMode,
    error,
    deleteDialogOpen,
    setDeleteDialogOpen,
    fetchCliente,
    handleChange,
    handleCustomFieldChange,
    handleAddCustomField,
    handleRemoveCustomField,
    handleUpdate,
    handleDelete,
    handleCancelEdit,
  } = useClienteDetalhes()

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando cliente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Link
          href="/clientes"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={16} />
          Voltar para Clientes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!editMode && !cliente?.isVirtual && (
            <Button type="button" variant="outline" onClick={() => setEditMode(true)} disabled={!cliente} className="h-9">
              <Edit2 size={16} className="mr-2" />
              Editar Cliente
            </Button>
          )}
          {!editMode && !cliente?.isVirtual && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!cliente || deleting}
              className="h-9"
            >
              {deleting ? 'Excluindo...' : <><Trash2 size={16} className="mr-2" />Excluir Cliente</>}
            </Button>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!cliente ? (
        error ? (
          <div className="crm-card p-8 text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-400">Nao foi possivel carregar os dados do cliente.</p>
            <Button type="button" onClick={() => void fetchCliente()}>Tentar novamente</Button>
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-3">
              <ClienteInfoCards
                cliente={cliente}
              />

              {cliente.prospecto && <ProspectoDados prospecto={cliente.prospecto} />}
            </div>

            <div className="space-y-3 xl:self-start">
              <HistoricoComercial cliente={cliente} />
              <ClienteSidebar cliente={cliente} />
            </div>
          </div>

          <ConfirmDialog
            open={deleteDialogOpen}
            title="Confirmar exclusao"
            description={`Tem certeza que deseja excluir ${cliente?.nome || 'este cliente'}? Esta acao nao podera ser desfeita e removera todos os dados relacionados.${
              (cliente?.historicoComercial?.resumo?.orcamentosEmAberto ?? 0) > 0
                ? ` O(s) ${cliente?.historicoComercial?.resumo?.orcamentosEmAberto ?? 0} orcamento(s) em aberto tambem sera(o) excluido(s).`
                : ''
            }`}
            confirmLabel="Excluir cliente"
            confirmVariant="danger"
            confirmLoading={deleting}
            onCancel={() => {
              if (deleting) return
              setDeleteDialogOpen(false)
            }}
            onConfirm={handleDelete}
          />
        </>
      )}

      {!cliente?.isVirtual && (
        <CreateClienteDrawer
          open={editMode}
          creating={saving}
          mode="edit"
          form={formData}
          onClose={handleCancelEdit}
          onSubmit={handleUpdate}
          onInputChange={handleChange}
          onAddCustomField={handleAddCustomField}
          onCustomFieldChange={handleCustomFieldChange}
          onRemoveCustomField={handleRemoveCustomField}
        />
      )}
    </div>
  )
}

export default function ClienteDetalhesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <ClienteDetalhesPageContent />
    </Suspense>
  )
}
