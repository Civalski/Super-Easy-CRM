'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import { SideCreateDrawer } from '@/components/common'
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from '@/lib/icons'

interface Nota {
  id: string
  tipo: string
  titulo: string | null
  descricao: string | null
  conteudo: string
  updatedAt?: string
}

interface NotaDraft {
  tipo: string
  titulo: string
  descricao: string
}

const TIPO_OPTIONS = [
  { value: 'bloco', label: 'Bloco', icon: FileText },
  { value: 'email', label: 'Template Email', icon: Mail },
  { value: 'whatsapp', label: 'Template WhatsApp', icon: MessageSquare },
]

const WHATSAPP_SUBTEMPLATES = [
  {
    value: 'feedback',
    label: 'Mensagem de feedback',
    mensagem: 'Olá! Poderia nos dar um feedback sobre o atendimento?',
  },
  {
    value: 'primeiro_contato',
    label: 'Primeiro contato',
    mensagem: 'Olá! Tudo bem? Gostaríamos de iniciar uma conversa.',
  },
  {
    value: 'consultar_demanda',
    label: 'Consultar demanda',
    mensagem: 'Olá! Estamos consultando sua demanda. Retornaremos em breve.',
  },
]

const toDraft = (nota: Nota): NotaDraft => ({
  tipo: nota.tipo,
  titulo: nota.titulo || '',
  descricao:
    nota.tipo === 'whatsapp' ? nota.conteudo || '' : nota.descricao || nota.conteudo || '',
})

export default function NotasPage() {
  const { confirm } = useConfirm()
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [createForm, setCreateForm] = useState<NotaDraft>({
    tipo: 'bloco',
    titulo: '',
    descricao: '',
  })
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNota, setEditingNota] = useState<Nota | null>(null)
  const [editForm, setEditForm] = useState<NotaDraft>({ tipo: 'bloco', titulo: '', descricao: '' })
  const [whatsappSubmenuOpen, setWhatsappSubmenuOpen] = useState(false)

  const fetchNotas = useCallback(async () => {
    try {
      setLoading(true)
      const url = filtroTipo ? `/api/notas?tipo=${filtroTipo}` : '/api/notas'
      const res = await fetch(url)
      const data = await res.json().catch(() => [])
      const items = Array.isArray(data) ? data : []
      setNotas(items)
    } catch {
      setNotas([])
    } finally {
      setLoading(false)
    }
  }, [filtroTipo])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = () => setOpenMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  useEffect(() => {
    if (!whatsappSubmenuOpen) return
    const handleClickOutside = () => setWhatsappSubmenuOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [whatsappSubmenuOpen])

  useEffect(() => {
    fetchNotas()
  }, [fetchNotas])

  const handleCreateWhatsappTemplate = async (sub: (typeof WHATSAPP_SUBTEMPLATES)[0]) => {
    setWhatsappSubmenuOpen(false)
    try {
      setSaving(true)
      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'whatsapp',
          titulo: sub.label,
          descricao: sub.value,
          conteudo: sub.mensagem,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar nota')
      await fetchNotas()
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao criar nota.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setSaving(true)
      const descricao = createForm.descricao.trim()
      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: createForm.tipo,
          titulo: createForm.titulo.trim() || null,
          descricao: descricao || null,
          conteudo: descricao,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar nota')
      setCreateForm({ tipo: createForm.tipo, titulo: '', descricao: '' })
      await fetchNotas()
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao criar nota.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditOpen = (nota: Nota) => {
    setEditingId(nota.id)
    setEditingNota(nota)
    setEditForm(toDraft(nota))
    setOpenMenuId(null)
  }

  const handleEditSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingId) return

    try {
      setSaving(true)
      const conteudo = editForm.descricao.trim()
      const isWhatsappSubtype =
        editingNota?.tipo === 'whatsapp' &&
        WHATSAPP_SUBTEMPLATES.some((s) => s.value === editingNota?.descricao)
      const descricao = isWhatsappSubtype ? editingNota!.descricao : conteudo || null
      const res = await fetch('/api/notas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          tipo: editForm.tipo,
          titulo: editForm.titulo.trim() || null,
          descricao,
          conteudo,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar nota')
      setNotas((prev) => prev.map((item) => (item.id === editingId ? data : item)))
      setEditingId(null)
      setEditingNota(null)
      await fetchNotas()
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao salvar nota.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (nota: Nota) => {
    const ok = await confirm({
      title: 'Excluir nota?',
      description: nota.titulo || nota.descricao || nota.conteudo?.slice(0, 60),
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })
    if (!ok) return

    try {
      setSaving(true)
      const res = await fetch(`/api/notas?id=${nota.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir nota')
      setNotas((prev) => prev.filter((item) => item.id !== nota.id))
      setOpenMenuId(null)
      if (editingId === nota.id) {
        setEditingId(null)
        setEditingNota(null)
      }
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao excluir nota.',
      })
    } finally {
      setSaving(false)
    }
  }

  const TipoIcon = TIPO_OPTIONS.find((o) => o.value === createForm.tipo)?.icon ?? FileText

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 p-2.5 shadow-lg shadow-indigo-500/20">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Blocos de notas e templates de email ou WhatsApp
            </p>
          </div>
        </div>
      </div>

      <div className="crm-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Nova nota
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TIPO_OPTIONS.filter((o) => o.value !== 'whatsapp').map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setCreateForm((p) => ({ ...p, tipo: opt.value }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                    createForm.tipo === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              )
            })}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setWhatsappSubmenuOpen(!whatsappSubmenuOpen)
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                  whatsappSubmenuOpen
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Template WhatsApp
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {whatsappSubmenuOpen && (
                <div
                  className="absolute left-0 top-full z-10 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {WHATSAPP_SUBTEMPLATES.map((sub) => (
                    <button
                      key={sub.value}
                      type="button"
                      onClick={() => handleCreateWhatsappTemplate(sub)}
                      disabled={saving}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-60"
                    >
                      <span className="font-medium">{sub.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {sub.mensagem}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              type="text"
              value={createForm.titulo}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, titulo: e.target.value }))
              }
              placeholder="Titulo (opcional)"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
            <input
              type="text"
              value={createForm.descricao}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, descricao: e.target.value }))
              }
              placeholder="Descricao (opcional)"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-xs hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Criar
          </button>
        </form>
      </div>

      {editingId && (
        <SideCreateDrawer
          open={!!editingId}
          onClose={() => {
            setEditingId(null)
            setEditingNota(null)
          }}
          maxWidthClass="max-w-md"
        >
          <div className="h-full overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Editar nota
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setEditingNota(null)
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-3.5 w-3.5" />
                Fechar
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Tipo
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIPO_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setEditForm((p) => ({ ...p, tipo: opt.value }))
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                          editForm.tipo === opt.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Titulo
                </label>
                <input
                  type="text"
                  value={editForm.titulo}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, titulo: e.target.value }))
                  }
                  placeholder="Titulo (opcional)"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  {editForm.tipo === 'whatsapp' ? 'Mensagem' : 'Descricao'}
                </label>
                <input
                  type="text"
                  value={editForm.descricao}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, descricao: e.target.value }))
                  }
                  placeholder={
                    editForm.tipo === 'whatsapp'
                      ? 'Mensagem do WhatsApp'
                      : 'Descricao (opcional)'
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-xs hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </SideCreateDrawer>
      )}

      <div className="crm-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Minhas notas
          </h2>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">Todos</option>
            {TIPO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex min-h-[140px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && notas.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma nota cadastrada.
          </p>
        )}

        {!loading && notas.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notas.map((nota) => {
              const TipoIconItem =
                TIPO_OPTIONS.find((o) => o.value === nota.tipo)?.icon ?? FileText

              return (
                <div
                  key={nota.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {nota.titulo ||
                        (nota.tipo === 'whatsapp'
                          ? WHATSAPP_SUBTEMPLATES.find(
                              (s) => s.value === nota.descricao
                            )?.label ?? nota.descricao ?? 'Sem titulo'
                          : nota.descricao) ||
                        'Sem titulo'}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      <TipoIconItem className="h-2.5 w-2.5" />
                      {nota.tipo === 'whatsapp' && nota.descricao
                        ? WHATSAPP_SUBTEMPLATES.find(
                            (s) => s.value === nota.descricao
                          )?.label ?? 'WhatsApp'
                        : TIPO_OPTIONS.find((o) => o.value === nota.tipo)
                            ?.label ?? nota.tipo}
                    </span>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === nota.id ? null : nota.id)
                      }}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Acoes"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === nota.id && (
                      <div
                        className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleEditOpen(nota)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(nota)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
