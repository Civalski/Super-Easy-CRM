/**
 * Grid de cards de estatísticas do dashboard
 */
'use client'

import { StatCard } from '@/components/common'
import { Users, Briefcase, Calendar, TrendingUp } from 'lucide-react'

interface DashboardData {
    clientesCount: number
    oportunidadesCount: number
    tarefasCount: number
    valorTotal: number
}

interface DashboardStatsGridProps {
    data: DashboardData
}

export function DashboardStatsGrid({ data }: DashboardStatsGridProps) {
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(data.valorTotal || 0)

    return (
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
    )
}
