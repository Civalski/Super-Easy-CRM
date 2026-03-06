import { CheckCircle2, Truck, X } from '@/lib/icons'
import type { PedidoTab } from './types'

interface PedidosTabsProps {
  activeTab: PedidoTab
  stats: { emAndamento: number; vendas: number; cancelados: number }
  onTabChange: (tab: PedidoTab) => void
}

const tabClass = (active: boolean) =>
  `flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
    active
      ? 'border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-500'
      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
  }`

export function PedidosTabs({ activeTab, stats, onTabChange }: PedidosTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      <button onClick={() => onTabChange('andamento')} className={tabClass(activeTab === 'andamento')}>
        <Truck size={16} />
        Em andamento ({stats.emAndamento})
      </button>
      <button onClick={() => onTabChange('vendas')} className={tabClass(activeTab === 'vendas')}>
        <CheckCircle2 size={16} />
        Vendas ({stats.vendas})
      </button>
      <button onClick={() => onTabChange('cancelados')} className={tabClass(activeTab === 'cancelados')}>
        <X size={16} />
        Cancelados ({stats.cancelados})
      </button>
    </div>
  )
}
