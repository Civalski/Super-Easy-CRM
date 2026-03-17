'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DashboardHeader,
  DashboardStatsGrid,
  OportunidadesChart,
  ValorPipelineChart,
  FaturamentoPerdaLineChart,
  DashboardLoading,
  FluxoCaixaResumo,
} from '@/components/features/dashboard'
import { useDashboard, useFluxoCaixa } from '@/lib/hooks/useDashboardData'
import { toast } from '@/lib/toast'

function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const {
    data,
    isLoading: dashboardLoading,
    isValidating,
    mutate: mutateDashboard,
  } = useDashboard(dateFilter, selectedDate)

  const {
    fluxo,
    mutate: mutateFluxo,
  } = useFluxoCaixa(6)

  const isRefreshing = isValidating && !dashboardLoading

  useEffect(() => {
    const sub = searchParams.get('subscription')
    if (sub === 'success') {
      toast.success('Parabéns, sua assinatura foi confirmada!', {
        description: 'Você agora tem acesso aos recursos premium.',
      })
      router.replace('/dashboard')
    } else if (sub === 'canceled') {
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  const handleRefresh = () => {
    void mutateDashboard()
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
        onRefreshRequest={handleRefresh}
      />

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

    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPageContent />
    </Suspense>
  )
}
