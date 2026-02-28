/**
 * Grid de cards de estatísticas do dashboard
 */
'use client'

import { StatCard } from '@/components/common'
import { Users, Briefcase, Calendar, TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardData {
    clientesCount: number
    oportunidadesCount: number
    tarefasCount: number
    valorTotal: number
    valorGanhos: number
    valorPerdidos: number
}

interface DashboardStatsGridProps {
    data: DashboardData
}

export function DashboardStatsGrid({ data }: DashboardStatsGridProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0)

    const valorTotalFormatado = formatCurrency(data.valorTotal || 0)
    const valorGanhosFormatado = formatCurrency(data.valorGanhos || 0)
    const valorPerdidosFormatado = formatCurrency(data.valorPerdidos || 0)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <StatCard
                title="Total de Clientes"
                value={data.clientesCount}
                icon={Users}
                color="blue"
            />
            <StatCard
                title="Orçamentos"
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
                value={valorTotalFormatado}
                icon={TrendingUp}
                color="purple"
            />
            <StatCard
                title="Valor Ganho"
                value={valorGanhosFormatado}
                icon={TrendingUp}
                color="green"
            />
            <StatCard
                title="Valor Perdido"
                value={valorPerdidosFormatado}
                icon={TrendingDown}
                color="red"
            />
        </div>
    )
}
