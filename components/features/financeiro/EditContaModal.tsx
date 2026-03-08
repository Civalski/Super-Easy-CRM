'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from '@/lib/icons'
import { AsyncSelect } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { AmbienteFinanceiro, ContaFinanceira, EditContaForm, TipoVinculoConta } from './types'
import { MODAL_INPUT_CLASS } from './constants'

const TIPO_VINCULO_OPTIONS: { value: TipoVinculoConta; label: string }[] = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'funcionario', label: 'Funcionario' },
]

function getFetchUrl(tipo: TipoVinculoConta): string {
  if (tipo === 'cliente') return '/api/clientes/busca'
  if (tipo === 'fornecedor') return '/api/financeiro/entidades/busca?tipo=fornecedor'
  if (tipo === 'funcionario') return '/api/financeiro/entidades/busca?tipo=funcionario'
  return ''
}

interface EditContaModalProps {
  open: boolean
  onClose: () => void
  saving: boolean
  conta: ContaFinanceira
  form: EditContaForm
  onFormChange: React.Dispatch<React.SetStateAction<EditContaForm>>
  onSubmit: (event: React.FormEvent) => void
}

const INPUT_FOCUS = MODAL_INPUT_CLASS.replace(/focus:border-purple/g, 'focus:border-indigo').replace(/focus:ring-purple/g, 'focus:ring-indigo')

export default function EditContaModal({ open, onClose, saving, conta, form, onFormChange, onSubmit }: EditContaModalProps) {
  const [selectedEntidade, setSelectedEntidade] = useState<AsyncSelectOption | null>(null)

  useEffect(() => {
    if (open && conta) {
      const nome = conta.cliente?.nome || conta.fornecedor?.nome || conta.funcionario?.nome
      const id = conta.cliente?.id || conta.fornecedor?.id || conta.funcionario?.id
      if (nome && id) setSelectedEntidade({ id, nome, tipo: 'cliente' })
      else setSelectedEntidade(null)
    }
  }, [open, conta, conta?.cliente?.nome, conta?.fornecedor?.nome, conta?.funcionario?.nome])

  if (!open) return null

  const set = <K extends keyof EditContaForm>(key: K, value: EditContaForm[K]) =>
    onFormChange(prev => ({ ...prev, [key]: value }))

  const handleEntidadeChange = (opt: AsyncSelectOption | null) => {
    setSelectedEntidade(opt)
    set('entidadeId', opt?.id ?? '')
  }

  const showEntidadeSelect = form.tipoVinculo !== 'nenhum'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Conta</h2>
            {conta.recorrenteMensal && (
              <p className="text-xs text-cyan-600 dark:text-cyan-300/80 mt-0.5">Conta com recorrência mensal</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-3 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Ambiente</span>
              <select value={form.ambiente} onChange={e => set('ambiente', e.target.value as AmbienteFinanceiro)} className={INPUT_FOCUS}>
                <option value="geral">Geral</option>
                <option value="pessoal">Pessoal</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Tipo</span>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'receber' | 'pagar')} className={INPUT_FOCUS}>
                <option value="receber">A receber</option>
                <option value="pagar">A pagar</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Valor</span>
              <input type="text" inputMode="decimal" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} className={INPUT_FOCUS} />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Descrição</span>
            <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} className={INPUT_FOCUS} />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Vinculado a</span>
            <div className="flex flex-wrap gap-3">
              <select value={form.tipoVinculo} onChange={e => { set('tipoVinculo', e.target.value as TipoVinculoConta); set('entidadeId', '') }} className={INPUT_FOCUS + ' w-36'}>
                {TIPO_VINCULO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {showEntidadeSelect && (
                <div className="min-w-[200px] flex-1">
                  <AsyncSelect
                    value={form.entidadeId}
                    initialLabel={selectedEntidade?.nome}
                    onChange={handleEntidadeChange}
                    fetchUrl={getFetchUrl(form.tipoVinculo)}
                    placeholder={form.tipoVinculo === 'cliente' ? 'Buscar cliente...' : form.tipoVinculo === 'fornecedor' ? 'Buscar fornecedor...' : 'Buscar funcionario...'}
                    minQueryLength={1}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Vencimento</span>
              <input type="date" value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} className={INPUT_FOCUS} />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200 cursor-pointer pb-2.5">
              <input type="checkbox" checked={form.autoDebito} onChange={e => set('autoDebito', e.target.checked)} className="rounded border-gray-300 dark:border-white/20 bg-white dark:bg-slate-800 text-indigo-500 focus:ring-indigo-500/30" />
              Débito automático
            </label>
          </div>

          {conta.recorrenteMensal && (
            <div className="space-y-3 rounded-xl border border-cyan-300/60 dark:border-cyan-400/20 bg-cyan-50 dark:bg-cyan-950/20 p-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={form.aplicarNoGrupoRecorrente} onChange={e => set('aplicarNoGrupoRecorrente', e.target.checked)} className="rounded border-gray-300 dark:border-white/20 bg-white dark:bg-slate-800 text-indigo-500 focus:ring-indigo-500/30" />
                Aplicar alterações ao grupo recorrente
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={form.recorrenciaAtiva} onChange={e => set('recorrenciaAtiva', e.target.checked)} className="rounded border-gray-300 dark:border-white/20 bg-white dark:bg-slate-800 text-indigo-500 focus:ring-indigo-500/30" />
                Manter recorrência ativa
              </label>
            </div>
          )}

          <footer className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 dark:border-white/10 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar alterações
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
