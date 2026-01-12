/**
 * Hook para gerenciamento de seleção e filtro de CNAEs
 */
import { useState, useMemo, useEffect } from 'react';
import cnaeData from '@/data/cnae_codes.json';

export interface CnaeGroup {
    group_name: string;
    codes: Record<string, string>;
}

export interface CnaeInfo {
    code: string;
    description: string;
    groupName: string;
}

export function useCnaeSelector(
    selectedCnaes: string[],
    onSelectionChange: (cnaes: string[]) => void,
    multiple: boolean = true
) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const groups = cnaeData as unknown as CnaeGroup[];

    // Filtrar grupos e CNAEs baseado na busca
    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groups;

        const search = searchTerm.toLowerCase();
        return groups
            .map(group => {
                const filteredCodes = Object.entries(group.codes).filter(
                    ([code, description]) =>
                        code.includes(search) ||
                        description.toLowerCase().includes(search) ||
                        group.group_name.toLowerCase().includes(search)
                );

                if (filteredCodes.length > 0) {
                    return {
                        group_name: group.group_name,
                        codes: Object.fromEntries(filteredCodes)
                    };
                }
                return null;
            })
            .filter(Boolean) as CnaeGroup[];
    }, [searchTerm, groups]);

    // Expandir grupos automaticamente quando há busca
    useEffect(() => {
        if (searchTerm && filteredGroups.length > 0) {
            const allGroupNames = filteredGroups.map(g => g.group_name);
            setExpandedGroups(new Set(allGroupNames));
        } else if (!searchTerm) {
            setExpandedGroups(new Set());
        }
    }, [searchTerm, filteredGroups]);

    // Função para expandir/recolher grupo
    const toggleGroup = (groupName: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        setExpandedGroups(newExpanded);
    };

    // Função para adicionar/remover CNAE
    const toggleCnae = (code: string) => {
        if (multiple) {
            if (selectedCnaes.includes(code)) {
                onSelectionChange(selectedCnaes.filter((c) => c !== code));
            } else {
                onSelectionChange([...selectedCnaes, code]);
            }
        } else {
            onSelectionChange([code]);
            setIsOpen(false);
        }
    };

    // Limpar seleção
    const clearSelection = () => {
        onSelectionChange([]);
    };

    // Obter CNAEs selecionados com descrição e grupo
    const selectedCnaesWithInfo = useMemo((): CnaeInfo[] => {
        return selectedCnaes.map((code) => {
            for (const group of groups) {
                if (group.codes[code]) {
                    return {
                        code,
                        description: group.codes[code],
                        groupName: group.group_name
                    };
                }
            }
            return {
                code,
                description: 'Descrição não encontrada',
                groupName: 'Grupo não encontrado'
            };
        });
    }, [selectedCnaes, groups]);

    // Contar total de CNAEs em todos os grupos
    const totalCnaes = useMemo(() => {
        return groups.reduce((total, group) => total + Object.keys(group.codes).length, 0);
    }, [groups]);

    return {
        // State
        searchTerm,
        setSearchTerm,
        isOpen,
        setIsOpen,
        expandedGroups,

        // Data
        filteredGroups,
        selectedCnaesWithInfo,
        totalCnaes,

        // Actions
        toggleGroup,
        toggleCnae,
        clearSelection,
    };
}
