/**
 * Componente seletor de CNAE com busca e agrupamento
 * 
 * Refatorado para usar:
 * - useCnaeSelector: Hook para lógica de filtro e seleção
 * - CnaeDropdown: Dropdown com lista de grupos e CNAEs
 * - SelectedCnaesList: Lista de CNAEs selecionados
 */
'use client';

import { Building2, ChevronDown } from 'lucide-react';
import { useCnaeSelector } from '@/lib/hooks/useCnaeSelector';
import { CnaeDropdown, SelectedCnaesList } from './CnaeComponents';

interface CnaeSelectorProps {
    selectedCnaes: string[];
    onSelectionChange: (cnaes: string[]) => void;
    className?: string;
    multiple?: boolean;
}

export default function CnaeSelector({
    selectedCnaes,
    onSelectionChange,
    className = '',
    multiple = true
}: CnaeSelectorProps) {
    const {
        searchTerm,
        setSearchTerm,
        isOpen,
        setIsOpen,
        expandedGroups,
        filteredGroups,
        selectedCnaesWithInfo,
        totalCnaes,
        toggleGroup,
        toggleCnae,
        clearSelection,
    } = useCnaeSelector(selectedCnaes, onSelectionChange, multiple);

    return (
        <div className={`relative ${className}`}>
            {/* Campo de seleção */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CNAE {multiple && '(Selecione um ou mais)'}
                </label>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:border-purple-500 dark:hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Building2 className="text-purple-500 dark:text-purple-400 flex-shrink-0" size={20} />
                                <span className="text-gray-900 dark:text-white truncate">
                                    {selectedCnaes.length > 0
                                        ? `${selectedCnaes.length} CNAE${selectedCnaes.length > 1 ? 's' : ''} selecionado${selectedCnaes.length > 1 ? 's' : ''}`
                                        : `Selecione o CNAE (${totalCnaes} disponíveis)`}
                                </span>
                            </div>
                            <ChevronDown
                                className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                size={20}
                            />
                        </div>
                    </button>

                    {/* Dropdown */}
                    {isOpen && (
                        <CnaeDropdown
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            filteredGroups={filteredGroups}
                            expandedGroups={expandedGroups}
                            selectedCnaes={selectedCnaes}
                            onToggleGroup={toggleGroup}
                            onToggleCnae={toggleCnae}
                        />
                    )}
                </div>
            </div>

            {/* CNAEs selecionados */}
            <SelectedCnaesList
                selectedCnaesWithInfo={selectedCnaesWithInfo}
                onRemove={toggleCnae}
                onClearAll={clearSelection}
            />

            {/* Overlay para fechar dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
