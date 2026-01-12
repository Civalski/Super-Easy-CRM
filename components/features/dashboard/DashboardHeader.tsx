/**
 * Header do dashboard
 */
'use client'

import { RefreshCw } from 'lucide-react'

interface DashboardHeaderProps {
    isRefreshing: boolean
    onRefresh: () => void
}

export function DashboardHeader({ isRefreshing, onRefresh }: DashboardHeaderProps) {
    return (
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Visão geral do seu negócio
                </p>
            </div>
            <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Atualizar dados"
            >
                <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
        </div>
    )
}
