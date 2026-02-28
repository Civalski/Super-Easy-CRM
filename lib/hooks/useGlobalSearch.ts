/**
 * Hook para busca global de clientes e oportunidades
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

export interface BuscaResultado {
    clientes: ClienteResultado[];
    oportunidades: OportunidadeResultado[];
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
            if (busca.trim().length < 2) {
                setResultados(null);
                setMostrarResultados(false);
                return;
            }

            setCarregando(true);
            try {
                const response = await fetch(`/api/busca?q=${encodeURIComponent(busca)}`, {
                    signal: controller.signal,
                });
                const data = await response.json();

                // Garantir que clientes e oportunidades sejam sempre arrays
                const resultadosValidados: BuscaResultado = {
                    clientes: Array.isArray(data.clientes) ? data.clientes : [],
                    oportunidades: Array.isArray(data.oportunidades) ? data.oportunidades : [],
                };

                setResultados(resultadosValidados);
                setMostrarResultados(true);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('Erro ao buscar:', error);
                setResultados({ clientes: [], oportunidades: [] });
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

    const totalResultados = (resultados?.clientes.length || 0) + (resultados?.oportunidades.length || 0);

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
