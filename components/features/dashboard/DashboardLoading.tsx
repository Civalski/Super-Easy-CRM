/**
 * Estado de carregamento do dashboard
 */
'use client'

import { RefreshCw } from 'lucide-react'

export function DashboardLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={32} />
                <p className="text-gray-600 dark:text-gray-400">Carregando dados do dashboard...</p>
            </div>
        </div>
    )
}
