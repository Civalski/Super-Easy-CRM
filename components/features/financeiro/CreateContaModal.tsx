'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, Layers, Loader2, Percent, PlusCircle, RefreshCw, Sparkles, X } from '@/lib/icons'
import { AsyncSelect } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { AmbienteFinanceiro, CreateContaForm, TipoVinculoConta } from './types'
import { MODAL_INPUT_CLASS } from './constants'
import { formatCurrencyInput } from './utils'

interface CreateContaModalProps {
  open: boolean
  onClose: () => void
  saving: boolean
  form: CreateContaForm
  onFormChange: React.Dispatch<React.SetStateAction<CreateContaForm>>
  onSubmit: (event: React.FormEvent) => void
}

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

export default function CreateContaModal({ open, onClose, saving, form, onFormChange, onSubmit }: CreateContaModalProps) {
  const [isDomReady, setIsDomReady] = useState(false)
  const [selectedEntidade, setSelectedEntidade] = useState<AsyncSelectOption | null>(null)
  useEffect(() => setIsDomReady(true), [])

  useEffect(() => {
    if (!open || form.tipoVinculo === 'nenhum') {
      setSelectedEntidade(null)
    }
  }, [open, form.tipoVinculo])

  if (!isDomReady || !open) return null

  const set = <K extends keyof CreateContaForm>(key: K, value: CreateContaForm[K]) =>
    onFormChange(prev => ({ ...prev, [key]: value }))

  const handleEntidadeChange = (opt: AsyncSelectOption | null) => {
    setSelectedEntidade(opt)
    set('entidadeId', opt?.id ?? '')
  }

  const showEntidadeSelect = form.tipoVinculo !== 'nenhum'

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-2xl flex-col bg-linear-to-b from-white via-slate-50/95 to-slate-100/92 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 text-gray-900 dark:text-slate-100 shadow-2xl animate-in slide-in-from-right">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova Conta Financeira</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 p-6">
            <div className="grid grid-cols-3 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Ambiente</span>
                <select value={form.ambiente} onChange={e => set('ambiente', e.target.value as AmbienteFinanceiro)} className={MODAL_INPUT_CLASS}>
                  <option value="geral">Empresarial</option>
                  <option value="pessoal">Pessoal</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Tipo</span>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'receber' | 'pagar')} className={MODAL_INPUT_CLASS}>
                  <option value="receber">A receber</option>
                  <option value="pagar">A pagar</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Nome da conta <span className="text-red-500">*</span></span>
                <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Aluguel" required className={MODAL_INPUT_CLASS} />
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Vinculado a</span>
              <div className="flex flex-wrap gap-3">
                <select value={form.tipoVinculo} onChange={e => { set('tipoVinculo', e.target.value as TipoVinculoConta); set('entidadeId', '') }} className={MODAL_INPUT_CLASS + ' w-36'}>
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

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Valor total</span>
                <input type="text" inputMode="decimal" value={form.valorTotal} onChange={e => set('valorTotal', formatCurrencyInput(e.target.value))} placeholder="0,00" className={MODAL_INPUT_CLASS} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Primeiro vencimento</span>
                <input type="date" value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} className={MODAL_INPUT_CLASS} />
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Opções</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className={`relative flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${form.parcelado ? 'border-purple-400 bg-purple-50 dark:border-purple-500/60 dark:bg-purple-950/40' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-slate-800/50 dark:hover:border-white/20'}`}>
                  <input type="checkbox" checked={form.parcelado} onChange={e => { const v = e.target.checked; set('parcelado', v); if (v) set('recorrenteMensal', false) }} className="sr-only" />
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${form.parcelado ? 'bg-purple-100 dark:bg-purple-900/60' : 'bg-gray-100 dark:bg-slate-700/50'}`}>
                    <Layers className={`h-4 w-4 ${form.parcelado ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-slate-400'}`} />
                  </div>
                  <span className={`text-sm font-medium ${form.parcelado ? 'text-purple-800 dark:text-purple-200' : 'text-gray-700 dark:text-slate-300'}`}>Parcelado</span>
                </label>
                <label className={`relative flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${form.recorrenteMensal ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-500/60 dark:bg-cyan-950/40' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-slate-800/50 dark:hover:border-white/20'}`}>
                  <input type="checkbox" checked={form.recorrenteMensal} onChange={e => { const v = e.target.checked; set('recorrenteMensal', v); if (v) set('parcelado', false) }} className="sr-only" />
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${form.recorrenteMensal ? 'bg-cyan-100 dark:bg-cyan-900/60' : 'bg-gray-100 dark:bg-slate-700/50'}`}>
                    <RefreshCw className={`h-4 w-4 ${form.recorrenteMensal ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-slate-400'}`} />
                  </div>
                  <span className={`text-sm font-medium ${form.recorrenteMensal ? 'text-cyan-800 dark:text-cyan-200' : 'text-gray-700 dark:text-slate-300'}`}>Mensal automático</span>
                </label>
                <label className={`relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${form.tipo !== 'pagar' ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-white/5 dark:bg-slate-900/50' : form.autoDebito ? 'cursor-pointer border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/40' : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-slate-800/50 dark:hover:border-white/20'}`}>
                  <input type="checkbox" checked={form.autoDebito} onChange={e => set('autoDebito', e.target.checked)} disabled={form.tipo !== 'pagar'} className="sr-only" />
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${form.tipo === 'pagar' && form.autoDebito ? 'bg-emerald-100 dark:bg-emerald-900/60' : 'bg-gray-100 dark:bg-slate-700/50'}`}>
                    <CreditCard className={`h-4 w-4 ${form.tipo === 'pagar' && form.autoDebito ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <span className={`block truncate text-sm font-medium ${form.tipo === 'pagar' && form.autoDebito ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-700 dark:text-slate-300'}`}>Débito automático</span>
                    <span className="block text-[10px] text-gray-500 dark:text-slate-500">apenas a pagar</span>
                  </div>
                </label>
                <label className={`relative flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${form.multaPorAtrasoAtiva ? 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-950/40' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-slate-800/50 dark:hover:border-white/20'}`}>
                  <input type="checkbox" checked={form.multaPorAtrasoAtiva} onChange={e => set('multaPorAtrasoAtiva', e.target.checked)} className="sr-only" />
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${form.multaPorAtrasoAtiva ? 'bg-amber-100 dark:bg-amber-900/60' : 'bg-gray-100 dark:bg-slate-700/50'}`}>
                    <Percent className={`h-4 w-4 ${form.multaPorAtrasoAtiva ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-slate-400'}`} />
                  </div>
                  <span className={`text-sm font-medium ${form.multaPorAtrasoAtiva ? 'text-amber-800 dark:text-amber-200' : 'text-gray-700 dark:text-slate-300'}`}>Multa por atraso</span>
                </label>
              </div>
            </div>

            {form.multaPorAtrasoAtiva && (
              <div className="space-y-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Configurar multa por atraso</span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">Tipo da multa</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                    <label className={`relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${form.multaPorAtrasoTipo === 'percentual' ? 'border-amber-400 bg-amber-100/80 dark:border-amber-500/60 dark:bg-amber-900/40' : 'border-amber-200/70 bg-white/50 hover:border-amber-300 dark:border-amber-800/50 dark:bg-slate-800/30 dark:hover:border-amber-700/60'}`}>
                      <input type="radio" name="multaTipo" checked={form.multaPorAtrasoTipo === 'percentual'} onChange={() => set('multaPorAtrasoTipo', 'percentual')} className="sr-only" />
                      <span className={`text-sm font-medium ${form.multaPorAtrasoTipo === 'percentual' ? 'text-amber-800 dark:text-amber-200' : 'text-gray-700 dark:text-slate-300'}`}>Percentual (%)</span>
                    </label>
                    <label className={`relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${form.multaPorAtrasoTipo === 'valor' ? 'border-amber-400 bg-amber-100/80 dark:border-amber-500/60 dark:bg-amber-900/40' : 'border-amber-200/70 bg-white/50 hover:border-amber-300 dark:border-amber-800/50 dark:bg-slate-800/30 dark:hover:border-amber-700/60'}`}>
                      <input type="radio" name="multaTipo" checked={form.multaPorAtrasoTipo === 'valor'} onChange={() => set('multaPorAtrasoTipo', 'valor')} className="sr-only" />
                      <span className={`text-sm font-medium ${form.multaPorAtrasoTipo === 'valor' ? 'text-amber-800 dark:text-amber-200' : 'text-gray-700 dark:text-slate-300'}`}>Valor fixo (R$)</span>
                    </label>
                  </div>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">Periodo da multa</span>
                  <select value={form.multaPorAtrasoPeriodo} onChange={e => set('multaPorAtrasoPeriodo', e.target.value as 'dia' | 'semana' | 'mes')} className={MODAL_INPUT_CLASS}>
                    <option value="dia">Por dia</option>
                    <option value="semana">Por semana</option>
                    <option value="mes">Por mês</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    {form.multaPorAtrasoTipo === 'percentual' ? 'Percentual da multa' : 'Valor da multa'}
                  </span>
                  <input type="text" inputMode="decimal" value={form.multaPorAtrasoValor} onChange={e => set('multaPorAtrasoValor', form.multaPorAtrasoTipo === 'valor' ? formatCurrencyInput(e.target.value) : e.target.value)}
                    placeholder={form.multaPorAtrasoTipo === 'percentual' ? 'Ex: 2' : '0,00'} className={MODAL_INPUT_CLASS} />
                </label>
              </div>
            )}

            {form.recorrenteMensal && (
              <div className="rounded-xl border border-cyan-300/60 dark:border-cyan-400/20 bg-cyan-50 dark:bg-cyan-950/30 px-4 py-3 text-sm text-cyan-800 dark:text-cyan-200">
                O sistema criará automaticamente uma nova conta todo mês com o mesmo valor e descrição, usando o dia do vencimento informado.
              </div>
            )}

            {form.parcelado && (
              <div className="space-y-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Nº de parcelas</span>
                    <input type="number" min="2" value={form.parcelas} onChange={e => set('parcelas', e.target.value)} className={MODAL_INPUT_CLASS} />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Intervalo (dias)</span>
                    <input type="number" min="1" value={form.intervaloDias} onChange={e => set('intervaloDias', e.target.value)} className={MODAL_INPUT_CLASS} />
                  </label>
                </div>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Datas específicas (opcional)</span>
                  <textarea value={form.datasParcelas} onChange={e => set('datasParcelas', e.target.value)} rows={3} placeholder="Uma data por linha: 2025-02-10&#10;2025-03-10" className={MODAL_INPUT_CLASS + ' resize-none'} />
                </label>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 dark:border-white/10 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 disabled:opacity-50 transition">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Criar conta
            </button>
          </footer>
        </form>
      </aside>
    </div>,
    document.body,
  )
}
