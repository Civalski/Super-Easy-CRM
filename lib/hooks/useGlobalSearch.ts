/**
 * Hook para busca global de clientes, oportunidades e pedidos
 */
import { useState, useEffect, useCallback } from 'react';

export interface ClienteResultado {
    id: string;
    nome: string;
    email: string | null;
    empresa: string | null;
}

export interface OportunidadeResultado {
    id: string;
    titulo: string;
    cliente: {
        nome: string;
    };
}

export interface PedidoResultado {
    id: string;
    numero: number;
    oportunidade: {
        titulo: string;
        cliente: {
            nome: string;
        };
    };
}

export interface BuscaResultado {
    clientes: ClienteResultado[];
    oportunidades: OportunidadeResultado[];
    pedidos: PedidoResultado[];
}

const MAX_RESULTADOS_GLOBAIS = 5;
const SEARCH_CACHE_TTL_MS = 60 * 1000;
const searchCache = new Map<string, { data: BuscaResultado; expiresAt: number }>();

function readSearchCache(key: string) {
    const cached = searchCache.get(key);
    if (!cached) return null;

    if (cached.expiresAt < Date.now()) {
        searchCache.delete(key);
        return null;
    }

    return cached.data;
}

function writeSearchCache(key: string, data: BuscaResultado) {
    searchCache.set(key, {
        data,
        expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    });
}

function limitarResultadosGlobais(resultados: BuscaResultado): BuscaResultado {
    const clientes = [...resultados.clientes];
    const oportunidades = [...resultados.oportunidades];
    const pedidos = [...resultados.pedidos];

    const limitados: BuscaResultado = {
        clientes: [],
        oportunidades: [],
        pedidos: [],
    };

    let total = 0;
    while (total < MAX_RESULTADOS_GLOBAIS) {
        let adicionou = false;

        if (clientes.length > 0 && total < MAX_RESULTADOS_GLOBAIS) {
            const cliente = clientes.shift();
            if (cliente) {
                limitados.clientes.push(cliente);
                total += 1;
                adicionou = true;
            }
        }

        if (oportunidades.length > 0 && total < MAX_RESULTADOS_GLOBAIS) {
            const oportunidade = oportunidades.shift();
            if (oportunidade) {
                limitados.oportunidades.push(oportunidade);
                total += 1;
                adicionou = true;
            }
        }

        if (pedidos.length > 0 && total < MAX_RESULTADOS_GLOBAIS) {
            const pedido = pedidos.shift();
            if (pedido) {
                limitados.pedidos.push(pedido);
                total += 1;
                adicionou = true;
            }
        }

        if (!adicionou) {
            break;
        }
    }

    return limitados;
}

export function useGlobalSearch() {
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState<BuscaResultado | null>(null);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [carregando, setCarregando] = useState(false);

    // Busca com debounce
    useEffect(() => {
        const controller = new AbortController();

        const buscar = async () => {
            const termo = busca.trim();
            if (termo.length < 2) {
                setResultados(null);
                setMostrarResultados(false);
                return;
            }

            const cacheKey = termo.toLowerCase();
            const cached = readSearchCache(cacheKey);
            if (cached) {
                setResultados(limitarResultadosGlobais(cached));
                setMostrarResultados(true);
                return;
            }

            setCarregando(true);
            try {
                const response = await fetch(`/api/busca?q=${encodeURIComponent(termo)}`, {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();

                // Garantir que clientes e oportunidades sejam sempre arrays
                const resultadosValidados: BuscaResultado = {
                    clientes: Array.isArray(data.clientes) ? data.clientes : [],
                    oportunidades: Array.isArray(data.oportunidades) ? data.oportunidades : [],
                    pedidos: Array.isArray(data.pedidos) ? data.pedidos : [],
                };

                writeSearchCache(cacheKey, resultadosValidados);
                setResultados(limitarResultadosGlobais(resultadosValidados));
                setMostrarResultados(true);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('Erro ao buscar:', error);
                setResultados({ clientes: [], oportunidades: [], pedidos: [] });
            } finally {
                if (!controller.signal.aborted) {
                    setCarregando(false);
                }
            }
        };

        const timeoutId = setTimeout(buscar, 300);
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [busca]);

    const totalResultados =
        (resultados?.clientes.length || 0) +
        (resultados?.oportunidades.length || 0) +
        (resultados?.pedidos.length || 0);

    const limparBusca = useCallback(() => {
        setBusca('');
        setResultados(null);
        setMostrarResultados(false);
    }, []);

    const fecharResultados = useCallback(() => {
        setMostrarResultados(false);
    }, []);

    const abrirResultados = useCallback(() => {
        if (resultados && totalResultados > 0) {
            setMostrarResultados(true);
        }
    }, [resultados, totalResultados]);

    return {
        busca,
        setBusca,
        resultados,
        mostrarResultados,
        carregando,
        totalResultados,
        limparBusca,
        fecharResultados,
        abrirResultados,
    };
}
