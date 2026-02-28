'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock3, Send, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

interface FollowUpTemplate {
  id: string
  etapa: string
  canal: string
  titulo: string | null
  mensagem: string
  ativo: boolean
}

interface FollowUpAttempt {
  id: string
  canal: string
  mensagem: string
  resultado: string | null
  createdAt: string
  template?: {
    id: string
    etapa: string
    canal: string
    titulo: string | null
  } | null
}

interface OportunidadeData {
  id: string
  titulo: string
  status: string
  cliente?: {
    nome: string
  } | null
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

export default function OportunidadeFollowupsPage() {
  const params = useParams()
  const oportunidadeId = typeof params.id === 'string' ? params.id : params.id?.[0]

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [oportunidade, setOportunidade] = useState<OportunidadeData | null>(null)
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([])
  const [attempts, setAttempts] = useState<FollowUpAttempt[]>([])
  const [form, setForm] = useState({
    templateId: '',
    canal: 'whatsapp',
    mensagem: '',
    resultado: '',
  })

  const fetchData = useCallback(async () => {
    if (!oportunidadeId) return

    try {
      setLoading(true)
      const [oppRes, templatesRes, attemptsRes] = await Promise.all([
        fetch(`/api/oportunidades/${oportunidadeId}`),
        fetch('/api/followups/templates'),
        fetch(`/api/oportunidades/${oportunidadeId}/followups`),
      ])

      const oppData = await oppRes.json().catch(() => null)
      const templatesData = await templatesRes.json().catch(() => [])
      const attemptsData = await attemptsRes.json().catch(() => [])

      setOportunidade(oppData && oppData.id ? oppData : null)
      setTemplates(Array.isArray(templatesData) ? templatesData : [])
      setAttempts(Array.isArray(attemptsData) ? attemptsData : [])
    } catch (error) {
      console.error('Erro ao carregar follow-ups:', error)
    } finally {
      setLoading(false)
    }
  }, [oportunidadeId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const activeTemplates = useMemo(
    () =>
      templates.filter((item) => item.ativo && (!oportunidade || item.etapa === oportunidade.status)),
    [templates, oportunidade]
  )

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    setForm((prev) => ({
      ...prev,
      templateId,
      canal: template?.canal || prev.canal,
      mensagem: template?.mensagem || '',
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!oportunidadeId) return
    if (!form.mensagem.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Mensagem obrigatoria' })
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/oportunidades/${oportunidadeId}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: form.templateId || null,
          canal: form.canal,
          mensagem: form.mensagem.trim(),
          resultado: form.resultado.trim() || null,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao registrar follow-up')

      setForm((prev) => ({
        ...prev,
        mensagem: '',
        resultado: '',
      }))

      fetchData()
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao registrar follow-up.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={oportunidadeId ? `/oportunidades/${oportunidadeId}/editar` : '/oportunidades'}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para orçamento
        </Link>
        <div className="mb-3">
          <Link
            href="/followups/templates"
            className="inline-flex items-center rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
          >
            Gerenciar templates globais
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Playbook de Follow-up</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {oportunidade
            ? `${oportunidade.titulo} • Status ${oportunidade.status}`
            : 'Carregando orçamento...'}
        </p>
      </div>

      <div className="crm-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Novo Follow-up</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={form.templateId}
              onChange={(event) => handleTemplateChange(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="">Sem template</option>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.titulo || `${template.etapa} - ${template.canal}`}
                </option>
              ))}
            </select>

            <select
              value={form.canal}
              onChange={(event) => setForm((prev) => ({ ...prev, canal: event.target.value }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="ligacao">Ligacao</option>
              <option value="reuniao">Reuniao</option>
            </select>
          </div>

          <textarea
            rows={4}
            value={form.mensagem}
            onChange={(event) => setForm((prev) => ({ ...prev, mensagem: event.target.value }))}
            placeholder="Mensagem enviada no follow-up..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />

          <input
            type="text"
            value={form.resultado}
            onChange={(event) => setForm((prev) => ({ ...prev, resultado: event.target.value }))}
            placeholder="Resultado (opcional): Ex: sem resposta, retornou com duvida..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-sm px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Registrar Follow-up
          </button>
        </form>
      </div>

      <div className="crm-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Historico</h2>
        </div>

        {loading && (
          <div className="flex min-h-[120px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && attempts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum follow-up registrado ainda.
          </p>
        )}

        {!loading && attempts.length > 0 && (
          <div className="space-y-2">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-lg border border-gray-100 p-3 dark:border-gray-700"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {attempt.canal}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(attempt.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-100">{attempt.mensagem}</p>
                {attempt.resultado && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Resultado: {attempt.resultado}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
