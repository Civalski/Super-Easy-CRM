/**
 * Lista de prospectos
 */
'use client'

import { Loader2, Target } from 'lucide-react';
import { ProspectoCard } from './ProspectoCard';
import type { Prospecto } from './ProspectarTypes';

interface ProspectosListProps {
    prospectos: Prospecto[];
    loading: boolean;
    error: string | null;
    openMenuId: string | null;
    onMenuToggle: (id: string | null) => void;
    onStatusChange: (id: string, status: string) => void;
    onPrioridadeChange: (id: string, prioridade: number) => void;
    onEditObservacao: (id: string, observacoes: string) => void;
    onConverter: (id: string) => void;
    onDelete: (id: string) => void;
}

export function ProspectosList({
    prospectos,
    loading,
    error,
    openMenuId,
    onMenuToggle,
    onStatusChange,
    onPrioridadeChange,
    onEditObservacao,
    onConverter,
    onDelete,
}: ProspectosListProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-center py-12 text-red-600 dark:text-red-400">
                    {error}
                </div>
            </div>
        );
    }

    if (prospectos.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum prospecto encontrado</p>
                    <p className="text-sm mt-1">Importe leads da aba Leads para começar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {prospectos.map(prospecto => (
                    <ProspectoCard
                        key={prospecto.id}
                        prospecto={prospecto}
                        openMenuId={openMenuId}
                        onMenuToggle={onMenuToggle}
                        onStatusChange={onStatusChange}
                        onPrioridadeChange={onPrioridadeChange}
                        onEditObservacao={onEditObservacao}
                        onConverter={onConverter}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}
