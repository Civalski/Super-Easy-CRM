'use client'

import dynamic from 'next/dynamic'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SideCreateDrawer } from '@/components/common'
import { Bell, Loader2, RefreshCw, Save, X } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import {
  TarefasHeader,
  TarefasTabs,
  TarefasFilters,
  TarefasGrid,
  TarefasEmptyState,
  type Tarefa,
  type TabType,
} from '@/components/features/tarefas'

const EditTarefaDrawer = dynamic(
  () => import('@/components/features/tarefas/EditTarefaDrawer'),
  { ssr: false }
)

interface ClienteOption {
  id: string
  nome: string
}

interface OportunidadeOption {
  id: string
  titulo: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

interface TaskCounts {
  pendentes: number
  concluidas: number
}

const TAREFAS_PAGE_SIZE = 18

const getNowDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function TarefasPageContent() {
  const { confirm } = useConfirm()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: TAREFAS_PAGE_SIZE,
    pages: 1,
  })
  const [counts, setCounts] = useState<TaskCounts>({
    pendentes: 0,
    concluidas: 0,
  })
  const [activeTab, setActiveTab] = useState<TabType>('pendentes')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('')
  const [atualizandoTarefa, setAtualizandoTarefa] = useState<string | null>(null)
  const [excluindoTarefa, setExcluindoTarefa] = useState<string | null>(null)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [editTarefaId, setEditTarefaId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [clientesOptions, setClientesOptions] = useState<ClienteOption[]>([])
  const [oportunidadesOptions, setOportunidadesOptions] = useState<OportunidadeOption[]>([])
  const [createForm, setCreateForm] = useState({
    titulo: '',
    descricao: '',
    status: 'pendente',
    prioridade: 'media',
    dataVencimento: getNowDateTime(),
    clienteId: '',
    oportunidadeId: '',
    notificar: false,
    recorrente: false,
    recorrenciaFrequencia: 'semanal' as 'diaria' | 'semanal' | 'mensal',
    recorrenciaQuantidade: 4,
  })
  const filtrosKey = `${activeTab}|${filtroStatus}|${filtroPrioridade}`
  const lastFiltrosKeyRef = useRef(filtrosKey)

  useEffect(() => {
    const editId = searchParams.get('edit')?.trim()
    if (editId) setEditTarefaId(editId)
  }, [searchParams])

  const fetchTarefas = useCallback(async (targetPage: number) => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        paginated: 'true',
        page: String(targetPage),
        limit: String(TAREFAS_PAGE_SIZE),
      })

      if (activeTab === 'historico') {
        params.set('status', 'concluida')
      } else if (filtroStatus) {
        params.set('status', filtroStatus)
      } else {
        params.set('status', 'pendente,em_andamento')
      }

      if (filtroPrioridade) {
        params.set('prioridade', filtroPrioridade)
      }

      const response = await fetch(`/api/tarefas?${params.toString()}`)
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Erro ao carregar tarefas')
      }

      const list = Array.isArray(payload?.data) ? payload.data : []
      const tarefasComData = list.map((tarefa: Tarefa) => ({
        ...tarefa,
        dataVencimento: tarefa.dataVencimento ? new Date(tarefa.dataVencimento) : null,
        createdAt: new Date(tarefa.createdAt),
        updatedAt: new Date(tarefa.updatedAt),
      }))
      const nextMeta: PaginationMeta = {
        total: Number(payload?.meta?.total || 0),
        page: Number(payload?.meta?.page || targetPage),
        limit: Number(payload?.meta?.limit || TAREFAS_PAGE_SIZE),
        pages: Number(payload?.meta?.pages || 1),
      }

      if (tarefasComData.length === 0 && targetPage > 1 && nextMeta.total > 0) {
        setPage((prev) => Math.max(1, prev - 1))
        return
      }

      setTarefas(tarefasComData)
      setMeta(nextMeta)
      setCounts({
        pendentes: Number(payload?.counts?.pendentes || 0),
        concluidas: Number(payload?.counts?.concluidas || 0),
      })
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      setTarefas([])
      setMeta((prev) => ({ ...prev, total: 0, pages: 1, page: targetPage }))
      setCounts({
        pendentes: 0,
        concluidas: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [activeTab, filtroPrioridade, filtroStatus])

  useEffect(() => {
    if (lastFiltrosKeyRef.current !== filtrosKey) {
      lastFiltrosKeyRef.current = filtrosKey
      if (page !== 1) {
        setPage(1)
        return
      }
    }

    fetchTarefas(page)

    const handleFocus = () => {
      fetchTarefas(page)
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchTarefas, filtrosKey, page])

  const loadCreateOptions = async () => {
    try {
      const [clientesRes, oportunidadesRes] = await Promise.all([
        fetch('/api/clientes?mode=options&limit=50'),
        fetch('/api/oportunidades?mode=options&limit=50'),
      ])

      const [clientesData, oportunidadesData] = await Promise.all([
        clientesRes.json().catch(() => []),
        oportunidadesRes.json().catch(() => []),
      ])

      setClientesOptions(Array.isArray(clientesData) ? clientesData : [])
      setOportunidadesOptions(Array.isArray(oportunidadesData) ? oportunidadesData : [])
    } catch (error) {
      console.error('Erro ao carregar opcoes de criacao de tarefa:', error)
      setClientesOptions([])
      setOportunidadesOptions([])
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      titulo: '',
      descricao: '',
      status: 'pendente',
      prioridade: 'media',
      dataVencimento: getNowDateTime(),
      clienteId: '',
      oportunidadeId: '',
      notificar: false,
      recorrente: false,
      recorrenciaFrequencia: 'semanal',
      recorrenciaQuantidade: 4,
    })
  }

  const getNextVencimento = (base: string, freq: 'diaria' | 'semanal' | 'mensal', offset: number): string => {
    const d = new Date(base)
    if (freq === 'diaria') d.setDate(d.getDate() + offset)
    else if (freq === 'semanal') d.setDate(d.getDate() + offset * 7)
    else d.setMonth(d.getMonth() + offset)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}`
  }

  const openCreateDrawer = () => {
    resetCreateForm()
    setShowCreateDrawer(true)
    loadCreateOptions()
  }

  const handleCreateField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value =
      event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value
    setCreateForm((prev) => ({
      ...prev,
      [event.target.name]: value,
    }))
  }

  const handleCreateTarefa = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)

    try {
      const basePayload = {
        titulo: createForm.titulo,
        descricao: createForm.descricao,
        status: createForm.status,
        prioridade: createForm.prioridade,
        clienteId: createForm.clienteId || null,
        oportunidadeId: createForm.oportunidadeId || null,
        notificar: createForm.notificar,
      }

      const count = createForm.recorrente
        ? Math.min(Math.max(1, createForm.recorrenciaQuantidade), 24)
        : 1

      for (let i = 0; i < count; i++) {
        const dataVencimento = createForm.recorrente
          ? getNextVencimento(
              createForm.dataVencimento || getNowDateTime(),
              createForm.recorrenciaFrequencia,
              i
            )
          : createForm.dataVencimento || null

        const response = await fetch('/api/tarefas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            dataVencimento,
          }),
        })

        const data = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(data?.error || 'Erro ao criar tarefa')
        }
      }

      setShowCreateDrawer(false)
      resetCreateForm()
      setPage(1)
      await fetchTarefas(1)
      if (count > 1) {
        toast.success(`${count} tarefas criadas`, { description: 'Tarefas recorrentes criadas com sucesso.' })
      }
    } catch (error: unknown) {
      toast.error('Erro ao criar tarefa', { description: error instanceof Error ? error.message : 'Erro ao criar tarefa' })
    } finally {
      setCreating(false)
    }
  }

  const voltarTarefaParaPendente = async (tarefaId: string) => {
    setAtualizandoTarefa(tarefaId)
    try {
      const response = await fetch(`/api/tarefas/${tarefaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'pendente' }),
      })

      if (response.ok) {
        await fetchTarefas(page)
      } else {
        const error = await response.json()
        toast.error('Erro ao atualizar', { description: error.error || 'Erro ao atualizar tarefa' })
      }
    } catch (error) {
      console.error('Erro ao voltar tarefa para pendente:', error)
      toast.error('Erro ao atualizar', { description: 'Erro ao atualizar tarefa. Tente novamente.' })
    } finally {
      setAtualizandoTarefa(null)
    }
  }

  const concluirTarefa = async (tarefaId: string) => {
    setAtualizandoTarefa(tarefaId)
    try {
      const response = await fetch(`/api/tarefas/${tarefaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'concluida' }),
      })

      if (response.ok) {
        await fetchTarefas(page)
      } else {
        const error = await response.json()
        toast.error('Erro ao concluir', { description: error.error || 'Erro ao concluir tarefa' })
      }
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error)
      toast.error('Erro ao concluir', { description: 'Erro ao concluir tarefa. Tente novamente.' })
    } finally {
      setAtualizandoTarefa(null)
    }
  }

  const excluirTarefa = async (tarefaId: string) => {
    const ok = await confirm({
      title: 'Excluir tarefa?',
      description: 'Essa acao nao pode ser desfeita.',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })
    if (!ok) return

    setExcluindoTarefa(tarefaId)
    try {
      const response = await fetch(`/api/tarefas/${tarefaId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTarefas(page)
      } else {
        const error = await response.json()
        toast.error('Erro ao excluir', { description: error.error || 'Erro ao excluir tarefa' })
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error('Erro ao excluir', { description: 'Erro ao excluir tarefa. Tente novamente.' })
    } finally {
      setExcluindoTarefa(null)
    }
  }

  const tarefasExibidas =
    activeTab === 'pendentes'
      ? [...tarefas].sort((a, b) => {
          const prioridadeOrder = { alta: 3, media: 2, baixa: 1 }
          const prioridadeDiff =
            (prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] || 2) -
            (prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] || 2)
          if (prioridadeDiff !== 0) return prioridadeDiff

          if (!a.dataVencimento && !b.dataVencimento) return 0
          if (!a.dataVencimento) return 1
          if (!b.dataVencimento) return -1
          return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
        })
      : [...tarefas].sort((a, b) => {
          const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt)
          const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt)
          return dateB.getTime() - dateA.getTime()
        })

  const limparFiltros = () => {
    setFiltroStatus('')
    setFiltroPrioridade('')
    setPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TarefasHeader onCreateClick={openCreateDrawer} />

      <TarefasTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendentesCount={counts.pendentes}
        concluidasCount={counts.concluidas}
        onLimparFiltros={limparFiltros}
      />

      <TarefasFilters
        activeTab={activeTab}
        filtroStatus={filtroStatus}
        filtroPrioridade={filtroPrioridade}
        onFiltroStatusChange={setFiltroStatus}
        onFiltroPrioridadeChange={setFiltroPrioridade}
        onLimparFiltros={limparFiltros}
      />

      {tarefasExibidas.length === 0 ? (
        <TarefasEmptyState activeTab={activeTab} onCreateClick={openCreateDrawer} />
      ) : (
        <TarefasGrid
          tarefas={tarefasExibidas}
          activeTab={activeTab}
          atualizandoTarefa={atualizandoTarefa}
          excluindoTarefa={excluindoTarefa}
          onVoltarParaPendente={voltarTarefaParaPendente}
          onConcluirTarefa={concluirTarefa}
          onExcluirTarefa={excluirTarefa}
          onEditTarefa={(id) => setEditTarefaId(id)}
        />
      )}

      {!loading && meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
          <span className="text-gray-600 dark:text-gray-300">
            Pagina {meta.page} de {meta.pages} ({meta.total} tarefas)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.pages}
              onClick={() => setPage((prev) => Math.min(meta.pages, prev + 1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Proxima
            </button>
          </div>
        </div>
      )}

      {editTarefaId && (
        <EditTarefaDrawer
          tarefaId={editTarefaId}
          onClose={() => {
            setEditTarefaId(null)
            const params = new URLSearchParams(searchParams.toString())
            params.delete('edit')
            const next = params.toString()
            router.replace(next ? `/tarefas?${next}` : '/tarefas')
          }}
          onSaved={() => {
            setEditTarefaId(null)
            const params = new URLSearchParams(searchParams.toString())
            params.delete('edit')
            const next = params.toString()
            router.replace(next ? `/tarefas?${next}` : '/tarefas')
            fetchTarefas(page)
          }}
        />
      )}

      <SideCreateDrawer
        open={showCreateDrawer}
        onClose={() => {
          setShowCreateDrawer(false)
          resetCreateForm()
        }}
        maxWidthClass="max-w-2xl"
      >
        <div className="h-full overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Tarefa</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Preencha os dados da nova tarefa
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateDrawer(false)
                resetCreateForm()
              }}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateTarefa} className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Titulo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titulo"
                required
                value={createForm.titulo}
                onChange={handleCreateField}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Titulo da tarefa"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descricao
              </label>
              <textarea
                name="descricao"
                rows={4}
                value={createForm.descricao}
                onChange={handleCreateField}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Descricao detalhada da tarefa"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  name="status"
                  value={createForm.status}
                  onChange={handleCreateField}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluida</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridade</label>
                <select
                  name="prioridade"
                  value={createForm.prioridade}
                  onChange={handleCreateField}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data e hora de vencimento
              </label>
              <input
                type="datetime-local"
                name="dataVencimento"
                value={createForm.dataVencimento}
                onChange={handleCreateField}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente (opcional)</label>
                <select
                  name="clienteId"
                  value={createForm.clienteId}
                  onChange={handleCreateField}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Selecione um cliente</option>
                  {clientesOptions.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Orcamento (opcional)</label>
                <select
                  name="oportunidadeId"
                  value={createForm.oportunidadeId}
                  onChange={handleCreateField}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Selecione um orcamento</option>
                  {oportunidadesOptions.map((oportunidade) => (
                    <option key={oportunidade.id} value={oportunidade.id}>
                      {oportunidade.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setCreateForm((prev) => ({ ...prev, notificar: !prev.notificar }))}
              onKeyDown={(e) => e.key === 'Enter' && setCreateForm((prev) => ({ ...prev, notificar: !prev.notificar }))}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all border ${
                createForm.notificar
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    createForm.notificar
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}
                >
                  <Bell size={20} />
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      createForm.notificar ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
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
                  createForm.notificar ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    createForm.notificar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setCreateForm((prev) => ({ ...prev, recorrente: !prev.recorrente }))}
              onKeyDown={(e) => e.key === 'Enter' && setCreateForm((prev) => ({ ...prev, recorrente: !prev.recorrente }))}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all border ${
                createForm.recorrente
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    createForm.recorrente
                      ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}
                >
                  <RefreshCw size={20} />
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      createForm.recorrente ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Tarefa recorrente
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Criar varias tarefas com mesma data base, repetindo conforme a frequencia
                  </p>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  createForm.recorrente ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    createForm.recorrente ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>

            {createForm.recorrente && (
              <div className="space-y-3 rounded-xl border border-cyan-200 dark:border-cyan-800/50 bg-cyan-50/50 dark:bg-cyan-950/20 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Frequencia</label>
                    <select
                      value={createForm.recorrenciaFrequencia}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          recorrenciaFrequencia: e.target.value as 'diaria' | 'semanal' | 'mensal',
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="diaria">Diaria</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={createForm.recorrenciaQuantidade}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          recorrenciaQuantidade: Math.min(24, Math.max(1, parseInt(e.target.value, 10) || 1)),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Serao criadas {createForm.recorrenciaQuantidade} tarefas com datas de vencimento
                  {createForm.recorrenciaFrequencia === 'diaria' && ' em dias consecutivos'}
                  {createForm.recorrenciaFrequencia === 'semanal' && ' em dias consecutivos (semana a semana)'}
                  {createForm.recorrenciaFrequencia === 'mensal' && ' em meses consecutivos'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowCreateDrawer(false)
                  resetCreateForm()
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 transition-colors hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                Criar Tarefa
              </button>
            </div>
          </form>
        </div>
      </SideCreateDrawer>
    </div>
  )
}

export default function TarefasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 animate-spin text-blue-600" size={32} />
            <p className="text-gray-600 dark:text-gray-400">Carregando tarefas...</p>
          </div>
        </div>
      }
    >
      <TarefasPageContent />
    </Suspense>
  )
}

