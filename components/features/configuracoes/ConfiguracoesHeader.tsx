/**
 * Header da página de configurações
 * Design consistente com outras páginas do CRM
 */
'use client'

import { Settings } from 'lucide-react'

export function ConfiguracoesHeader() {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-gray-600 to-slate-700 rounded-xl shadow-lg shadow-gray-500/25">
                <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Configurações
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure as preferências do sistema
                </p>
            </div>
        </div>
    )
}
