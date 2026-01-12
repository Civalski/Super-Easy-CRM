'use client'

import { useEffect, useState } from 'react'
import {
  DashboardHeader,
  DashboardStatsGrid,
  OportunidadesChart,
  AtividadesRecentes,
  DashboardLoading,
} from '@/components/features/dashboard'

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
    return <DashboardLoading />
  }

  return (
    <div>
      <DashboardHeader
        isRefreshing={isRefreshing}
        onRefresh={fetchDashboardData}
      />

      <DashboardStatsGrid data={data} />

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
