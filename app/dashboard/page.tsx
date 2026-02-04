'use client'

import { useEffect, useState } from 'react'
import {
  DashboardHeader,
  DashboardStatsGrid,
  DashboardGoals,
  OportunidadesChart,
  AtividadesRecentes,
  DashboardLoading,
} from '@/components/features/dashboard'

interface DashboardData {
  clientesCount: number
  oportunidadesCount: number
  tarefasCount: number
  valorTotal: number
  valorGanhos: number
  valorPerdidos: number
  oportunidadesPorStatus: Array<{
    status: string
    _count: number
  }>
}

interface GoalSummary {
  id: string
  title: string
  metricType:
    | 'CLIENTES_CONTATADOS'
    | 'PROPOSTAS'
    | 'CLIENTES_CADASTRADOS'
    | 'VENDAS'
    | 'QUALIFICACAO'
    | 'NEGOCIACAO'
    | 'PROSPECCAO'
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  target: number
  current?: number
  progress?: number
  periodStart?: string
  periodEnd?: string
  active?: boolean
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [goals, setGoals] = useState<GoalSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true)
      setGoalsLoading(true)
      const [dashboardResponse, goalsResponse] = await Promise.all([
        fetch('/api/dashboard', { credentials: 'include' }),
        fetch('/api/metas', { credentials: 'include' }),
      ])

      if (!dashboardResponse.ok) {
        throw new Error('Erro ao buscar dados do dashboard')
      }
      const dashboardData: DashboardData = await dashboardResponse.json()
      setData(dashboardData)

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(Array.isArray(goalsData) ? goalsData : [])
      } else {
        setGoals([])
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      setGoalsLoading(false)
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
    return <DashboardLoading />
  }

  return (
    <div>
      <DashboardHeader
        isRefreshing={isRefreshing}
        onRefresh={fetchDashboardData}
      />

      <DashboardStatsGrid data={data} />

      <div className="mb-6">
        <DashboardGoals goals={goals} loading={goalsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OportunidadesChart
          data={data.oportunidadesPorStatus}
          totalOportunidades={data.oportunidadesCount}
        />
        <AtividadesRecentes />
      </div>
    </div>
  )
}
