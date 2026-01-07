'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import { Plus, Calendar, Loader2, CheckCircle2, Clock, AlertCircle, History, RotateCcw, Filter, X } from 'lucide-react'

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  dataVencimento: Date | null
  clienteId: string | null
  oportunidadeId: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

const statusConfig = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900',
  },
  em_andamento: {
    label: 'Em Andamento',
    icon: AlertCircle,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
  },
  concluida: {
    label: 'Concluída',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900',
  },
}

const prioridadeConfig = {
  baixa: {
    label: 'Baixa',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  },
  media: {
    label: 'Média',
    color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  },
  alta: {
    label: 'Alta',
    color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  },
}

type TabType = 'pendentes' | 'historico'

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('pendentes')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('')
  const [atualizandoTarefa, setAtualizandoTarefa] = useState<string | null>(null)

  useEffect(() => {
    fetchTarefas()

    // Recarrega quando a página ganha foco
    const handleFocus = () => {
      fetchTarefas()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchTarefas = async () => {
    try {
      const response = await fetch('/api/tarefas')
      const data = await response.json()

      // Garantir que data seja sempre um array
      if (Array.isArray(data)) {
        // Converter strings de data para objetos Date
        const tarefasComData = data.map((tarefa: any) => ({
          ...tarefa,
          dataVencimento: tarefa.dataVencimento ? new Date(tarefa.dataVencimento) : null,
          createdAt: new Date(tarefa.createdAt),
          updatedAt: new Date(tarefa.updatedAt),
        }))
        setTarefas(tarefasComData)
      } else {
        console.error('API de tarefas retornou dados em formato inesperado:', data)
        setTarefas([])
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      setTarefas([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
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
        await fetchTarefas()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar tarefa')
      }
    } catch (error) {
      console.error('Erro ao voltar tarefa para pendente:', error)
      alert('Erro ao atualizar tarefa. Tente novamente.')
    } finally {
      setAtualizandoTarefa(null)
    }
  }

  // Filtrar tarefas por aba
  const tarefasPendentes = tarefas.filter(
    (t) => t.status === 'pendente' || t.status === 'em_andamento'
  )
  const tarefasConcluidas = tarefas.filter((t) => t.status === 'concluida')

  // Aplicar filtros
  const aplicarFiltros = (lista: Tarefa[]) => {
    let filtradas = [...lista]

    // Aplicar filtro de status apenas na aba pendentes
    if (activeTab === 'pendentes' && filtroStatus) {
      filtradas = filtradas.filter((t) => t.status === filtroStatus)
    }

    if (filtroPrioridade) {
      filtradas = filtradas.filter((t) => t.prioridade === filtroPrioridade)
    }

    return filtradas
  }

  // Ordenar tarefas pendentes por prioridade (alta -> média -> baixa) e depois por data de vencimento
  const tarefasPendentesOrdenadas = aplicarFiltros(tarefasPendentes).sort((a, b) => {
    const prioridadeOrder = { alta: 3, media: 2, baixa: 1 }
    const prioridadeDiff = (prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] || 2) -
      (prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] || 2)
    if (prioridadeDiff !== 0) return prioridadeDiff

    // Se mesma prioridade, ordenar por data de vencimento (mais próximas primeiro)
    if (!a.dataVencimento && !b.dataVencimento) return 0
    if (!a.dataVencimento) return 1
    if (!b.dataVencimento) return -1
    return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
  })

  // Ordenar tarefas concluídas por data de conclusão (mais recentes primeiro)
  const tarefasConcluidasOrdenadas = aplicarFiltros(tarefasConcluidas).sort((a, b) => {
    // Usando updatedAt para refletir quando foi concluída
    const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt)
    const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt)
    return dateB.getTime() - dateA.getTime()
  })

  const tarefasExibidas = activeTab === 'pendentes' ? tarefasPendentesOrdenadas : tarefasConcluidasOrdenadas

  const temFiltrosAtivos = (activeTab === 'pendentes' && filtroStatus !== '') || filtroPrioridade !== ''

  const limparFiltros = () => {
    setFiltroStatus('')
    setFiltroPrioridade('')
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tarefas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas tarefas e atividades
          </p>
        </div>
        <Link href="/tarefas/nova">
          <Button>
            <Plus size={20} className="mr-2" />
            Nova Tarefa
          </Button>
        </Link>
      </div>

      {/* Abas */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab('pendentes')
              limparFiltros()
            }}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'pendentes'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>Pendentes</span>
              {tarefasPendentes.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {tarefasPendentes.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('historico')
              limparFiltros()
            }}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'historico'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <History size={18} />
              <span>Histórico</span>
              {tarefasConcluidas.length > 0 && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {tarefasConcluidas.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros:</span>
          </div>

          {activeTab === 'pendentes' && (
            <div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
              </select>
            </div>
          )}

          <div>
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={16} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {tarefasExibidas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          {activeTab === 'pendentes' ? (
            <>
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma tarefa pendente
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Todas as suas tarefas estão concluídas! Parabéns!
              </p>
              <Link href="/tarefas/nova">
                <Button>
                  <Plus size={20} className="mr-2" />
                  Criar Nova Tarefa
                </Button>
              </Link>
            </>
          ) : (
            <>
              <History size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma tarefa concluída
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                As tarefas concluídas aparecerão aqui.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tarefasExibidas.map((tarefa) => {
            const statusInfo = statusConfig[tarefa.status as keyof typeof statusConfig] || statusConfig.pendente
            const prioridadeInfo = prioridadeConfig[tarefa.prioridade as keyof typeof prioridadeConfig] || prioridadeConfig.media
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={tarefa.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    {tarefa.titulo}
                  </h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${prioridadeInfo.color}`}>
                    {prioridadeInfo.label}
                  </div>
                </div>

                {tarefa.descricao && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {tarefa.descricao}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon size={16} className={statusInfo.color.split(' ')[0]} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Vencimento: {formatDate(tarefa.dataVencimento)}
                    </span>
                  </div>
                </div>

                {activeTab === 'historico' && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => voltarTarefaParaPendente(tarefa.id)}
                      disabled={atualizandoTarefa === tarefa.id}
                      className="w-full"
                    >
                      {atualizandoTarefa === tarefa.id ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} className="mr-2" />
                          Voltar para Pendente
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

