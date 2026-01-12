'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  TarefasHeader,
  TarefasTabs,
  TarefasFilters,
  TarefasGrid,
  TarefasEmptyState,
  type Tarefa,
  type TabType,
} from '@/components/features/tarefas'

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
      <TarefasHeader />

      <TarefasTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendentesCount={tarefasPendentes.length}
        concluidasCount={tarefasConcluidas.length}
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
        <TarefasEmptyState activeTab={activeTab} />
      ) : (
        <TarefasGrid
          tarefas={tarefasExibidas}
          activeTab={activeTab}
          atualizandoTarefa={atualizandoTarefa}
          onVoltarParaPendente={voltarTarefaParaPendente}
        />
      )}
    </div>
  )
}
