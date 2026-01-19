/**
 * Contexto para persistir os filtros de leads entre navegações
 * O estado é mantido em memória e opcionalmente salvo no localStorage
 * v2.0: Adicionado suporte a filtros salvos
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { LeadsSearchFilters, EmpresaParquet, LeadsCountResponse } from '@/types/leads';

// Estado inicial dos filtros
const defaultFilters: LeadsSearchFilters = {
    estado: '',
    cidade: '',
    cnaes_principais: [],
    cnaes_secundarios: [],
    exigir_todos_secundarios: false,
    filtrar_telefones_invalidos: true, // Ativado por padrão
    adicionar_nono_digito: false,
    apenas_celular: false,
    situacao: '',
    porte: '',
    limit: 20, // Limite fixo de 20 para visualização
};

// Interface para os resultados de busca
interface LeadsSearchData {
    total_encontrado: number;
    total_lidos: number;
    filtros: Record<string, unknown>;
    resultados: EmpresaParquet[];
}

// Interface para um filtro salvo
export interface SavedFilter {
    id: string;
    name: string;
    filters: LeadsSearchFilters;
    createdAt: string;
    updatedAt: string;
}

// Interface do contexto
interface LeadsFiltersContextType {
    // Filtros
    filters: LeadsSearchFilters;
    setFilters: (filters: LeadsSearchFilters) => void;
    resetFilters: () => void;

    // Resultados da busca (mantidos em memória)
    searchData: LeadsSearchData | null;
    setSearchData: (data: LeadsSearchData | null) => void;

    // Contagem
    countData: LeadsCountResponse | null;
    setCountData: (data: LeadsCountResponse | null) => void;

    // Seleção de leads
    selectedIndices: Set<number>;
    setSelectedIndices: (indices: Set<number>) => void;

    // Bairros selecionados para pós-filtro
    selectedBairros: string[];
    setSelectedBairros: (bairros: string[]) => void;
    bairroFilterApplied: boolean;
    setBairroFilterApplied: (applied: boolean) => void;

    // Flag para indicar se já houve uma busca
    hasSearched: boolean;
    setHasSearched: (value: boolean) => void;

    // Filtros salvos
    savedFilters: SavedFilter[];
    saveFilter: (name: string) => SavedFilter;
    loadFilter: (id: string) => void;
    deleteFilter: (id: string) => void;
    updateFilter: (id: string, name?: string) => void;
}

// Criando o contexto
const LeadsFiltersContext = createContext<LeadsFiltersContextType | null>(null);

// Chaves para localStorage
const STORAGE_KEY = 'arker-crm-leads-filters';
const SAVED_FILTERS_KEY = 'arker-crm-saved-filters';

// Provider
interface LeadsFiltersProviderProps {
    children: ReactNode;
}

export function LeadsFiltersProvider({ children }: LeadsFiltersProviderProps) {
    // Estado dos filtros
    const [filters, setFiltersState] = useState<LeadsSearchFilters>(defaultFilters);
    const [isInitialized, setIsInitialized] = useState(false);

    // Resultados mantidos em memória (não persistidos no localStorage)
    const [searchData, setSearchData] = useState<LeadsSearchData | null>(null);
    const [countData, setCountData] = useState<LeadsCountResponse | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [selectedBairros, setSelectedBairros] = useState<string[]>([]);
    const [bairroFilterApplied, setBairroFilterApplied] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Filtros salvos
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

    // Carregar filtros do localStorage ao montar (apenas uma vez)
    useEffect(() => {
        try {
            // Carregar filtros atuais
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Mesclar com defaults para garantir que novos campos estejam presentes
                setFiltersState({ ...defaultFilters, ...parsed });
            }

            // Carregar filtros salvos
            const savedFiltersData = localStorage.getItem(SAVED_FILTERS_KEY);
            if (savedFiltersData) {
                const parsedFilters = JSON.parse(savedFiltersData);
                if (Array.isArray(parsedFilters)) {
                    setSavedFilters(parsedFilters);
                }
            }
        } catch (error) {
            console.warn('Erro ao carregar filtros do localStorage:', error);
        }
        setIsInitialized(true);
    }, []);

    // Salvar filtros no localStorage quando mudarem
    useEffect(() => {
        if (!isInitialized) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
        } catch (error) {
            console.warn('Erro ao salvar filtros no localStorage:', error);
        }
    }, [filters, isInitialized]);

    // Salvar lista de filtros salvos no localStorage
    useEffect(() => {
        if (!isInitialized) return;

        try {
            localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
        } catch (error) {
            console.warn('Erro ao salvar filtros salvos no localStorage:', error);
        }
    }, [savedFilters, isInitialized]);

    // Setter para filtros
    const setFilters = useCallback((newFilters: LeadsSearchFilters) => {
        setFiltersState(newFilters);
    }, []);

    // Resetar filtros para o padrão
    const resetFilters = useCallback(() => {
        setFiltersState(defaultFilters);
        setSearchData(null);
        setCountData(null);
        setSelectedIndices(new Set());
        setSelectedBairros([]);
        setBairroFilterApplied(false);
        setHasSearched(false);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Erro ao remover filtros do localStorage:', error);
        }
    }, []);

    // Salvar filtro atual com um nome
    const saveFilter = useCallback((name: string): SavedFilter => {
        const now = new Date().toISOString();
        const newFilter: SavedFilter = {
            id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: name.trim(),
            filters: { ...filters },
            createdAt: now,
            updatedAt: now,
        };

        setSavedFilters(prev => [...prev, newFilter]);
        return newFilter;
    }, [filters]);

    // Carregar um filtro salvo
    const loadFilter = useCallback((id: string) => {
        const filter = savedFilters.find(f => f.id === id);
        if (filter) {
            // Limpar resultados anteriores ao carregar novo filtro
            setSearchData(null);
            setCountData(null);
            setSelectedIndices(new Set());
            setSelectedBairros([]);
            setBairroFilterApplied(false);
            setHasSearched(false);

            // Aplicar os filtros salvos
            setFiltersState({ ...defaultFilters, ...filter.filters });
        }
    }, [savedFilters]);

    // Excluir um filtro salvo
    const deleteFilter = useCallback((id: string) => {
        setSavedFilters(prev => prev.filter(f => f.id !== id));
    }, []);

    // Atualizar um filtro salvo (nome ou filtros atuais)
    const updateFilter = useCallback((id: string, name?: string) => {
        setSavedFilters(prev => prev.map(f => {
            if (f.id === id) {
                return {
                    ...f,
                    name: name?.trim() || f.name,
                    filters: { ...filters },
                    updatedAt: new Date().toISOString(),
                };
            }
            return f;
        }));
    }, [filters]);

    const value: LeadsFiltersContextType = {
        filters,
        setFilters,
        resetFilters,
        searchData,
        setSearchData,
        countData,
        setCountData,
        selectedIndices,
        setSelectedIndices,
        selectedBairros,
        setSelectedBairros,
        bairroFilterApplied,
        setBairroFilterApplied,
        hasSearched,
        setHasSearched,
        // Filtros salvos
        savedFilters,
        saveFilter,
        loadFilter,
        deleteFilter,
        updateFilter,
    };

    return (
        <LeadsFiltersContext.Provider value={value}>
            {children}
        </LeadsFiltersContext.Provider>
    );
}

// Hook para usar o contexto
export function useLeadsFilters(): LeadsFiltersContextType {
    const context = useContext(LeadsFiltersContext);
    if (!context) {
        throw new Error('useLeadsFilters deve ser usado dentro de LeadsFiltersProvider');
    }
    return context;
}

// Export default para facilitar import
export default LeadsFiltersContext;
