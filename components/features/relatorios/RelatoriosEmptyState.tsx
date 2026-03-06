/**
 * Estado de "em desenvolvimento" para relatórios
 */
'use client'

import { BarChart3 } from '@/lib/icons'

export function RelatoriosEmptyState() {
    return (
        <div className="crm-card p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Relatórios em desenvolvimento
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
                Esta funcionalidade estará disponível em breve.
            </p>
        </div>
    )
}
