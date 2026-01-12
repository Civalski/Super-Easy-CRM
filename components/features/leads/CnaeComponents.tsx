/**
 * Subcomponentes do CnaeSelector
 */
'use client';

import { Search, X, Check, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import type { CnaeGroup, CnaeInfo } from '@/lib/hooks/useCnaeSelector';

// ==================== CnaeDropdown ====================
interface CnaeDropdownProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filteredGroups: CnaeGroup[];
    expandedGroups: Set<string>;
    selectedCnaes: string[];
    onToggleGroup: (groupName: string) => void;
    onToggleCnae: (code: string) => void;
}

export function CnaeDropdown({
    searchTerm,
    onSearchChange,
    filteredGroups,
    expandedGroups,
    selectedCnaes,
    onToggleGroup,
    onToggleCnae,
}: CnaeDropdownProps) {
    return (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden">
            {/* Campo de busca */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por código, descrição ou categoria..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white placeholder-gray-500"
                        autoFocus
                    />
                </div>
            </div>

            {/* Lista de grupos e CNAEs */}
            <div className="overflow-y-auto max-h-96">
                {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                        <CnaeGroupItem
                            key={group.group_name}
                            group={group}
                            isExpanded={expandedGroups.has(group.group_name)}
                            selectedCnaes={selectedCnaes}
                            onToggleGroup={onToggleGroup}
                            onToggleCnae={onToggleCnae}
                        />
                    ))
                ) : (
                    <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Search className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
                        <p className="text-sm">Nenhum CNAE encontrado</p>
                        <p className="text-xs mt-1">Tente buscar por código ou descrição</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== CnaeGroupItem ====================
interface CnaeGroupItemProps {
    group: CnaeGroup;
    isExpanded: boolean;
    selectedCnaes: string[];
    onToggleGroup: (groupName: string) => void;
    onToggleCnae: (code: string) => void;
}

function CnaeGroupItem({
    group,
    isExpanded,
    selectedCnaes,
    onToggleGroup,
    onToggleCnae,
}: CnaeGroupItemProps) {
    const codesInGroup = Object.entries(group.codes);
    const selectedInGroup = codesInGroup.filter(([code]) =>
        selectedCnaes.includes(code)
    ).length;

    return (
        <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            {/* Header do grupo */}
            <button
                type="button"
                onClick={() => onToggleGroup(group.group_name)}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
            >
                {isExpanded ? (
                    <FolderOpen className="text-purple-600 dark:text-purple-400 flex-shrink-0" size={18} />
                ) : (
                    <Folder className="text-purple-600 dark:text-purple-400 flex-shrink-0" size={18} />
                )}
                <span className="flex-1 font-medium text-gray-900 dark:text-white text-sm">
                    {group.group_name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {selectedInGroup > 0 && (
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {selectedInGroup}/
                        </span>
                    )}
                    {codesInGroup.length}
                </span>
                {isExpanded ? (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={16} />
                ) : (
                    <ChevronRight className="text-gray-400 flex-shrink-0" size={16} />
                )}
            </button>

            {/* CNAEs do grupo */}
            {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900">
                    {codesInGroup.map(([code, description]) => (
                        <CnaeItem
                            key={code}
                            code={code}
                            description={description}
                            isSelected={selectedCnaes.includes(code)}
                            onToggle={onToggleCnae}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== CnaeItem ====================
interface CnaeItemProps {
    code: string;
    description: string;
    isSelected: boolean;
    onToggle: (code: string) => void;
}

function CnaeItem({ code, description, isSelected, onToggle }: CnaeItemProps) {
    return (
        <button
            type="button"
            onClick={() => onToggle(code)}
            className={`w-full px-4 py-2 pl-12 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-t border-gray-100 dark:border-gray-800 ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center ${isSelected
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300 dark:border-gray-600'
                        }`}
                >
                    {isSelected && <Check className="text-white" size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {code}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {description}
                    </div>
                </div>
            </div>
        </button>
    );
}

// ==================== SelectedCnaesList ====================
interface SelectedCnaesListProps {
    selectedCnaesWithInfo: CnaeInfo[];
    onRemove: (code: string) => void;
    onClearAll: () => void;
}

export function SelectedCnaesList({
    selectedCnaesWithInfo,
    onRemove,
    onClearAll,
}: SelectedCnaesListProps) {
    if (selectedCnaesWithInfo.length === 0) return null;

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selecionados ({selectedCnaesWithInfo.length})
                </label>
                <button
                    type="button"
                    onClick={onClearAll}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                >
                    Limpar tudo
                </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {selectedCnaesWithInfo.map((cnae) => (
                    <div
                        key={cnae.code}
                        className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg group hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                                    {cnae.code}
                                </span>
                                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded truncate max-w-xs">
                                    {cnae.groupName.split(' - ')[0]}
                                </span>
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 line-clamp-2">
                                {cnae.description}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(cnae.code)}
                            className="flex-shrink-0 p-1 text-purple-600 hover:text-red-600 dark:text-purple-400 dark:hover:text-red-400 transition-colors"
                            title="Remover"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
