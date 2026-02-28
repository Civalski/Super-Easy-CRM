/**
 * Filtros para tarefas (status e prioridade)
 */
'use client'

import { Filter, X } from 'lucide-react'
import type { TabType } from './TarefasTypes'

interface TarefasFiltersProps {
    activeTab: TabType
    filtroStatus: string
    filtroPrioridade: string
    onFiltroStatusChange: (value: string) => void
    onFiltroPrioridadeChange: (value: string) => void
    onLimparFiltros: () => void
}

export function TarefasFilters({
    activeTab,
    filtroStatus,
    filtroPrioridade,
    onFiltroStatusChange,
    onFiltroPrioridadeChange,
    onLimparFiltros,
}: TarefasFiltersProps) {
    const temFiltrosAtivos = (activeTab === 'pendentes' && filtroStatus !== '') || filtroPrioridade !== ''

    return (
        <div className="mb-6 crm-card p-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros:</span>
                </div>

                {activeTab === 'pendentes' && (
                    <div>
                        <select
                            value={filtroStatus}
                            onChange={(e) => onFiltroStatusChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos os status</option>
                            <option value="pendente">Pendente</option>
                            <option value="em_andamento">Em Andamento</option>
                        </select>
                    </div>
                )}

                <div>
                    <select
                        value={filtroPrioridade}
                        onChange={(e) => onFiltroPrioridadeChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todas as prioridades</option>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>

                {temFiltrosAtivos && (
                    <button
                        onClick={onLimparFiltros}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <X size={16} />
                        Limpar filtros
                    </button>
                )}
            </div>
        </div>
    )
}
