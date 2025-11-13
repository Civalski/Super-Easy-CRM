import { getDashboardStats } from '@/lib/mockData'
import StatCard from '@/components/StatCard'
import { Users, Briefcase, Calendar, TrendingUp } from 'lucide-react'

export default async function Dashboard() {
  const stats = await getDashboardStats()
  
  const { clientesCount, oportunidadesCount, tarefasCount, valorTotal, oportunidadesPorStatus } = stats

  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valorTotal || 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Clientes"
          value={clientesCount}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Oportunidades"
          value={oportunidadesCount}
          icon={Briefcase}
          color="green"
        />
        <StatCard
          title="Tarefas"
          value={tarefasCount}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Oportunidades por Status
          </h3>
          <div className="space-y-3">
            {oportunidadesPorStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="capitalize text-gray-700 dark:text-gray-300">
                  {item.status.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${oportunidadesCount > 0 ? (item._count / oportunidadesCount) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white w-8 text-right">
                    {item._count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividades Recentes
          </h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nenhuma atividade recente</p>
          </div>
        </div>
      </div>
    </div>
  )
}

