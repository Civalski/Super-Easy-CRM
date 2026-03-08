'use client'

import { useEffect, useState } from 'react'
import { UserCheck, Loader2, X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import { MODAL_INPUT_CLASS } from './constants'

interface CreateFuncionarioDrawerProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function CreateFuncionarioDrawer({ open, onClose, onCreated }: CreateFuncionarioDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    cargo: '',
    departamento: '',
    email: '',
    telefone: '',
    documento: '',
    observacoes: '',
  })

  useEffect(() => {
    if (!open) setForm({ nome: '', cargo: '', departamento: '', email: '', telefone: '', documento: '', observacoes: '' })
  }, [open])

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/financeiro/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar funcionario')
      onCreated()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cadastrar Funcionario</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Preencha os dados do novo funcionario</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Nome *</span>
            <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} required className={MODAL_INPUT_CLASS} placeholder="Nome do funcionario" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Cargo</span>
              <input type="text" value={form.cargo} onChange={(e) => set('cargo', e.target.value)} className={MODAL_INPUT_CLASS} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Departamento</span>
              <input type="text" value={form.departamento} onChange={(e) => set('departamento', e.target.value)} className={MODAL_INPUT_CLASS} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Email</span>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={MODAL_INPUT_CLASS} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Telefone</span>
              <input type="text" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} className={MODAL_INPUT_CLASS} />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Documento (CPF)</span>
            <input type="text" value={form.documento} onChange={(e) => set('documento', e.target.value)} className={MODAL_INPUT_CLASS} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">Observacoes</span>
            <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} className={MODAL_INPUT_CLASS + ' resize-none'} />
          </label>
          <footer className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cadastrar
            </button>
          </footer>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
