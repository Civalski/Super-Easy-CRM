/**
 * Card de "em desenvolvimento" para outras configurações
 */
'use client'

import { Settings } from '@/lib/icons'

export function ConfiguracoesEmptyState() {
    return (
        <div className="crm-card p-12 text-center">
            <Settings size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Outras configurações em desenvolvimento
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
                Mais funcionalidades de configuração estarão disponíveis em breve.
            </p>
        </div>
    )
}
