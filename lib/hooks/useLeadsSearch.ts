/**
 * Hook para buscar leads dos arquivos .parquet
 */
'use client';

import { useState, useCallback } from 'react';
import type {
    LeadsSearchFilters,
    LeadsSearchResponse,
    Estado,
    Cidade,
    EstadosResponse,
    CidadesResponse
} from '@/types/leads';

export function useLeadsSearch() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<LeadsSearchResponse | null>(null);

    const searchLeads = useCallback(async (filters: LeadsSearchFilters) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();

            if (filters.estado) queryParams.append('estado', filters.estado);
            if (filters.cidade) queryParams.append('cidade', filters.cidade);
            if (filters.cnae_principal) queryParams.append('cnae_principal', filters.cnae_principal);
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);
            if (filters.limit) queryParams.append('limit', filters.limit.toString());

            const response = await fetch(`/api/leads/search?${queryParams.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar leads');
            }

            const result = await response.json();
            setData(result);
            return result;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    return {
        loading,
        error,
        data,
        searchLeads,
        clearResults,
    };
}

export function useEstados() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [estados, setEstados] = useState<Estado[]>([]);

    const fetchEstados = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/leads/estados');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar estados');
            }

            const result: EstadosResponse = await response.json();
            setEstados(result.estados);
            return result.estados;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        estados,
        fetchEstados,
    };
}

export function useCidades(estado?: string) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cidades, setCidades] = useState<Cidade[]>([]);

    const fetchCidades = useCallback(async (estadoParam?: string) => {
        const estadoToFetch = estadoParam || estado;

        if (!estadoToFetch) {
            setError('Estado não fornecido');
            return [];
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/leads/cidades/${estadoToFetch}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar cidades');
            }

            const result: CidadesResponse = await response.json();
            setCidades(result.cidades);
            return result.cidades;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            setCidades([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [estado]);

    return {
        loading,
        error,
        cidades,
        fetchCidades,
    };
}
