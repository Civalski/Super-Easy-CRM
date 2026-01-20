/**
 * Header do dashboard
 * Design consistente com outras páginas do CRM
 */
'use client'

import { RefreshCw, LayoutDashboard } from 'lucide-react'

interface DashboardHeaderProps {
    isRefreshing: boolean
    onRefresh: () => void
}

export function DashboardHeader({ isRefreshing, onRefresh }: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/25">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Visão geral do seu negócio
                    </p>
                </div>
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
