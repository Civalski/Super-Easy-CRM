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
    const [loteFilter, setLoteFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Paginação
    const [page, setPage] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 50;

    // Modal de observações
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingObs, setEditingObs] = useState('');
    const [savingObs, setSavingObs] = useState(false);

    // Menu de ações
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Seleção múltipla
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    // Carregar prospectos
    const fetchProspectos = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (loteFilter) params.append('lote', loteFilter);
            params.append('limit', itemsPerPage.toString());
            params.append('offset', (page * itemsPerPage).toString());

            const response = await fetch(`/api/prospectos?${params.toString()}`);
            if (!response.ok) throw new Error('Erro ao carregar prospectos');

            const data: ProspectosResponse = await response.json();
            setProspectos(data.prospectos);
            setEstatisticas(data.estatisticas);
            setTotalItems(data.paginacao.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, loteFilter, page]);

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
                background: '#1f2937',
                color: '#f3f4f6',
            });
        }
    };

    // Excluir múltiplos prospectos
    const handleDeleteMultiple = async () => {
        if (selectedIds.size === 0) return;

        const result = await Swal.fire({
            title: 'Excluir Prospectos Selecionados?',
            html: `<p>Você está prestes a excluir <strong>${selectedIds.size}</strong> prospecto(s).</p><p style="color: #fbbf24; margin-top: 8px;">Esta ação não pode ser desfeita.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Sim, excluir todos',
            cancelButtonText: 'Cancelar',
            background: '#1f2937',
            color: '#f3f4f6',
        });

        if (!result.isConfirmed) return;

        setIsDeleting(true);
        let excluidos = 0;
        let erros = 0;

        try {
            // Excluir em paralelo (em lotes de 10)
            const ids = Array.from(selectedIds);
            const batchSize = 10;

            for (let i = 0; i < ids.length; i += batchSize) {
                const batch = ids.slice(i, i + batchSize);
                const results = await Promise.allSettled(
                    batch.map(id =>
                        fetch(`/api/prospectos/${id}`, { method: 'DELETE' })
                    )
                );

                results.forEach(r => {
                    if (r.status === 'fulfilled' && r.value.ok) {
                        excluidos++;
                    } else {
                        erros++;
                    }
                });
            }

            // Limpar seleção
            setSelectedIds(new Set());

            // Mostrar resultado
            await Swal.fire({
                icon: erros === 0 ? 'success' : 'warning',
                title: erros === 0 ? 'Prospectos Excluidos' : 'Exclusao Parcial',
                html: `
                    <div style="display: flex; gap: 16px; justify-content: center; padding: 10px 0;">
                        <div style="background: #065f46; padding: 12px 20px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #34d399;">${excluidos}</div>
                            <div style="font-size: 11px; color: #6ee7b7;">Excluidos</div>
                        </div>
                        ${erros > 0 ? `
                        <div style="background: #7f1d1d; padding: 12px 20px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #fca5a5;">${erros}</div>
                            <div style="font-size: 11px; color: #fecaca;">Erros</div>
                        </div>` : ''}
                    </div>
                `,
                confirmButtonColor: '#6366f1',
                background: '#1f2937',
                color: '#f3f4f6',
            });

            fetchProspectos();
        } catch (err) {
            console.error('Erro ao excluir múltiplos:', err);
            Swal.fire({
                title: 'Erro!',
                text: 'Ocorreu um erro ao excluir os prospectos.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: '#1f2937',
                color: '#f3f4f6',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Toggle seleção de um prospecto
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Excluir TODOS os prospectos
    const handleDeleteAll = async () => {
        const total = estatisticas?.total || 0;
        if (total === 0) return;

        const result = await Swal.fire({
            title: 'Limpar Todos os Prospectos?',
            html: `
                <div style="text-align: left; padding: 10px 0;">
                    <p style="color: #e5e7eb; margin-bottom: 12px;">Voce esta prestes a excluir <strong style="color: #ef4444;">${total.toLocaleString('pt-BR')}</strong> prospecto(s).</p>
                    <div style="background: #7f1d1d; border: 1px solid #ef4444; border-radius: 8px; padding: 12px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px; font-weight: bold;">
                            ATENCAO: Esta acao NAO pode ser desfeita!
                        </p>
                    </div>
                    <p style="color: #9ca3af; font-size: 13px; margin-top: 12px;">
                        Todos os prospectos serao removidos permanentemente.
                    </p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Sim, excluir TODOS',
            cancelButtonText: 'Cancelar',
            background: '#1f2937',
            color: '#f3f4f6',
        });

        if (!result.isConfirmed) return;

        setIsDeleting(true);

        try {
            const params = new URLSearchParams();
            params.append('all', 'true');
            if (loteFilter) params.append('lote', loteFilter);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/prospectos/bulk?${params.toString()}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao excluir');
            }

            await Swal.fire({
                icon: 'success',
                title: 'Prospectos Excluidos',
                html: `
                    <div style="padding: 10px 0;">
                        <div style="background: #065f46; padding: 16px 24px; border-radius: 12px; text-align: center; display: inline-block;">
                            <div style="font-size: 32px; font-weight: bold; color: #34d399;">${data.excluidos?.toLocaleString('pt-BR') || 0}</div>
                            <div style="font-size: 12px; color: #6ee7b7;">Prospectos excluidos</div>
                        </div>
                    </div>
                `,
                confirmButtonColor: '#6366f1',
                background: '#1f2937',
                color: '#f3f4f6',
            });

            setSelectedIds(new Set());
            fetchProspectos();
        } catch (err) {
            console.error('Erro ao excluir todos:', err);
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao excluir prospectos.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: '#1f2937',
                color: '#f3f4f6',
            });
        } finally {
            setIsDeleting(false);
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
            p.cnpj.includes(term) ||
            p.lote?.toLowerCase().includes(term)
        );
    });

    // Selecionar/desselecionar todos da página atual
    const handleSelectAll = () => {
        if (selectedIds.size === filteredProspectos.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProspectos.map(p => p.id)));
        }
    };

    // Total de páginas
    const totalPages = Math.ceil(totalItems / itemsPerPage);

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
                loteFilter={loteFilter}
                lotes={estatisticas?.lotes || []}
                selectedCount={selectedIds.size}
                totalCount={filteredProspectos.length}
                isDeleting={isDeleting}
                totalAll={estatisticas?.total || 0}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={(v) => { setStatusFilter(v); setPage(0); }}
                onLoteFilterChange={(v) => { setLoteFilter(v); setPage(0); }}
                onSelectAll={handleSelectAll}
                onDeleteSelected={handleDeleteMultiple}
                onDeleteAll={handleDeleteAll}
            />

            <ProspectosList
                prospectos={filteredProspectos}
                loading={loading}
                error={error}
                openMenuId={openMenuId}
                selectedIds={selectedIds}
                onMenuToggle={setOpenMenuId}
                onStatusChange={handleStatusChange}
                onPrioridadeChange={handlePrioridadeChange}
                onEditObservacao={handleEditObservacao}
                onConverter={handleConverter}
                onDelete={handleDelete}
                onToggleSelect={handleToggleSelect}
            />

            {/* Paginacao */}
            {!loading && totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Exibindo {page * itemsPerPage + 1} - {Math.min((page + 1) * itemsPerPage, totalItems)} de {totalItems.toLocaleString('pt-BR')} prospectos
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                Anterior
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                Pagina {page + 1} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                Proxima
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
