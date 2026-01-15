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

// Resposta da contagem de leads
export interface LeadsCountResponse {
    total_encontrado: number;
    total_lidos: number;
    filtros: {
        estado: string;
        cidade?: string;
        cnaes_principais?: string;
        cnaes_secundarios?: string;
        exigir_todos_secundarios?: boolean;
        situacao?: string;
        porte?: string;
    };
}

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
            if (filters.cnaes_principais && filters.cnaes_principais.length > 0) {
                queryParams.append('cnaes_principais', filters.cnaes_principais.join(','));
            }
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.filtrar_telefones_invalidos) queryParams.append('filtrar_telefones_invalidos', 'true');
            if (filters.adicionar_nono_digito) queryParams.append('adicionar_nono_digito', 'true');
            if (filters.apenas_celular) queryParams.append('apenas_celular', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);
            if (filters.capital_min !== undefined && filters.capital_min !== null) {
                queryParams.append('capital_min', filters.capital_min.toString());
            }
            if (filters.capital_max !== undefined && filters.capital_max !== null) {
                queryParams.append('capital_max', filters.capital_max.toString());
            }
            if (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null) {
                queryParams.append('ano_inicio_min', filters.ano_inicio_min.toString());
            }
            if (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null) {
                queryParams.append('ano_inicio_max', filters.ano_inicio_max.toString());
            }
            if (filters.mes_inicio !== undefined && filters.mes_inicio !== null) {
                queryParams.append('mes_inicio', filters.mes_inicio.toString());
            }
            if (filters.bairros && filters.bairros.length > 0) {
                queryParams.append('bairros', filters.bairros.join(','));
            }
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

// Hook para contar total de leads
export function useLeadsCount() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState<LeadsCountResponse | null>(null);

    const countLeads = useCallback(async (filters: LeadsSearchFilters) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();

            if (filters.estado) queryParams.append('estado', filters.estado);
            if (filters.cidade) queryParams.append('cidade', filters.cidade);
            if (filters.cnaes_principais && filters.cnaes_principais.length > 0) {
                queryParams.append('cnaes_principais', filters.cnaes_principais.join(','));
            }
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.filtrar_telefones_invalidos) queryParams.append('filtrar_telefones_invalidos', 'true');
            if (filters.adicionar_nono_digito) queryParams.append('adicionar_nono_digito', 'true');
            if (filters.apenas_celular) queryParams.append('apenas_celular', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);
            if (filters.capital_min !== undefined && filters.capital_min !== null) {
                queryParams.append('capital_min', filters.capital_min.toString());
            }
            if (filters.capital_max !== undefined && filters.capital_max !== null) {
                queryParams.append('capital_max', filters.capital_max.toString());
            }
            if (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null) {
                queryParams.append('ano_inicio_min', filters.ano_inicio_min.toString());
            }
            if (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null) {
                queryParams.append('ano_inicio_max', filters.ano_inicio_max.toString());
            }
            if (filters.mes_inicio !== undefined && filters.mes_inicio !== null) {
                queryParams.append('mes_inicio', filters.mes_inicio.toString());
            }
            if (filters.bairros && filters.bairros.length > 0) {
                queryParams.append('bairros', filters.bairros.join(','));
            }

            const response = await fetch(`/api/leads/count?${queryParams.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao contar leads');
            }

            const result: LeadsCountResponse = await response.json();
            setCount(result);
            return result;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCount = useCallback(() => {
        setCount(null);
        setError(null);
    }, []);

    return {
        loading,
        error,
        count,
        countLeads,
        clearCount,
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

export function useCidades() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cidades, setCidades] = useState<Cidade[]>([]);

    const fetchCidades = useCallback(async (estadoParam: string) => {
        if (!estadoParam) {
            setError('Estado não fornecido');
            return [];
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/leads/cidades/${estadoParam}`);

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
    }, []);

    return {
        loading,
        error,
        cidades,
        fetchCidades,
    };
}

// Interface de resposta dos bairros
export interface BairrosResponse {
    estado: string;
    cidade?: string;
    total_bairros: number;
    total_registros: number;
    bairros: string[];
}

export function useBairros() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bairros, setBairros] = useState<string[]>([]);
    const [totalRegistros, setTotalRegistros] = useState<number>(0);

    const fetchBairros = useCallback(async (filters: LeadsSearchFilters) => {
        if (!filters.estado) {
            setError('Estado não fornecido');
            return [];
        }

        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('estado', filters.estado);
            if (filters.cidade) queryParams.append('cidade', filters.cidade);
            if (filters.cnaes_principais && filters.cnaes_principais.length > 0) {
                queryParams.append('cnaes_principais', filters.cnaes_principais.join(','));
            }
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.filtrar_telefones_invalidos) queryParams.append('filtrar_telefones_invalidos', 'true');
            if (filters.apenas_celular) queryParams.append('apenas_celular', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);
            if (filters.capital_min !== undefined && filters.capital_min !== null) {
                queryParams.append('capital_min', filters.capital_min.toString());
            }
            if (filters.capital_max !== undefined && filters.capital_max !== null) {
                queryParams.append('capital_max', filters.capital_max.toString());
            }
            if (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null) {
                queryParams.append('ano_inicio_min', filters.ano_inicio_min.toString());
            }
            if (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null) {
                queryParams.append('ano_inicio_max', filters.ano_inicio_max.toString());
            }
            if (filters.mes_inicio !== undefined && filters.mes_inicio !== null) {
                queryParams.append('mes_inicio', filters.mes_inicio.toString());
            }

            const response = await fetch(`/api/leads/bairros?${queryParams.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar bairros');
            }

            const result: BairrosResponse = await response.json();
            setBairros(result.bairros);
            setTotalRegistros(result.total_registros);
            return result.bairros;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            setBairros([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearBairros = useCallback(() => {
        setBairros([]);
        setError(null);
        setTotalRegistros(0);
    }, []);

    return {
        loading,
        error,
        bairros,
        totalRegistros,
        fetchBairros,
        clearBairros,
    };
}
