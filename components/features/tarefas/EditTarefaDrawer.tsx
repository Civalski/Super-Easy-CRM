'use client'

import { useEffect, useState, useCallback } from 'react'
import { Save, X, Loader2, Bell } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { SideCreateDrawer } from '@/components/common'

const formatDateInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

interface EditTarefaDrawerProps {
  tarefaId: string
  onClose: () => void
  onSaved: () => void
}

export default function EditTarefaDrawer({ tarefaId, onClose, onSaved }: EditTarefaDrawerProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'pendente',
    prioridade: 'media',
    dataVencimento: '',
    dataAviso: '',
    clienteId: '',
    oportunidadeId: '',
    notificar: false,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [oportunidades, setOportunidades] = useState<{ id: string; titulo: string; numero?: number }[]>([])

  const fetchOportunidadesByCliente = useCallback(async (clienteId: string, oportunidadeIdAtual?: string) => {
    const params = new URLSearchParams({
      status: 'orcamento',
      possuiPedido: 'false',
      clienteId,
      mode: 'options',
      limit: '50',
    })
    const res = await fetch(`/api/oportunidades?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    const opts = list.map((o: { id: string; titulo: string; numero?: number }) => ({
      id: o.id,
      titulo: o.titulo,
      numero: o.numero,
    }))
    if (oportunidadeIdAtual && !opts.some((o) => o.id === oportunidadeIdAtual)) {
      const singleRes = await fetch(`/api/oportunidades/${oportunidadeIdAtual}`)
      if (singleRes.ok) {
        const single = await singleRes.json()
        opts.unshift({ id: single.id, titulo: single.titulo || `#${single.numero || single.id.slice(0, 8)}`, numero: single.numero })
      }
    }
    return opts
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [tarefaRes, clientesRes] = await Promise.all([
          fetch(`/api/tarefas/${tarefaId}`),
          fetch('/api/clientes?mode=options&limit=50'),
        ])

        if (!tarefaRes.ok) throw new Error('Erro ao carregar tarefa')

        const tarefaData = await tarefaRes.json()
        const clientesData = clientesRes.ok ? await clientesRes.json() : []

        if (!active) return

        setFormData({
          titulo: tarefaData.titulo || '',
          descricao: tarefaData.descricao || '',
          status: tarefaData.status || 'pendente',
          prioridade: tarefaData.prioridade || 'media',
          dataVencimento: formatDateInput(tarefaData.dataVencimento),
          dataAviso: formatDateInput(tarefaData.dataAviso),
          clienteId: tarefaData.clienteId || '',
          oportunidadeId: tarefaData.oportunidadeId || '',
          notificar: tarefaData.notificar ?? false,
        })
        setClientes(Array.isArray(clientesData) ? clientesData : [])
        setOportunidades([])
      } catch {
        if (!active) return
        toast.error('Erro', { description: 'Não foi possível carregar a tarefa.' })
        onClose()
      } finally {
        if (active) setLoadingData(false)
      }
    })()
    return () => {
      active = false
    }
  }, [tarefaId, onClose, fetchOportunidadesByCliente])

  useEffect(() => {
    if (!formData.clienteId) {
      setOportunidades([])
      return
    }
    let active = true
    fetchOportunidadesByCliente(formData.clienteId, formData.oportunidadeId).then((opts) => {
      if (active) setOportunidades(opts)
    })
    return () => {
      active = false
    }
  }, [formData.clienteId, formData.oportunidadeId, fetchOportunidadesByCliente])

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClienteId = e.target.value
    setFormData((p) => ({
      ...p,
      clienteId: newClienteId,
      oportunidadeId: '',
    }))
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData((p) => ({ ...p, [e.target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clienteId: formData.clienteId || null,
          oportunidadeId: formData.oportunidadeId || null,
          dataVencimento: formData.dataVencimento || null,
          dataAviso: formData.dataAviso || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Salvo!', { description: 'A tarefa foi atualizada.' })
      onSaved()
    } catch {
      toast.error('Erro', { description: 'Não foi possível salvar a tarefa.' })
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-4xl">
        <div className="flex h-full min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </SideCreateDrawer>
    )
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Tarefa</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Atualize os dados da tarefa
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

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className={LABEL_CLASS}>
              Titulo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="titulo"
              required
              value={formData.titulo}
              onChange={handleChange}
              className={INPUT_CLASS}
              placeholder="Titulo da tarefa"
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Descricao</label>
            <textarea
              name="descricao"
              rows={4}
              value={formData.descricao}
              onChange={handleChange}
              className={INPUT_CLASS}
              placeholder="Descricao detalhada da tarefa"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluida</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Prioridade</label>
              <select
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Data e hora de vencimento</label>
            <input
              type="datetime-local"
              name="dataVencimento"
              value={formData.dataVencimento}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Data e hora do aviso (opcional)</label>
            <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
              Quando deseja ser notificado. Se vazio, usa a data de vencimento.
            </p>
            <input
              type="datetime-local"
              name="dataAviso"
              value={formData.dataAviso}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Cliente (opcional)</label>
              <select
                name="clienteId"
                value={formData.clienteId}
                onChange={handleClienteChange}
                className={INPUT_CLASS}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Orcamento (opcional)
                {formData.clienteId && (
                  <span className="ml-1 font-normal text-gray-500">— em aberto do cliente</span>
                )}
              </label>
              <select
                name="oportunidadeId"
                value={formData.oportunidadeId}
                onChange={handleChange}
                className={INPUT_CLASS}
                disabled={!formData.clienteId}
              >
                <option value="">
                  {formData.clienteId ? 'Selecione um orcamento' : 'Selecione um cliente primeiro'}
                </option>
                {oportunidades.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.numero ? `#${o.numero} — ${o.titulo}` : o.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setFormData((p) => ({ ...p, notificar: !p.notificar }))}
            onKeyDown={(e) =>
              e.key === 'Enter' && setFormData((p) => ({ ...p, notificar: !p.notificar }))
            }
            className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all border ${
              formData.notificar
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  formData.notificar
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                }`}
              >
                <Bell size={20} />
              </div>
              <div>
                <p
                  className={`font-medium ${
                    formData.notificar ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Notificacao no Navegador
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receba um alerta visual quando a tarefa vencer
                </p>
              </div>
            </div>
            <div
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                formData.notificar ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  formData.notificar ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 transition-colors hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
              Salvar Alteracoes
            </button>
          </div>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
