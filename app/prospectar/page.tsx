/**
 * Página de Prospecção - Lista e gerencia prospectos importados
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
    ProspectarHeader,
    ProspectosEstatisticas,
    ProspectosFilters,
    ProspectosList,
    ObservacoesModal,
    type Prospecto,
    type Estatisticas,
    type ProspectosResponse,
} from '@/components/features/prospectar';

export default function ProspectarPage() {
    const [prospectos, setProspectos] = useState<Prospecto[]>([]);
    const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal de observações
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingObs, setEditingObs] = useState('');
    const [savingObs, setSavingObs] = useState(false);

    // Menu de ações
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Carregar prospectos
    const fetchProspectos = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/prospectos?${params.toString()}`);
            if (!response.ok) throw new Error('Erro ao carregar prospectos');

            const data: ProspectosResponse = await response.json();
            setProspectos(data.prospectos);
            setEstatisticas(data.estatisticas);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchProspectos();
    }, [fetchProspectos]);

    // Atualizar status
    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/prospectos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Erro ao atualizar status');

            // Atualizar local
            setProspectos(prev =>
                prev.map(p => p.id === id ? { ...p, status: newStatus } : p)
            );

            // Recarregar estatísticas
            fetchProspectos();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Erro ao atualizar status',
                showConfirmButton: false,
                timer: 3000,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });
        }
    };

    // Atualizar prioridade
    const handlePrioridadeChange = async (id: string, prioridade: number) => {
        try {
            const response = await fetch(`/api/prospectos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prioridade }),
            });

            if (!response.ok) throw new Error('Erro ao atualizar prioridade');

            setProspectos(prev =>
                prev.map(p => p.id === id ? { ...p, prioridade } : p)
            );
        } catch (err) {
            console.error('Erro ao atualizar prioridade:', err);
        }
    };

    // Salvar observações
    const handleSaveObs = async () => {
        if (!editingId) return;

        setSavingObs(true);
        try {
            const response = await fetch(`/api/prospectos/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    observacoes: editingObs,
                    ultimoContato: new Date().toISOString()
                }),
            });

            if (!response.ok) throw new Error('Erro ao salvar observações');

            setProspectos(prev =>
                prev.map(p => p.id === editingId ? { ...p, observacoes: editingObs } : p)
            );
            setEditingId(null);
            setEditingObs('');
        } catch (err) {
            console.error('Erro ao salvar:', err);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Erro ao salvar observações',
                showConfirmButton: false,
                timer: 3000,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });
        } finally {
            setSavingObs(false);
        }
    };

    // Converter em cliente
    const handleConverter = async (id: string) => {
        const result = await Swal.fire({
            title: 'Converter em Cliente?',
            text: 'Este prospecto será convertido em cliente e removido da lista de prospecção.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sim, converter!',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/prospectos/${id}/converter`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao converter');
            }

            // Remover o prospecto da lista local imediatamente
            setProspectos(prev => prev.filter(p => p.id !== id));

            // Mostrar mensagem de sucesso
            await Swal.fire({
                title: 'Convertido com Sucesso!',
                html: `<p>O cliente <strong>"${data.cliente.nome}"</strong> foi criado com sucesso!</p>`,
                icon: 'success',
                confirmButtonColor: '#9333ea',
                confirmButtonText: 'Ótimo!',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });

            // Recarregar estatísticas
            fetchProspectos();
        } catch (err) {
            console.error('Erro ao converter:', err);
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao converter prospecto',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Fechar',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });
        }
    };

    // Excluir prospecto
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Excluir Prospecto?',
            text: 'Esta ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/prospectos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Erro ao excluir');

            setProspectos(prev => prev.filter(p => p.id !== id));

            // Mostrar toast de sucesso
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Prospecto excluído!',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });

            fetchProspectos(); // Atualizar estatísticas
        } catch (err) {
            console.error('Erro ao excluir:', err);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível excluir o prospecto.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Fechar',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });
        }
    };

    // Filtrar por termo de busca
    const filteredProspectos = prospectos.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.razaoSocial.toLowerCase().includes(term) ||
            p.nomeFantasia?.toLowerCase().includes(term) ||
            p.municipio.toLowerCase().includes(term) ||
            p.cnpj.includes(term)
        );
    });

    const handleEditObservacao = (id: string, obs: string) => {
        setEditingId(id);
        setEditingObs(obs);
    };

    return (
        <div className="space-y-6">
            <ProspectarHeader loading={loading} onRefresh={fetchProspectos} />

            {estatisticas && (
                <ProspectosEstatisticas
                    estatisticas={estatisticas}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                />
            )}

            <ProspectosFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
            />

            <ProspectosList
                prospectos={filteredProspectos}
                loading={loading}
                error={error}
                openMenuId={openMenuId}
                onMenuToggle={setOpenMenuId}
                onStatusChange={handleStatusChange}
                onPrioridadeChange={handlePrioridadeChange}
                onEditObservacao={handleEditObservacao}
                onConverter={handleConverter}
                onDelete={handleDelete}
            />

            <ObservacoesModal
                isOpen={editingId !== null}
                observacoes={editingObs}
                saving={savingObs}
                onObservacoesChange={setEditingObs}
                onSave={handleSaveObs}
                onClose={() => setEditingId(null)}
            />

            {/* Fechar menu ao clicar fora */}
            {openMenuId && (
                <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />
            )}
        </div>
    );
}
