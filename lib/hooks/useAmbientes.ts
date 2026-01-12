/**
 * Hook para gerenciamento de ambientes (fetch, create, update, delete)
 */
import { useState, useCallback } from 'react';

export interface Ambiente {
    id: string;
    nome: string;
    descricao: string | null;
}

export function useAmbientes(
    ambienteSelecionado: string | null,
    onAmbienteChange: (id: string | null) => void
) {
    const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchAmbientes = useCallback(async () => {
        try {
            const response = await fetch('/api/ambientes');
            const data = await response.json();

            if (Array.isArray(data)) {
                setAmbientes(data);

                // Se não há ambiente selecionado e existem ambientes, seleciona o primeiro
                if (!ambienteSelecionado && data.length > 0) {
                    onAmbienteChange(data[0].id);
                }
            } else {
                console.error('API retornou dados em formato inesperado:', data);
                setAmbientes([]);
            }
        } catch (error) {
            console.error('Erro ao carregar ambientes:', error);
            setAmbientes([]);
        } finally {
            setLoading(false);
        }
    }, [ambienteSelecionado, onAmbienteChange]);

    const createAmbiente = async (nome: string, descricao: string | null): Promise<Ambiente | null> => {
        setCreating(true);

        try {
            const response = await fetch('/api/ambientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, descricao }),
            });

            if (response.ok) {
                const novoAmbiente = await response.json();
                setAmbientes([...ambientes, novoAmbiente]);
                onAmbienteChange(novoAmbiente.id);
                return novoAmbiente;
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao criar ambiente');
                return null;
            }
        } catch (error) {
            console.error('Erro ao criar ambiente:', error);
            alert('Erro ao criar ambiente. Tente novamente.');
            return null;
        } finally {
            setCreating(false);
        }
    };

    const updateAmbiente = async (id: string, nome: string, descricao: string | null): Promise<Ambiente | null> => {
        setEditing(true);

        try {
            const response = await fetch(`/api/ambientes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, descricao }),
            });

            if (response.ok) {
                const ambienteAtualizado = await response.json();
                setAmbientes(ambientes.map(a => a.id === id ? ambienteAtualizado : a));

                if (ambienteSelecionado === id) {
                    onAmbienteChange(ambienteAtualizado.id);
                }
                return ambienteAtualizado;
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao editar ambiente');
                return null;
            }
        } catch (error) {
            console.error('Erro ao editar ambiente:', error);
            alert('Erro ao editar ambiente. Tente novamente.');
            return null;
        } finally {
            setEditing(false);
        }
    };

    const deleteAmbiente = async (id: string): Promise<boolean> => {
        setDeleting(true);

        try {
            const response = await fetch(`/api/ambientes/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const novosAmbientes = ambientes.filter(a => a.id !== id);
                setAmbientes(novosAmbientes);

                if (ambienteSelecionado === id) {
                    if (novosAmbientes.length > 0) {
                        onAmbienteChange(novosAmbientes[0].id);
                    } else {
                        onAmbienteChange(null);
                    }
                }
                return true;
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao excluir ambiente');
                return false;
            }
        } catch (error) {
            console.error('Erro ao excluir ambiente:', error);
            alert('Erro ao excluir ambiente. Tente novamente.');
            return false;
        } finally {
            setDeleting(false);
        }
    };

    return {
        ambientes,
        loading,
        creating,
        editing,
        deleting,
        fetchAmbientes,
        createAmbiente,
        updateAmbiente,
        deleteAmbiente,
    };
}
