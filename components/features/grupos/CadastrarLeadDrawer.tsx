'use client'

import { useState, useCallback } from 'react'
import { Loader2, X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import { toast } from '@/lib/toast'

export interface CadastrarLeadDrawerProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

export function CadastrarLeadDrawer({ open, onClose, onCreated }: CadastrarLeadDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    telefone: '',
    email: '',
    municipio: '',
    uf: '',
    observacoes: '',
  })

  const handleChange = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const razaoSocial = form.razaoSocial.trim()
    if (!razaoSocial) {
      toast.error('Nome obrigatório', { description: 'Informe o nome ou razão social do lead.' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/prospectos/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razaoSocial,
          nomeFantasia: form.nomeFantasia.trim() || undefined,
          telefone: form.telefone.trim() || undefined,
          email: form.email.trim() || undefined,
          municipio: form.municipio.trim() || undefined,
          uf: form.uf.trim().toUpperCase().slice(0, 2) || undefined,
          observacoes: form.observacoes.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar lead')
      }

      toast.success('Lead cadastrado!', {
        description: 'O lead foi adicionado ao funil na etapa "Sem contato".',
      })
      setForm({
        razaoSocial: '',
        nomeFantasia: '',
        telefone: '',
        email: '',
        municipio: '',
        uf: '',
        observacoes: '',
      })
      onCreated()
      onClose()
    } catch (err) {
      toast.error('Erro', {
        description: err instanceof Error ? err.message : 'Não foi possível cadastrar o lead.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-md">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cadastrar lead</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Leads não são clientes. Um lead só vira cliente ao concluir um pedido.
            </p>
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

        <form id="cadastrar-lead-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="razaoSocial" className={LABEL_CLASS}>
              Nome / Razão social <span className="text-red-500">*</span>
            </label>
            <input
              id="razaoSocial"
              type="text"
              value={form.razaoSocial}
              onChange={(e) => handleChange('razaoSocial', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Nome do contato ou empresa"
              required
            />
          </div>

          <div>
            <label htmlFor="nomeFantasia" className={LABEL_CLASS}>
              Empresa / Nome fantasia
            </label>
            <input
              id="nomeFantasia"
              type="text"
              value={form.nomeFantasia}
              onChange={(e) => handleChange('nomeFantasia', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Nome fantasia da empresa"
            />
          </div>

          <div>
            <label htmlFor="telefone" className={LABEL_CLASS}>
              Telefone
            </label>
            <input
              id="telefone"
              type="tel"
              value={form.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              className={INPUT_CLASS}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={INPUT_CLASS}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="municipio" className={LABEL_CLASS}>
                Município
              </label>
              <input
                id="municipio"
                type="text"
                value={form.municipio}
                onChange={(e) => handleChange('municipio', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Cidade"
              />
            </div>
            <div>
              <label htmlFor="uf" className={LABEL_CLASS}>
                UF
              </label>
              <input
                id="uf"
                type="text"
                value={form.uf}
                onChange={(e) => handleChange('uf', e.target.value.toUpperCase())}
                className={INPUT_CLASS}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label htmlFor="observacoes" className={LABEL_CLASS}>
              Observações
            </label>
            <textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              className={`${INPUT_CLASS} min-h-[80px]`}
              placeholder="Anotações sobre o lead"
              rows={3}
            />
          </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 p-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
