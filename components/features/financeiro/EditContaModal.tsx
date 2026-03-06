'use client'

import { Loader2, X } from '@/lib/icons'
import type { AmbienteFinanceiro, ContaFinanceira, EditContaForm } from './types'
import { MODAL_INPUT_CLASS } from './constants'

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
  if (!open) return null

  const set = <K extends keyof EditContaForm>(key: K, value: EditContaForm[K]) =>
    onFormChange(prev => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-linear-to-b from-slate-900 to-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Editar Conta</h2>
            {conta.recorrenteMensal && (
              <p className="text-xs text-cyan-300/80 mt-0.5">Conta com recorrência mensal</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-3 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Ambiente</span>
              <select value={form.ambiente} onChange={e => set('ambiente', e.target.value as AmbienteFinanceiro)} className={INPUT_FOCUS}>
                <option value="geral">Geral</option>
                <option value="pessoal">Pessoal</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Tipo</span>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'receber' | 'pagar')} className={INPUT_FOCUS}>
                <option value="receber">A receber</option>
                <option value="pagar">A pagar</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Valor</span>
              <input type="text" inputMode="decimal" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} className={INPUT_FOCUS} />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Descrição</span>
            <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} className={INPUT_FOCUS} />
          </label>

          <div className="grid grid-cols-2 gap-4 items-end">
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Vencimento</span>
              <input type="date" value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} className={INPUT_FOCUS} />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer pb-2.5">
              <input type="checkbox" checked={form.autoDebito} onChange={e => set('autoDebito', e.target.checked)} className="rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30" />
              Débito automático
            </label>
          </div>

          {conta.recorrenteMensal && (
            <div className="space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-4">
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input type="checkbox" checked={form.aplicarNoGrupoRecorrente} onChange={e => set('aplicarNoGrupoRecorrente', e.target.checked)} className="rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30" />
                Aplicar alterações ao grupo recorrente
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input type="checkbox" checked={form.recorrenciaAtiva} onChange={e => set('recorrenciaAtiva', e.target.checked)} className="rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30" />
                Manter recorrência ativa
              </label>
            </div>
          )}

          <footer className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition">
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
