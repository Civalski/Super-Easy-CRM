/**
 * Header da página de prospecção
 * Design consistente com outras páginas do CRM
 */
'use client'

import { Target, RefreshCw } from 'lucide-react';

interface ProspectarHeaderProps {
    loading: boolean;
    onRefresh: () => void;
}

export function ProspectarHeader({ loading, onRefresh }: ProspectarHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/25">
                    <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Prospecção
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gerencie seus prospectos importados
                    </p>
                </div>
            </div>

            <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
            </button>
        </div>
    );
}
