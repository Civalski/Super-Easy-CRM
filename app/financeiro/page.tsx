'use client'

import { useState } from 'react'
import { ChevronDown, Building2, Eye, PlusCircle, UserCheck, Wallet } from '@/lib/icons'
import { formatCurrency } from '@/lib/format'
import { toast } from '@/lib/toast'
import {
  FluxoCaixaSection,
  ContasList,
  CreateContaModal,
  EditContaModal,
  CreateFornecedorDrawer,
  CreateFuncionarioDrawer,
  EntidadesListDrawer,
  useFinanceiro,
} from '@/components/features/financeiro'
import { AMBIENTE_LABEL } from '@/components/features/financeiro/constants'

export default function FinanceiroPage() {
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [showFuncionarioModal, setShowFuncionarioModal] = useState(false)
  const [showEntidadesList, setShowEntidadesList] = useState(false)
  const [cadastroDropdownOpen, setCadastroDropdownOpen] = useState(false)

  const {
    loading, stats, fluxo, meta, page, setPage,
    activeAmbiente, setActiveAmbiente, activeTipo, setActiveTipo,
    gruposContas, expandedGrupos, toggleGrupoExpansao,
    showCreateModal, setShowCreateModal, saving, createForm, setCreateForm, handleCreateConta, resetCreateForm,
    showEditModal, setShowEditModal, editSaving, editingConta, setEditingConta, editForm, setEditForm, handleEditConta, handleOpenEditConta,
    handleRegistrarMovimento, handleAcrescentarTaxa, handleAplicarMulta, handleGerarLembrete, refreshAll,
  } = useFinanceiro()

  const handleFornecedorCreated = () => {
    toast.success('Fornecedor cadastrado')
    refreshAll?.()
  }

  const handleFuncionarioCreated = () => {
    toast.success('Funcionario cadastrado')
    refreshAll?.()
  }

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setCreateForm((prev) => ({ ...prev, ambiente: activeAmbiente })); setShowCreateModal(true) }}
            disabled={saving}
            className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Conta
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCadastroDropdownOpen((o) => !o)}
              className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cadastrar
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            {cadastroDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCadastroDropdownOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-lg py-1">
                  <button
                    type="button"
                    onClick={() => { setShowEntidadesList(true); setCadastroDropdownOpen(false) }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar cadastros
                  </button>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={() => { setShowFornecedorModal(true); setCadastroDropdownOpen(false) }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <Building2 className="h-4 w-4" />
                    Cadastrar Fornecedor
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowFuncionarioModal(true); setCadastroDropdownOpen(false) }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <UserCheck className="h-4 w-4" />
                    Cadastrar Funcionário
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
          onAcrescentarTaxa={handleAcrescentarTaxa}
          onAplicarMulta={handleAplicarMulta}
          onGerarLembrete={handleGerarLembrete}
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

      <CreateFornecedorDrawer
        open={showFornecedorModal}
        onClose={() => setShowFornecedorModal(false)}
        onCreated={handleFornecedorCreated}
      />
      <CreateFuncionarioDrawer
        open={showFuncionarioModal}
        onClose={() => setShowFuncionarioModal(false)}
        onCreated={handleFuncionarioCreated}
      />
      <EntidadesListDrawer
        open={showEntidadesList}
        onClose={() => setShowEntidadesList(false)}
        onOpenCreateConta={(tipo, id, _nome, contaTipo) => {
          setShowEntidadesList(false)
          setCreateForm((prev) => ({
            ...prev,
            ambiente: activeAmbiente,
            tipo: contaTipo,
            tipoVinculo: tipo,
            entidadeId: id,
          }))
          setShowCreateModal(true)
        }}
      />
    </div>
  )
}
