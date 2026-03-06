/**
 * Header da página de relatórios
 * Design consistente com outras páginas do CRM
 */
'use client'

import { BarChart3 } from '@/lib/icons'

export function RelatoriosHeader() {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-linear-to-br from-rose-500 to-red-500 rounded-xl shadow-lg shadow-rose-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Relatórios
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Visualize relatórios e análises do seu negócio
                </p>
            </div>
        </div>
    )
}
