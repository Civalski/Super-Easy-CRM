/**
 * Grid de cards de estatisticas do dashboard
 */
'use client'

import { StatCard } from '@/components/common'
import { Users, Briefcase, Calendar, TrendingUp } from '@/lib/icons'
import { formatCurrency } from '@/lib/format'
import { DashboardLineChart7Dias } from './DashboardLineChart7Dias'
import { AtividadesRecentes } from './AtividadesRecentes'

interface DashboardData {
  pedidosCount: number
  pedidosSemPagamentoCount: number
  pedidosSemPagamentoValor: number
  oportunidadesCount: number
  orcamentosEmAbertoCount: number
  orcamentosEmAbertoValor: number
  tarefasCount: number
  valorTotal: number
  valorGanhos: number
  valorPerdidos: number
  vendasPorDia: Array<{ date: string; valor: number }>
  orcamentosCanceladosPorDia: Array<{ date: string; valor: number }>
}

interface DashboardStatsGridProps {
  data: DashboardData
  showCharts?: boolean
  dateFilter?: 'day' | 'week' | 'month'
  onRefreshRequest?: () => void
}

export function DashboardStatsGrid({ data, showCharts = true, dateFilter = 'week', onRefreshRequest }: DashboardStatsGridProps) {
  const valorPedidosSemPagamentoFormatado = formatCurrency(data.pedidosSemPagamentoValor || 0)
  const valorOrcamentosEmAbertoFormatado = formatCurrency(data.orcamentosEmAbertoValor || 0)
  const valorTotalFormatado = formatCurrency(data.valorTotal || 0)

  return (
    <div className="mb-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Valor de pedidos sem pagamento"
          value={valorPedidosSemPagamentoFormatado}
          icon={Users}
          color="blue"
          href="/pedidos"
          hoverRing="purple"
        />
        <StatCard
          title="Valor de orçamentos em aberto"
          value={valorOrcamentosEmAbertoFormatado}
          icon={Briefcase}
          color="green"
          href="/oportunidades"
          hoverRing="purple"
        />
        <StatCard
          title="Tarefas em Aberto"
          value={data.tarefasCount}
          icon={Calendar}
          color="yellow"
          href="/tarefas"
          hoverRing="purple"
        />
        <StatCard
          title="Valor total em aberto"
          value={valorTotalFormatado}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {showCharts && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardLineChart7Dias
          title="Valor em Vendas"
          data={data.vendasPorDia ?? []}
          color="green"
          type="valor"
          periodType={dateFilter === 'month' ? 'week' : 'day'}
        />
        <DashboardLineChart7Dias
          title="Valor em Orçamentos Cancelados"
          data={data.orcamentosCanceladosPorDia ?? []}
          color="red"
          type="valor"
          periodType={dateFilter === 'month' ? 'week' : 'day'}
        />
        <AtividadesRecentes compact onRefreshRequest={onRefreshRequest} />
      </div>
      )}
    </div>
  )
}
