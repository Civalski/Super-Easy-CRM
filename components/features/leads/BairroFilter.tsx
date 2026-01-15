/**
 * Componente para pós-filtro de bairros
 * Exibido após a busca inicial com os bairros disponíveis
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Search, Check, X, Filter, Loader2 } from 'lucide-react';

interface BairroFilterProps {
    bairros: string[];
    selectedBairros: string[];
    onBairrosChange: (bairros: string[]) => void;
    onApplyFilter: () => void;
    onClearFilter: () => void;
    loading?: boolean;
    totalRegistros?: number;
}

export function BairroFilter({
    bairros,
    selectedBairros,
    onBairrosChange,
    onApplyFilter,
    onClearFilter,
    loading = false,
    totalRegistros = 0,
}: BairroFilterProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Filtrar bairros pelo termo de busca
    const filteredBairros = useMemo(() => {
        if (!searchTerm) return bairros;
        return bairros.filter(b =>
            b.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [bairros, searchTerm]);

    // Toggle seleção de bairro
    const toggleBairro = (bairro: string) => {
        if (selectedBairros.includes(bairro)) {
            onBairrosChange(selectedBairros.filter(b => b !== bairro));
        } else {
            onBairrosChange([...selectedBairros, bairro]);
        }
    };

    // Selecionar/desselecionar todos
    const toggleAll = () => {
        if (selectedBairros.length === filteredBairros.length) {
            onBairrosChange([]);
        } else {
            onBairrosChange([...filteredBairros]);
        }
    };

    if (bairros.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 overflow-hidden mt-4">
            {/* Header */}
            <div
                className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Filtrar por Bairro</h3>
                            <p className="text-sm text-blue-100">
                                {bairros.length} bairros disponíveis • {totalRegistros.toLocaleString('pt-BR')} empresas
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedBairros.length > 0 && (
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                                {selectedBairros.length} selecionados
                            </span>
                        )}
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <svg
                                className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-5 space-y-4">
                    {/* Barra de pesquisa */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar bairro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>

                    {/* Ações rápidas */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={toggleAll}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {selectedBairros.length === filteredBairros.length
                                ? 'Desselecionar todos'
                                : 'Selecionar todos'}
                        </button>
                        {selectedBairros.length > 0 && (
                            <button
                                onClick={() => onBairrosChange([])}
                                className="text-sm text-red-500 hover:underline flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Limpar seleção
                            </button>
                        )}
                    </div>

                    {/* Lista de bairros */}
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                        {filteredBairros.map((bairro) => (
                            <label
                                key={bairro}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedBairros.includes(bairro)
                                        ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${selectedBairros.includes(bairro)
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {selectedBairros.includes(bairro) && (
                                        <Check className="w-3 h-3" />
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedBairros.includes(bairro)}
                                    onChange={() => toggleBairro(bairro)}
                                    className="hidden"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {bairro}
                                </span>
                            </label>
                        ))}

                        {filteredBairros.length === 0 && (
                            <p className="text-center text-gray-500 py-4">
                                Nenhum bairro encontrado para "{searchTerm}"
                            </p>
                        )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onApplyFilter}
                            disabled={loading || selectedBairros.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Filtrando...
                                </>
                            ) : (
                                <>
                                    <Filter className="w-4 h-4" />
                                    Aplicar Filtro ({selectedBairros.length} bairros)
                                </>
                            )}
                        </button>
                        {selectedBairros.length > 0 && (
                            <button
                                onClick={onClearFilter}
                                className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Mostrar Todos
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
