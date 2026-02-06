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
  const [dateFilter, setDateFilter] = useState<'day' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true)
      setGoalsLoading(true)

      const dateParam = selectedDate.toISOString()

      const [dashboardResponse, goalsResponse] = await Promise.all([
        fetch(`/api/dashboard?filter=${dateFilter}&date=${dateParam}`, { credentials: 'include' }),
        fetch('/api/metas', { credentials: 'include' }),
      ])

      if (!dashboardResponse.ok) {
        throw new Error('Erro ao buscar dados do dashboard')
      }
      const dashboardData: DashboardData = await dashboardResponse.json()
      setData(dashboardData)
      setLastUpdate(new Date()) // Trigger refresh for child components

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
    fetchDashboardData()
  }, [dateFilter, selectedDate])



  if (loading || !data) {
    return <DashboardLoading />
  }

  return (
    <div>
      <DashboardHeader
        isRefreshing={isRefreshing}
        onRefresh={fetchDashboardData}
        filterType={dateFilter}
        onFilterChange={setDateFilter}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
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
        <AtividadesRecentes refreshTrigger={lastUpdate} onRefreshRequest={fetchDashboardData} />
      </div>
    </div>
  )
}
