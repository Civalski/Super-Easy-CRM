/**
 * Página de Prospecção - Lista e gerencia prospectos importados
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { LayoutList, LayoutGrid } from 'lucide-react';
import {
    ProspectarHeader,
    ProspectosFilters,
    ProspectosList,
    LotesView,
    ObservacoesModal,
    type AgendamentoEnvio,
    type Prospecto,
    type Estatisticas,
    type ProspectosResponse,
} from '@/components/features/prospectar';

export default function ProspectarPage() {
    const [prospectos, setProspectos] = useState<Prospecto[]>([]);
    const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modo de visualização: lista individual ou agrupado por lotes
    const [viewMode, setViewMode] = useState<'lista' | 'lotes'>('lotes');

    // Estado dos lotes (visualização por lotes)
    const [lotesData, setLotesData] = useState<{ lote: string; total: number; dataImportacao: string | null }[]>([]);
    const [totalGeralLotes, setTotalGeralLotes] = useState(0);
    const [loadingLotes, setLoadingLotes] = useState(false);

    // Filtros
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
    const [isSending, setIsSending] = useState(false);
    const [agendamentos, setAgendamentos] = useState<AgendamentoEnvio[]>([]);
    const [loadingAgendamentos, setLoadingAgendamentos] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [cancellingScheduleId, setCancellingScheduleId] = useState<string | null>(null);

    // Carregar prospectos
    const fetchProspectos = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            // Aba Leads sempre mostra apenas leads frios
            params.append('origem', 'leads');
            if (loteFilter) params.append('lote', loteFilter);
            params.append('limit', itemsPerPage.toString());
            params.append('offset', (page * itemsPerPage).toString());

            const response = await fetch(`/api/prospectos?${params.toString()}`);
            if (!response.ok) throw new Error('Erro ao carregar leads');

            const data: ProspectosResponse = await response.json();
            setProspectos(data.prospectos);
            setEstatisticas(data.estatisticas);
            setTotalItems(data.paginacao.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }, [loteFilter, page]);

    // Carregar resumo dos lotes
    const fetchLotes = useCallback(async () => {
        setLoadingLotes(true);
        try {
            const res = await fetch('/api/prospectos/lotes');
            if (!res.ok) throw new Error('Erro ao carregar lotes');
            const data = await res.json();
            setLotesData(data.lotes || []);
            setTotalGeralLotes(data.totalGeral || 0);
        } catch {
            setLotesData([]);
        } finally {
            setLoadingLotes(false);
        }
    }, []);

    const fetchAgendamentos = useCallback(async () => {
        setLoadingAgendamentos(true);
        try {
            const res = await fetch('/api/prospectos/agendamentos?status=ativos');
            if (!res.ok) throw new Error('Erro ao carregar agendamentos');
            const data = await res.json();
            setAgendamentos(data.agendamentos || []);
        } catch {
            setAgendamentos([]);
        } finally {
            setLoadingAgendamentos(false);
        }
    }, []);

    const processarAgendamentosPendentes = useCallback(async () => {
        try {
            const res = await fetch('/api/prospectos/agendamentos/processar', {
                method: 'POST',
            });
            if (!res.ok) return;

            const data = await res.json();
            if ((data.processados ?? 0) > 0) {
                const isDark = document.documentElement.classList.contains('dark');
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `${data.enviados ?? 0} lead(s) enviados automaticamente`,
                    text: `${data.processados} agendamento(s) processado(s) hoje`,
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true,
                    background: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#f3f4f6' : '#111827',
                });
            }
        } catch {
            // Falha silenciosa para nao travar carregamento da pagina
        }
    }, []);

    useEffect(() => {
        processarAgendamentosPendentes();
    }, [processarAgendamentosPendentes]);

    useEffect(() => {
        if (viewMode === 'lista') {
            fetchProspectos();
        } else {
            fetchLotes();
            fetchAgendamentos();
        }
    }, [viewMode, fetchProspectos, fetchLotes, fetchAgendamentos]);

    // Atualizar status
    const handleStatusChange = async (id: string, newStatus: string, options?: { ultimoContato?: string }) => {
        // Guardar estado anterior para rollback
        const previousProspectos = prospectos;

        // Optimistic Update
        setProspectos(prev =>
            prev.map(p => p.id === id ? { ...p, status: newStatus, ...(options?.ultimoContato ? { ultimoContato: options.ultimoContato } : {}) } : p)
        );

        try {
            const payload: Record<string, unknown> = { status: newStatus };
            if (options?.ultimoContato) {
                payload.ultimoContato = options.ultimoContato;
            }

            const response = await fetch(`/api/prospectos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Erro ao atualizar status');

            // Recarregar estatísticas em background para manter sincronia
            fetchProspectos();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);

            // Revert state
            setProspectos(previousProspectos);

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

    const handleToggleContato = (id: string, contatado: boolean) => {
        const novoStatus = contatado ? 'em_contato' : 'novo';
        const ultimoContato = contatado ? new Date().toISOString() : undefined;
        handleStatusChange(id, novoStatus, ultimoContato ? { ultimoContato } : undefined);
    };

    const handleQualificar = async (id: string) => {
        const result = await Swal.fire({
            title: 'Qualificar Prospecto?',
            text: 'Isso marcará o prospecto como qualificado e criará uma proposta comercial.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sim, qualificar!',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/prospectos/${id}/qualificar`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao qualificar prospecto');
            }

            // Remover o prospecto da lista local imediatamente
            setProspectos(prev => prev.filter(p => p.id !== id));

            // Mostrar mensagem de sucesso
            await Swal.fire({
                title: 'Prospecto Qualificado!',
                text: 'Oportunidade criada com sucesso na etapa de Qualificação.',
                icon: 'success',
                confirmButtonColor: '#9333ea',
                confirmButtonText: 'Ótimo',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });

            // Recarregar estatísticas
            fetchProspectos();
        } catch (err) {
            console.error('Erro ao qualificar:', err);
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao qualificar prospecto',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Fechar',
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
            params.append('status', 'lead_frio');

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

    // ====== HANDLERS DE LOTES (modo visualização por lotes) ======

    // Enviar um lote específico ao funil
    const handleEnviarLote = async (lote: string) => {
        const isDark = document.documentElement.classList.contains('dark');
        const bg = isDark ? '#1f2937' : '#ffffff';
        const color = isDark ? '#f3f4f6' : '#111827';

        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Enviar Lote ao Funil',
            html: `Deseja enviar todos os leads do lote <strong>"${lote}"</strong> para o Funil de Prospecção?`,
            showCancelButton: true,
            confirmButtonText: 'Sim, enviar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#7c3aed',
            cancelButtonColor: '#6b7280',
            background: bg,
            color,
        });

        if (!confirm.isConfirmed) return;

        setIsSending(true);
        try {
            const response = await fetch('/api/prospectos/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lote: lote === '(sem lote)' ? '' : lote }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao enviar lote');

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `${data.atualizados} leads do lote "${lote}" enviados ao funil!`,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: bg,
                color,
            });

            fetchLotes(); // Atualizar lista de lotes
        } catch (err) {
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao enviar lote.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: bg,
                color,
            });
        } finally {
            setIsSending(false);
        }
    };

    // Excluir todos os leads de um lote
    const handleExcluirLote = async (lote: string) => {
        const isDark = document.documentElement.classList.contains('dark');
        const bg = isDark ? '#1f2937' : '#ffffff';
        const color = isDark ? '#f3f4f6' : '#111827';

        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Excluir Lote?',
            html: `Todos os leads do lote <strong>"${lote}"</strong> serão excluídos permanentemente.<br><span style="color:#fbbf24">Esta ação não pode ser desfeita.</span>`,
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir lote!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            background: bg,
            color,
        });

        if (!confirm.isConfirmed) return;

        setIsDeleting(true);
        try {
            const params = new URLSearchParams({ all: 'true', lote: lote === '(sem lote)' ? '' : lote, status: 'lead_frio' });
            const response = await fetch(`/api/prospectos/bulk?${params}`, { method: 'DELETE' });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erro ao excluir lote');

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `${data.excluidos} leads excluídos do lote "${lote}"`,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: bg,
                color,
            });

            fetchLotes();
        } catch (err) {
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao excluir lote.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: bg,
                color,
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAgendarLotes = async (itens: { lote: string; dataEnvio: string }[]) => {
        if (itens.length === 0) return;

        const isDark = document.documentElement.classList.contains('dark');
        const bg = isDark ? '#1f2937' : '#ffffff';
        const color = isDark ? '#f3f4f6' : '#111827';
        const preview = itens
            .slice(0, 6)
            .map((item) => `<li><strong>${item.lote}</strong> - ${item.dataEnvio}</li>`)
            .join('');

        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Salvar programacao de envios?',
            html: `
                <p>Serao criados <strong>${itens.length}</strong> agendamento(s).</p>
                <ul style="text-align:left; margin-top: 8px; padding-left: 18px;">
                    ${preview}
                    ${itens.length > 6 ? `<li>... e mais ${itens.length - 6}</li>` : ''}
                </ul>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salvar agenda',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            background: bg,
            color,
        });

        if (!confirm.isConfirmed) return;

        setIsScheduling(true);
        try {
            const response = await fetch('/api/prospectos/agendamentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itens: itens.map((item) => ({
                        lote: item.lote === '(sem lote)' ? null : item.lote,
                        dataEnvio: item.dataEnvio,
                    })),
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao salvar agendamentos');

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `${data.total || itens.length} agendamento(s) criado(s)`,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: bg,
                color,
            });

            fetchAgendamentos();
        } catch (err) {
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao salvar programacao.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: bg,
                color,
            });
        } finally {
            setIsScheduling(false);
        }
    };

    const handleCancelarAgendamento = async (id: string) => {
        const isDark = document.documentElement.classList.contains('dark');
        const bg = isDark ? '#1f2937' : '#ffffff';
        const color = isDark ? '#f3f4f6' : '#111827';

        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Cancelar agendamento?',
            text: 'Este envio automatico nao sera executado.',
            showCancelButton: true,
            confirmButtonText: 'Sim, cancelar',
            cancelButtonText: 'Voltar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            background: bg,
            color,
        });

        if (!confirm.isConfirmed) return;

        setCancellingScheduleId(id);
        try {
            const response = await fetch(`/api/prospectos/agendamentos?id=${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao cancelar agendamento');

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Agendamento cancelado',
                showConfirmButton: false,
                timer: 2500,
                background: bg,
                color,
            });

            fetchAgendamentos();
        } catch (err) {
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao cancelar agendamento.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: bg,
                color,
            });
        } finally {
            setCancellingScheduleId(null);
        }
    };

    // Enviar leads frios ao funil
    const handleEnviarAoFunil = async (opcao: 'selecionados' | 'lote' | 'todos') => {
        const isDark = document.documentElement.classList.contains('dark');
        const bg = isDark ? '#1f2937' : '#ffffff';
        const color = isDark ? '#f3f4f6' : '#111827';

        let descricao = '';
        let payload: Record<string, unknown> = {};

        if (opcao === 'selecionados') {
            if (selectedIds.size === 0) return;
            descricao = `<strong>${selectedIds.size}</strong> lead(s) selecionado(s)`;
            payload = { ids: Array.from(selectedIds) };
        } else if (opcao === 'lote' && loteFilter) {
            descricao = `todos os leads do lote <strong>${loteFilter}</strong>`;
            payload = { lote: loteFilter };
        } else {
            descricao = `<strong>todos</strong> os leads frios (${estatisticas?.lead_frio ?? estatisticas?.total ?? 0})`;
            payload = { todos: true };
        }

        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Enviar ao Funil',
            html: `Deseja enviar ${descricao} para o Funil de Prospecção? Eles aparecerão como <strong>"Prospectar"</strong> no funil.`,
            showCancelButton: true,
            confirmButtonText: 'Sim, enviar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#7c3aed',
            cancelButtonColor: '#6b7280',
            background: bg,
            color,
        });

        if (!confirm.isConfirmed) return;

        setIsSending(true);
        try {
            const response = await fetch('/api/prospectos/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erro ao enviar ao funil');

            setSelectedIds(new Set());

            await Swal.fire({
                icon: 'success',
                title: 'Leads Enviados! 🎯',
                html: `
                    <div style="padding: 10px 0;">
                        <div style="background: #4c1d95; padding: 16px 24px; border-radius: 12px; text-align: center; display: inline-block;">
                            <div style="font-size: 32px; font-weight: bold; color: #c4b5fd;">${data.atualizados?.toLocaleString('pt-BR') || 0}</div>
                            <div style="font-size: 12px; color: #a78bfa;">leads enviados ao funil</div>
                        </div>
                        <p style="margin-top: 12px; color: ${isDark ? '#9ca3af' : '#6b7280'}; font-size: 13px;">Acesse o Funil para ver os leads na etapa de Prospecção.</p>
                    </div>
                `,
                confirmButtonColor: '#7c3aed',
                confirmButtonText: 'Ótimo!',
                background: bg,
                color,
            });

            fetchProspectos();
        } catch (err) {
            console.error('Erro ao enviar ao funil:', err);
            Swal.fire({
                title: 'Erro!',
                text: err instanceof Error ? err.message : 'Erro ao enviar leads ao funil.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: bg,
                color,
            });
        } finally {
            setIsSending(false);
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

    // Importar arquivo
    const handleImport = async (file: File) => {
        try {
            // Mostrar loading inicial
            Swal.fire({
                title: 'Lendo arquivo...',
                text: 'Processando planilha Excel',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });

            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Validar se tem dados
            if (jsonData.length === 0) {
                throw new Error('O arquivo está vazio');
            }

            // Perguntar o tamanho do lote
            const { value: batchSize } = await Swal.fire({
                title: 'Dividir em Lotes',
                text: 'Defina quantos prospectos devem ficar em cada lote (ideal para metas diárias)',
                icon: 'question',
                input: 'number',
                inputValue: 30,
                inputLabel: 'Tamanho do Lote',
                showCancelButton: true,
                confirmButtonText: 'Importar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value || parseInt(value) <= 0) {
                        return 'Por favor, insira um número maior que 0';
                    }
                    return null;
                },
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });

            if (!batchSize) return; // Cancelado pelo usuário

            // Enviar para API
            Swal.update({
                title: 'Importando...',
                text: `Enviando ${jsonData.length} registros para o servidor`
            });

            const response = await fetch('/api/prospectos/importar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    empresas: jsonData,
                    batchSize: parseInt(batchSize),
                    fileName: file.name
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.detalhes || 'Erro ao importar dados');
            }

            // Feedback visual
            await Swal.fire({
                title: 'Importação Concluída!',
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <p class="mb-2">O arquivo foi processado com sucesso.</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                            <div style="background: #065f46; padding: 10px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 20px; font-weight: bold; color: #34d399;">${result.importados}</div>
                                <div style="font-size: 12px; color: #6ee7b7;">Novos</div>
                            </div>
                            <div style="background: #92400e; padding: 10px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">${result.duplicados}</div>
                                <div style="font-size: 12px; color: #fcd34d;">Duplicados</div>
                            </div>
                        </div>
                        ${result.erros && result.erros.length > 0 ? `
                            <div style="margin-top: 15px; max-height: 100px; overflow-y: auto; background: #374151; padding: 8px; border-radius: 4px; font-size: 11px;">
                                <strong style="color: #fca5a5;">Erros (${result.erros.length}):</strong>
                                <ul style="margin-left: 15px; margin-top: 5px; color: #d1d5db;">
                                    ${result.erros.slice(0, 5).map((e: string) => `<li>${e}</li>`).join('')}
                                    ${result.erros.length > 5 ? `<li>...e mais ${result.erros.length - 5} erros</li>` : ''}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `,
                icon: result.importados > 0 ? 'success' : 'warning',
                confirmButtonColor: '#9333ea',
                confirmButtonText: 'Fechar',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });

            // Atualizar lista
            fetchProspectos();

        } catch (err) {
            console.error('Erro ao importar:', err);
            Swal.fire({
                title: 'Erro na Importação',
                text: err instanceof Error ? err.message : 'Não foi possível processar o arquivo.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            });
        }
    };


    return (
        <div className="space-y-6">
            {/* Header com toggle de visualização */}
            <ProspectarHeader
                loading={viewMode === 'lista' ? loading : loadingLotes}
                isSending={isSending}
                totalLeadsFrios={viewMode === 'lotes' ? totalGeralLotes : (estatisticas?.lead_frio ?? estatisticas?.total ?? 0)}
                selectedCount={selectedIds.size}
                loteFilter={loteFilter}
                onRefresh={viewMode === 'lotes'
                    ? () => {
                        fetchLotes();
                        fetchAgendamentos();
                    }
                    : fetchProspectos}
                onImport={handleImport}
                onEnviarAoFunil={viewMode === 'lista' ? handleEnviarAoFunil : undefined}
            />

            {/* Toggle Lotes / Lista */}
            <div className="flex items-center gap-1 p-1 bg-gray-900 border border-gray-700 rounded-xl w-fit">
                <button
                    onClick={() => setViewMode('lotes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'lotes'
                            ? 'bg-gray-700 text-sky-300 shadow-sm'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                        }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Por Lotes
                </button>
                <button
                    onClick={() => setViewMode('lista')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'lista'
                            ? 'bg-gray-700 text-sky-300 shadow-sm'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                        }`}
                >
                    <LayoutList className="w-4 h-4" />
                    Lista Completa
                </button>
            </div>

            {/* ===== MODO LOTES ===== */}
            {viewMode === 'lotes' && (
                <LotesView
                    lotes={lotesData}
                    totalGeral={totalGeralLotes}
                    loadingLotes={loadingLotes}
                    isSending={isSending}
                    isDeleting={isDeleting}
                    agendamentos={agendamentos}
                    loadingAgendamentos={loadingAgendamentos}
                    isScheduling={isScheduling}
                    cancellingScheduleId={cancellingScheduleId}
                    onEnviarLote={handleEnviarLote}
                    onEnviarTodos={() => handleEnviarAoFunil('todos')}
                    onExcluirLote={handleExcluirLote}
                    onAgendarLotes={handleAgendarLotes}
                    onCancelarAgendamento={handleCancelarAgendamento}
                    onRefresh={() => {
                        fetchLotes();
                        fetchAgendamentos();
                    }}
                />
            )}

            {/* ===== MODO LISTA ===== */}
            {viewMode === 'lista' && (
                <>
                    <ProspectosFilters
                        searchTerm={searchTerm}
                        statusFilter={'lead_frio'}
                        loteFilter={loteFilter}
                        lotes={estatisticas?.lotes || []}
                        selectedCount={selectedIds.size}
                        totalCount={filteredProspectos.length}
                        isDeleting={isDeleting}
                        totalAll={estatisticas?.total || 0}
                        onSearchChange={setSearchTerm}
                        onStatusFilterChange={() => { }}
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
                        onToggleContato={handleToggleContato}
                        onQualificar={handleQualificar}
                    />

                    {/* Paginação */}
                    {!loading && totalPages > 1 && (
                        <div className="crm-card-soft p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Exibindo {page * itemsPerPage + 1} - {Math.min((page + 1) * itemsPerPage, totalItems)} de {totalItems.toLocaleString('pt-BR')} leads
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
                                        Página {page + 1} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
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
