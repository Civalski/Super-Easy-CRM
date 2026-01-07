'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, Check, Building2, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import cnaeData from '@/data/cnae_codes.json'

interface CnaeGroup {
    group_name: string
    codes: Record<string, string>
}

interface CnaeSelectorProps {
    selectedCnaes: string[]
    onSelectionChange: (cnaes: string[]) => void
    className?: string
    multiple?: boolean
}

export default function CnaeSelector({
    selectedCnaes,
    onSelectionChange,
    className = '',
    multiple = true
}: CnaeSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

    const groups = cnaeData as unknown as CnaeGroup[]

    // Filtrar grupos e CNAEs baseado na busca
    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groups

        const search = searchTerm.toLowerCase()
        return groups
            .map(group => {
                const filteredCodes = Object.entries(group.codes).filter(
                    ([code, description]) =>
                        code.includes(search) ||
                        description.toLowerCase().includes(search) ||
                        group.group_name.toLowerCase().includes(search)
                )

                if (filteredCodes.length > 0) {
                    return {
                        group_name: group.group_name,
                        codes: Object.fromEntries(filteredCodes)
                    }
                }
                return null
            })
            .filter(Boolean) as CnaeGroup[]
    }, [searchTerm, groups])

    // Expandir grupos automaticamente quando há busca
    useEffect(() => {
        if (searchTerm && filteredGroups.length > 0) {
            const allGroupNames = filteredGroups.map(g => g.group_name)
            setExpandedGroups(new Set(allGroupNames))
        } else if (!searchTerm) {
            setExpandedGroups(new Set())
        }
    }, [searchTerm, filteredGroups])

    // Função para expandir/recolher grupo
    const toggleGroup = (groupName: string) => {
        const newExpanded = new Set(expandedGroups)
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName)
        } else {
            newExpanded.add(groupName)
        }
        setExpandedGroups(newExpanded)
    }

    // Função para adicionar/remover CNAE
    const toggleCnae = (code: string) => {
        if (multiple) {
            if (selectedCnaes.includes(code)) {
                onSelectionChange(selectedCnaes.filter((c) => c !== code))
            } else {
                onSelectionChange([...selectedCnaes, code])
            }
        } else {
            onSelectionChange([code])
            setIsOpen(false)
        }
    }

    // Limpar seleção
    const clearSelection = () => {
        onSelectionChange([])
    }

    // Obter CNAEs selecionados com descrição e grupo
    const selectedCnaesWithInfo = useMemo(() => {
        return selectedCnaes.map((code) => {
            // Encontrar em qual grupo está este CNAE
            for (const group of groups) {
                if (group.codes[code]) {
                    return {
                        code,
                        description: group.codes[code],
                        groupName: group.group_name
                    }
                }
            }
            return {
                code,
                description: 'Descrição não encontrada',
                groupName: 'Grupo não encontrado'
            }
        })
    }, [selectedCnaes, groups])

    // Contar total de CNAEs em todos os grupos
    const totalCnaes = useMemo(() => {
        return groups.reduce((total, group) => total + Object.keys(group.codes).length, 0)
    }, [groups])

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
                        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden">
                            {/* Campo de busca */}
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por código, descrição ou categoria..."
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white placeholder-gray-500"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Lista de grupos e CNAEs */}
                            <div className="overflow-y-auto max-h-96">
                                {filteredGroups.length > 0 ? (
                                    filteredGroups.map((group) => {
                                        const isExpanded = expandedGroups.has(group.group_name)
                                        const codesInGroup = Object.entries(group.codes)
                                        const selectedInGroup = codesInGroup.filter(([code]) =>
                                            selectedCnaes.includes(code)
                                        ).length

                                        return (
                                            <div key={group.group_name} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                                {/* Header do grupo */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(group.group_name)}
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
                                                        {codesInGroup.map(([code, description]) => {
                                                            const isSelected = selectedCnaes.includes(code)
                                                            return (
                                                                <button
                                                                    key={code}
                                                                    type="button"
                                                                    onClick={() => toggleCnae(code)}
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
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Search className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
                                        <p className="text-sm">Nenhum CNAE encontrado</p>
                                        <p className="text-xs mt-1">Tente buscar por código ou descrição</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CNAEs selecionados */}
            {selectedCnaes.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Selecionados ({selectedCnaes.length})
                        </label>
                        <button
                            type="button"
                            onClick={clearSelection}
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
                                    onClick={() => toggleCnae(cnae.code)}
                                    className="flex-shrink-0 p-1 text-purple-600 hover:text-red-600 dark:text-purple-400 dark:hover:text-red-400 transition-colors"
                                    title="Remover"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay para fechar dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
