/**
 * Abas de navegação para tarefas (Pendentes/Histórico)
 */
'use client'

import { Clock, History } from '@/lib/icons'
import type { TabType } from './TarefasTypes'

interface TarefasTabsProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
    pendentesCount: number
    concluidasCount: number
    onLimparFiltros: () => void
}

export function TarefasTabs({
    activeTab,
    onTabChange,
    pendentesCount,
    concluidasCount,
    onLimparFiltros,
}: TarefasTabsProps) {
    const handleTabChange = (tab: TabType) => {
        onTabChange(tab)
        onLimparFiltros()
    }

    return (
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => handleTabChange('pendentes')}
                    className={`
            py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'pendentes'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
          `}
                >
                    <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span>Pendentes</span>
                        {pendentesCount > 0 && (
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {pendentesCount}
                            </span>
                        )}
                    </div>
                </button>
                <button
                    onClick={() => handleTabChange('historico')}
                    className={`
            py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'historico'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
          `}
                >
                    <div className="flex items-center gap-2">
                        <History size={18} />
                        <span>Histórico</span>
                        {concluidasCount > 0 && (
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {concluidasCount}
                            </span>
                        )}
                    </div>
                </button>
            </nav>
        </div>
    )
}
