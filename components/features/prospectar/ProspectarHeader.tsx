/**
 * Header da página de prospecção
 */
'use client'

import { Target, RefreshCw } from 'lucide-react';

interface ProspectarHeaderProps {
    loading: boolean;
    onRefresh: () => void;
}

export function ProspectarHeader({ loading, onRefresh }: ProspectarHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prospecção</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
