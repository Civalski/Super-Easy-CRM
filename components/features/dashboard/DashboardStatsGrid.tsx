/**
 * Grid de cards de estatisticas do dashboard
 */
'use client'

import { StatCard } from '@/components/common'
import { Users, Briefcase, Calendar, TrendingUp, TrendingDown } from '@/lib/icons'
import { formatCurrency } from '@/lib/format'

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
}

interface DashboardStatsGridProps {
    data: DashboardData
}

export function DashboardStatsGrid({ data }: DashboardStatsGridProps) {
    const valorPedidosSemPagamentoFormatado = formatCurrency(data.pedidosSemPagamentoValor || 0)
    const valorOrcamentosEmAbertoFormatado = formatCurrency(data.orcamentosEmAbertoValor || 0)
    const valorTotalFormatado = formatCurrency(data.valorTotal || 0)
    const valorGanhosFormatado = formatCurrency(data.valorGanhos || 0)
    const valorPerdidosFormatado = formatCurrency(data.valorPerdidos || 0)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <StatCard
                title="Valor de pedidos sem pagamento"
                value={valorPedidosSemPagamentoFormatado}
                icon={Users}
                color="blue"
                href="/pedidos"
                hoverRing="purple"
            />
            <StatCard
                title="Valor de orcamentos em aberto"
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
            <StatCard
                title="Valor em Vendas"
                value={valorGanhosFormatado}
                icon={TrendingUp}
                color="green"
            />
            <StatCard
                title="Valor em Orçamentos Cancelados"
                value={valorPerdidosFormatado}
                icon={TrendingDown}
                color="red"
            />
        </div>
    )
}
