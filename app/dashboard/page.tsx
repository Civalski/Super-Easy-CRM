'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import { Users, Briefcase, Calendar, TrendingUp, RefreshCw } from 'lucide-react'

interface DashboardData {
  clientesCount: number
  oportunidadesCount: number
  tarefasCount: number
  valorTotal: number
  oportunidadesPorStatus: Array<{
    status: string
    _count: number
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do dashboard')
      }
      const dashboardData: DashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Buscar dados iniciais
    fetchDashboardData()

    // Configurar atualização automática a cada 30 segundos
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    // Limpar intervalo ao desmontar o componente
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados do dashboard...</p>
        </div>
      </div>
    )
  }

  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.valorTotal || 0)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do seu negócio
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Clientes"
          value={data.clientesCount}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Oportunidades"
          value={data.oportunidadesCount}
          icon={Briefcase}
          color="green"
        />
        <StatCard
          title="Tarefas"
          value={data.tarefasCount}
          icon={Calendar}
          color="yellow"
        />
        <StatCard
          title="Valor Total"
          value={valorFormatado}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Oportunidades por Status
          </h3>
          <div className="space-y-3">
            {data.oportunidadesPorStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="capitalize text-gray-700 dark:text-gray-300">
                  {item.status.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${data.oportunidadesCount > 0 ? (item._count / data.oportunidadesCount) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white w-8 text-right">
                    {item._count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividades Recentes
          </h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nenhuma atividade recente</p>
          </div>
        </div>
      </div>
    </div>
  )
}

