/**
 * Cards de estatísticas de prospectos
 */
'use client'

import { STATUS_OPTIONS, type Estatisticas } from './ProspectarTypes';

interface ProspectosEstatisticasProps {
    estatisticas: Estatisticas;
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
}

export function ProspectosEstatisticas({
    estatisticas,
    statusFilter,
    onStatusFilterChange
}: ProspectosEstatisticasProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="crm-card-soft p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.total}</p>
            </div>
            {STATUS_OPTIONS.slice(0, -1).map(status => (
                <div
                    key={status.value}
                    onClick={() => onStatusFilterChange(statusFilter === status.value ? '' : status.value)}
                    className={`crm-card-soft p-4 cursor-pointer transition-all ${statusFilter === status.value ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                        }`}
                >
                    <p className="text-sm text-gray-600 dark:text-gray-400">{status.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {estatisticas[status.value as keyof Estatisticas] || 0}
                    </p>
                </div>
            ))}
        </div>
    );
}
