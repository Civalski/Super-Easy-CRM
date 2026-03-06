'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, PlusCircle, Sparkles, X } from '@/lib/icons'
import type { AmbienteFinanceiro, CreateContaForm } from './types'
import { MODAL_INPUT_CLASS } from './constants'

interface CreateContaModalProps {
  open: boolean
  onClose: () => void
  saving: boolean
  form: CreateContaForm
  onFormChange: React.Dispatch<React.SetStateAction<CreateContaForm>>
  onSubmit: (event: React.FormEvent) => void
}

export default function CreateContaModal({ open, onClose, saving, form, onFormChange, onSubmit }: CreateContaModalProps) {
  const [isDomReady, setIsDomReady] = useState(false)
  useEffect(() => setIsDomReady(true), [])

  if (!isDomReady || !open) return null

  const set = <K extends keyof CreateContaForm>(key: K, value: CreateContaForm[K]) =>
    onFormChange(prev => ({ ...prev, [key]: value }))

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-2xl flex-col bg-linear-to-b from-slate-900 to-slate-950 shadow-2xl animate-in slide-in-from-right">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Nova Conta Financeira</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 p-6">
            <div className="grid grid-cols-3 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Ambiente</span>
                <select value={form.ambiente} onChange={e => set('ambiente', e.target.value as AmbienteFinanceiro)} className={MODAL_INPUT_CLASS}>
                  <option value="geral">Geral</option>
                  <option value="pessoal">Pessoal</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Tipo</span>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'receber' | 'pagar')} className={MODAL_INPUT_CLASS}>
                  <option value="receber">A receber</option>
                  <option value="pagar">A pagar</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Descrição</span>
                <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Aluguel" className={MODAL_INPUT_CLASS} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Valor total</span>
                <input type="text" inputMode="decimal" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} placeholder="0,00" className={MODAL_INPUT_CLASS} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Primeiro vencimento</span>
                <input type="date" value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} className={MODAL_INPUT_CLASS} />
              </label>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input type="checkbox" checked={form.parcelado} onChange={e => set('parcelado', e.target.checked)} className="rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500/30" />
                Parcelado
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input type="checkbox" checked={form.recorrenteMensal} onChange={e => set('recorrenteMensal', e.target.checked)} className="rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500/30" />
                Valor mensal automático
              </label>
              <label className={`flex items-center gap-2 text-sm cursor-pointer ${form.tipo === 'pagar' ? 'text-slate-200' : 'text-slate-500'}`}>
                <input type="checkbox" checked={form.autoDebito} onChange={e => set('autoDebito', e.target.checked)} disabled={form.tipo !== 'pagar'} className="rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500/30 disabled:opacity-40" />
                Débito automático
              </label>
            </div>

            {form.recorrenteMensal && (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-200">
                O sistema criará automaticamente uma nova conta todo mês com o mesmo valor e descrição, usando o dia do vencimento informado.
              </div>
            )}

            {form.parcelado && (
              <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Nº de parcelas</span>
                    <input type="number" min="2" value={form.parcelas} onChange={e => set('parcelas', e.target.value)} className={MODAL_INPUT_CLASS} />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Intervalo (dias)</span>
                    <input type="number" min="1" value={form.intervaloDias} onChange={e => set('intervaloDias', e.target.value)} className={MODAL_INPUT_CLASS} />
                  </label>
                </div>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Datas específicas (opcional)</span>
                  <textarea value={form.datasParcelas} onChange={e => set('datasParcelas', e.target.value)} rows={3} placeholder="Uma data por linha: 2025-02-10&#10;2025-03-10" className={MODAL_INPUT_CLASS + ' resize-none'} />
                </label>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition">
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
