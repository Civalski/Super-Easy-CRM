/**
 * Filtros de busca para prospectos
 */
'use client'

import { Search, Filter, Layers, Trash2, CheckSquare, Square, Loader2 } from 'lucide-react';
import { STATUS_OPTIONS } from './ProspectarTypes';

// Função para ordenar lotes corretamente (A, B, C... Z, A1, B1... Z1, A2...)
function sortLotes(lotes: string[]): string[] {
    return [...lotes].sort((a, b) => {
        // Extrair letra e número
        const matchA = a.match(/^([A-Z])(\d*)$/);
        const matchB = b.match(/^([A-Z])(\d*)$/);

        if (!matchA || !matchB) return a.localeCompare(b);

        const [, letraA, numA] = matchA;
        const [, letraB, numB] = matchB;

        // Primeiro ordenar por número (vazio = 0)
        const nA = numA ? parseInt(numA) : 0;
        const nB = numB ? parseInt(numB) : 0;

        if (nA !== nB) return nA - nB;

        // Depois ordenar por letra
        return letraA.localeCompare(letraB);
    });
}

interface ProspectosFiltersProps {
    searchTerm: string;
    statusFilter: string;
    loteFilter: string;
    lotes: string[];
    selectedCount: number;
    totalCount: number;
    isDeleting: boolean;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onLoteFilterChange: (value: string) => void;
    onSelectAll: () => void;
    onDeleteSelected: () => void;
    onDeleteAll: () => void;
    totalAll: number;
}

export function ProspectosFilters({
    searchTerm,
    statusFilter,
    loteFilter,
    lotes,
    selectedCount,
    totalCount,
    isDeleting,
    onSearchChange,
    onStatusFilterChange,
    onLoteFilterChange,
    onSelectAll,
    onDeleteSelected,
    onDeleteAll,
    totalAll,
}: ProspectosFiltersProps) {
    const sortedLotes = sortLotes(lotes);
    const allSelected = selectedCount > 0 && selectedCount === totalCount;

    return (
        <div className="space-y-3">
            {/* Filtros */}
            <div className="crm-card-soft p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CNPJ, cidade ou lote..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Filtro por Lote */}
                        {sortedLotes.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-400" />
                                <select
                                    value={loteFilter}
                                    onChange={(e) => onLoteFilterChange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Todos os Lotes ({sortedLotes.length})</option>
                                    {sortedLotes.map(l => (
                                        <option key={l} value={l}>Lote {l}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Filtro por Status (oculto na aba Leads, pois só mostra lead_frio) */}
                        {statusFilter !== 'lead_frio' && (
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => onStatusFilterChange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Todos os Status</option>
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Barra de seleção e ações em massa */}
            <div className="crm-card-soft p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onSelectAll}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            {allSelected ? (
                                <CheckSquare className="w-4 h-4 text-purple-500" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            <span className="text-sm">
                                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                            </span>
                        </button>

                        {selectedCount > 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedCount} selecionado(s)
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Botão Excluir Selecionados */}
                        {selectedCount > 0 && (
                            <button
                                onClick={onDeleteSelected}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span className="text-sm font-medium">
                                    Excluir {selectedCount}
                                </span>
                            </button>
                        )}

                        {/* Botão Excluir Todos */}
                        {totalAll > 0 && selectedCount === 0 && (
                            <button
                                onClick={onDeleteAll}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 disabled:bg-red-700 text-white rounded-lg transition-colors border border-red-700"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span className="text-sm font-medium">
                                    Limpar Todos ({totalAll.toLocaleString('pt-BR')})
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
