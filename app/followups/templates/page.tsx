'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { ArrowLeft, Loader2, MessageSquareText, Plus, Save, Trash2 } from 'lucide-react'

interface FollowUpTemplate {
  id: string
  etapa: string
  canal: string
  titulo: string | null
  mensagem: string
  ativo: boolean
  updatedAt?: string
}

interface TemplateDraft {
  etapa: string
  canal: string
  titulo: string
  mensagem: string
  ativo: boolean
}

const STAGE_OPTIONS = [
  { value: 'sem_contato', label: 'Sem contato' },
  { value: 'em_potencial', label: 'Em potencial' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'fechada', label: 'Fechada' },
  { value: 'perdida', label: 'Perdida' },
]

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'ligacao', label: 'Ligacao' },
  { value: 'reuniao', label: 'Reuniao' },
]

const toDraft = (template: FollowUpTemplate): TemplateDraft => ({
  etapa: template.etapa,
  canal: template.canal,
  titulo: template.titulo || '',
  mensagem: template.mensagem || '',
  ativo: template.ativo,
})

export default function FollowupsTemplatesPage() {
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([])
  const [drafts, setDrafts] = useState<Record<string, TemplateDraft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [createForm, setCreateForm] = useState<TemplateDraft>({
    etapa: 'em_potencial',
    canal: 'whatsapp',
    titulo: '',
    mensagem: '',
    ativo: true,
  })

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/followups/templates')
      const data = await res.json().catch(() => [])
      const items = Array.isArray(data) ? data : []
      setTemplates(items)
      setDrafts(
        items.reduce<Record<string, TemplateDraft>>((acc, item) => {
          acc[item.id] = toDraft(item)
          return acc
        }, {})
      )
    } catch {
      setTemplates([])
      setDrafts({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const stats = useMemo(() => {
    const total = templates.length
    const ativos = templates.filter((item) => item.ativo).length
    const porWhatsapp = templates.filter((item) => item.canal === 'whatsapp').length
    return { total, ativos, porWhatsapp }
  }, [templates])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!createForm.mensagem.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Mensagem obrigatoria' })
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/followups/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapa: createForm.etapa,
          canal: createForm.canal,
          titulo: createForm.titulo.trim() || null,
          mensagem: createForm.mensagem.trim(),
          ativo: createForm.ativo,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar template')
      setCreateForm({
        etapa: createForm.etapa,
        canal: createForm.canal,
        titulo: '',
        mensagem: '',
        ativo: true,
      })
      await fetchTemplates()
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao criar template.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDraftChange = (
    templateId: string,
    field: keyof TemplateDraft,
    value: string | boolean
  ) => {
    setDrafts((prev) => {
      const current = prev[templateId]
      if (!current) return prev
      return {
        ...prev,
        [templateId]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  const handleSaveTemplate = async (templateId: string) => {
    const draft = drafts[templateId]
    if (!draft) return
    if (!draft.mensagem.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Mensagem obrigatoria' })
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/followups/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: templateId,
          etapa: draft.etapa,
          canal: draft.canal,
          titulo: draft.titulo.trim() || null,
          mensagem: draft.mensagem.trim(),
          ativo: draft.ativo,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar template')

      setTemplates((prev) => prev.map((item) => (item.id === templateId ? data : item)))
      setDrafts((prev) => ({ ...prev, [templateId]: toDraft(data) }))
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao salvar template.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (template: FollowUpTemplate) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Excluir template?',
      text: template.titulo || template.mensagem.slice(0, 60),
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
    })
    if (!confirm.isConfirmed) return

    try {
      setSaving(true)
      const res = await fetch(`/api/followups/templates?id=${template.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir template')

      setTemplates((prev) => prev.filter((item) => item.id !== template.id))
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[template.id]
        return next
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao excluir template.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/oportunidades"
          className="mb-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para orçamentos
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 p-2.5 shadow-lg shadow-indigo-500/20">
            <MessageSquareText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates de Follow-up</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mensagens padrao por etapa e canal
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ativos</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.ativos}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.porWhatsapp}</p>
        </div>
      </div>

      <div className="crm-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Novo template</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-2 md:grid-cols-12">
          <select
            value={createForm.etapa}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, etapa: event.target.value }))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-2 dark:border-gray-600 dark:bg-gray-800"
          >
            {STAGE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={createForm.canal}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, canal: event.target.value }))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-2 dark:border-gray-600 dark:bg-gray-800"
          >
            {CHANNEL_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={createForm.titulo}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, titulo: event.target.value }))}
            placeholder="Titulo (opcional)"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-3 dark:border-gray-600 dark:bg-gray-800"
          />
          <textarea
            value={createForm.mensagem}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, mensagem: event.target.value }))
            }
            placeholder="Mensagem do follow-up"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-4 dark:border-gray-600 dark:bg-gray-800"
            rows={1}
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-sm px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60 md:col-span-1"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <div className="crm-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Templates</h2>

        {loading && (
          <div className="flex min-h-[140px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && templates.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum template cadastrado.</p>
        )}

        {!loading && templates.length > 0 && (
          <div className="space-y-2">
            {templates.map((template) => {
              const draft = drafts[template.id]
              if (!draft) return null

              return (
                <div
                  key={template.id}
                  className="rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                >
                  <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-12">
                    <select
                      value={draft.etapa}
                      onChange={(event) =>
                        handleDraftChange(template.id, 'etapa', event.target.value)
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs md:col-span-2 dark:border-gray-600 dark:bg-gray-800"
                    >
                      {STAGE_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draft.canal}
                      onChange={(event) =>
                        handleDraftChange(template.id, 'canal', event.target.value)
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs md:col-span-2 dark:border-gray-600 dark:bg-gray-800"
                    >
                      {CHANNEL_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={draft.titulo}
                      onChange={(event) =>
                        handleDraftChange(template.id, 'titulo', event.target.value)
                      }
                      placeholder="Titulo"
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs md:col-span-3 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 md:col-span-2 dark:border-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={draft.ativo}
                        onChange={(event) =>
                          handleDraftChange(template.id, 'ativo', event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      Ativo
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSaveTemplate(template.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-purple-400 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 md:col-span-2"
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 md:col-span-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={draft.mensagem}
                    onChange={(event) =>
                      handleDraftChange(template.id, 'mensagem', event.target.value)
                    }
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-800"
                    placeholder="Mensagem do template"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

