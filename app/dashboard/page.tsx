'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DashboardHeader,
  DashboardStatsGrid,
  DashboardGoals,
  OportunidadesChart,
  ValorPipelineChart,
  TarefasStatusChart,
  AtividadesRecentes,
  DashboardLoading,
  FluxoCaixaResumo,
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
  tarefasPorStatus: Array<{
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
  | 'PROSPECCAO'
  | 'FATURAMENTO'
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  target: number
  current?: number
  progress?: number
  periodStart?: string
  periodEnd?: string
  active?: boolean
}

interface FluxoSerie {
  month: string
  recebido: number
  saida: number
  previstoReceber: number
  previstoPagar: number
  saldoProjetado: number
}

interface FluxoData {
  totals: {
    recebido: number
    saida: number
    previstoReceber: number
    previstoPagar: number
    saldoProjetado: number
  }
  series: FluxoSerie[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [goals, setGoals] = useState<GoalSummary[]>([])
  const [fluxo, setFluxo] = useState<FluxoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateFilter, setDateFilter] = useState<'day' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setGoalsLoading(true)

      const dateParam = selectedDate.toISOString()

      const [dashboardResponse, goalsResponse, fluxoResponse] = await Promise.all([
        fetch(`/api/dashboard?filter=${dateFilter}&date=${dateParam}`, { credentials: 'include' }),
        fetch('/api/metas', { credentials: 'include' }),
        fetch('/api/financeiro/fluxo-caixa?months=6', { credentials: 'include' }),
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

      if (fluxoResponse.ok) {
        const fluxoData = await fluxoResponse.json()
        setFluxo(fluxoData && typeof fluxoData === 'object' ? fluxoData : null)
      } else {
        setFluxo(null)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
      setFluxo(null)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      setGoalsLoading(false)
    }
  }, [dateFilter, selectedDate])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])



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

      <div className="mb-6">
        <FluxoCaixaResumo fluxo={fluxo} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <OportunidadesChart
          data={data.oportunidadesPorStatus}
          totalOportunidades={data.oportunidadesCount}
        />
        <ValorPipelineChart
          valorTotal={data.valorTotal}
          valorGanhos={data.valorGanhos}
          valorPerdidos={data.valorPerdidos}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TarefasStatusChart
          tarefasPorStatus={data.tarefasPorStatus}
          oportunidadesCount={data.oportunidadesCount}
        />
        <AtividadesRecentes refreshTrigger={lastUpdate} onRefreshRequest={fetchDashboardData} />
      </div>
    </div>
  )
}
