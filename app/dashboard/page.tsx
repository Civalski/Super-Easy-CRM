'use client'

import { useState } from 'react'
import {
  DashboardHeader,
  DashboardStatsGrid,
  DashboardGoals,
  OportunidadesChart,
  ValorPipelineChart,
  FaturamentoPerdaLineChart,
  TarefasStatusChart,
  AtividadesRecentes,
  DashboardLoading,
  FluxoCaixaResumo,
} from '@/components/features/dashboard'
import { useDashboard, useMetas, useFluxoCaixa } from '@/lib/hooks/useDashboardData'

export default function Dashboard() {
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const {
    data,
    isLoading: dashboardLoading,
    isValidating,
    mutate: mutateDashboard,
  } = useDashboard(dateFilter, selectedDate)

  const {
    goals,
    isLoading: goalsLoading,
    mutate: mutateMetas,
  } = useMetas()

  const {
    fluxo,
    mutate: mutateFluxo,
  } = useFluxoCaixa(6)

  const isRefreshing = isValidating && !dashboardLoading

  const handleRefresh = () => {
    void mutateDashboard()
    void mutateMetas()
    void mutateFluxo()
  }

  if (dashboardLoading || !data) {
    return <DashboardLoading />
  }

  return (
    <div>
      <DashboardHeader
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        filterType={dateFilter}
        onFilterChange={setDateFilter}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <DashboardStatsGrid
        data={data}
        showCharts={dateFilter === 'week' || dateFilter === 'month'}
        dateFilter={dateFilter}
      />

      <div className="mb-6">
        <DashboardGoals goals={goals} loading={goalsLoading} />
      </div>

      <div className="mb-6">
        <FluxoCaixaResumo fluxo={fluxo} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <OportunidadesChart
          data={data.oportunidadesPorStatus}
          totalOportunidades={data.oportunidadesCount}
        />
        <ValorPipelineChart
          valorTotal={data.valorTotal}
          valorGanhos={data.valorGanhos}
          valorPerdidos={data.valorPerdidos}
        />
        <FaturamentoPerdaLineChart data={data.faturamentoPerdaSerie} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TarefasStatusChart
          tarefasPorStatus={data.tarefasPorStatus}
          oportunidadesCount={data.oportunidadesCount}
        />
        <AtividadesRecentes onRefreshRequest={handleRefresh} />
      </div>
    </div>
  )
}
