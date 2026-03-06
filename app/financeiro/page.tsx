'use client'

import { Loader2, PlusCircle, Wallet } from '@/lib/icons'
import { formatCurrency } from '@/lib/format'
import {
  FluxoCaixaSection,
  ContasList,
  CreateContaModal,
  EditContaModal,
  useFinanceiro,
} from '@/components/features/financeiro'
import { AMBIENTE_LABEL } from '@/components/features/financeiro/constants'

export default function FinanceiroPage() {
  const {
    loading, stats, fluxo, meta, page, setPage,
    activeAmbiente, setActiveAmbiente, activeTipo, setActiveTipo,
    gruposContas, expandedGrupos, toggleGrupoExpansao,
    showCreateModal, setShowCreateModal, saving, createForm, setCreateForm, handleCreateConta, resetCreateForm,
    showEditModal, setShowEditModal, editSaving, editingConta, setEditingConta, editForm, setEditForm, handleEditConta, handleOpenEditConta,
    handleRegistrarMovimento,
  } = useFinanceiro()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-purple-700 to-fuchsia-700 p-2.5 shadow-lg shadow-purple-900/35">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contas a receber, contas a pagar e previsao de caixa em {AMBIENTE_LABEL[activeAmbiente].toLowerCase()}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setCreateForm((prev) => ({ ...prev, ambiente: activeAmbiente })); setShowCreateModal(true) }}
          disabled={saving}
          className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conta
        </button>
      </div>

      <div className="inline-flex w-fit rounded-lg border border-gray-200 p-1 dark:border-gray-700">
        {(['geral', 'pessoal'] as const).map((amb) => (
          <button
            key={amb}
            type="button"
            onClick={() => { setActiveAmbiente(amb); setPage(1) }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeAmbiente === amb
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {AMBIENTE_LABEL[amb]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total de contas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Contas a receber</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.receber}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Contas a pagar</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.pagar}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Receber em aberto</p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.receberEmAberto)}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pagar em aberto</p>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400">{formatCurrency(stats.pagarEmAberto)}</p>
        </div>
      </div>

      <FluxoCaixaSection fluxo={fluxo} ambienteLabel={AMBIENTE_LABEL[activeAmbiente]} />

      <div className="crm-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Contas - {AMBIENTE_LABEL[activeAmbiente]}
          </h2>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            {(['receber', 'pagar'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => { setActiveTipo(tipo); setPage(1) }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTipo === tipo
                    ? tipo === 'receber'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {tipo === 'receber' ? 'Receber' : 'Pagar'}
              </button>
            ))}
          </div>
        </div>

        <ContasList
          gruposContas={gruposContas}
          meta={meta}
          page={page}
          onPageChange={setPage}
          activeTipo={activeTipo}
          expandedGrupos={expandedGrupos}
          onToggleExpand={toggleGrupoExpansao}
          onRegistrarMovimento={handleRegistrarMovimento}
          onEditConta={handleOpenEditConta}
          loading={loading}
        />
      </div>

      <CreateContaModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreateForm() }}
        saving={saving}
        form={createForm}
        onFormChange={setCreateForm}
        onSubmit={handleCreateConta}
      />

      {showEditModal && editingConta && (
        <EditContaModal
          open={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingConta(null) }}
          saving={editSaving}
          conta={editingConta}
          form={editForm}
          onFormChange={setEditForm}
          onSubmit={handleEditConta}
        />
      )}
    </div>
  )
}
