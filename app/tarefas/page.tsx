'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import { Plus, Calendar, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  dataVencimento: Date | null
  clienteId: string | null
  oportunidadeId: string | null
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

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)

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
      // Converter strings de data para objetos Date
      const tarefasComData = data.map((tarefa: any) => ({
        ...tarefa,
        dataVencimento: tarefa.dataVencimento ? new Date(tarefa.dataVencimento) : null,
      }))
      setTarefas(tarefasComData)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
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

      {tarefas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma tarefa cadastrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece criando sua primeira tarefa.
          </p>
          <Link href="/tarefas/nova">
            <Button>
              <Plus size={20} className="mr-2" />
              Criar Tarefa
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tarefas.map((tarefa) => {
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

