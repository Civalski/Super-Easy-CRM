/**
 * Página de Prospecção - Lista e gerencia prospectos importados
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Target,
    Search,
    Filter,
    Loader2,
    Star,
    Phone,
    Mail,
    MapPin,
    Building2,
    MoreVertical,
    UserCheck,
    Trash2,
    MessageSquare,
    ChevronDown,
    RefreshCw,
} from 'lucide-react';
import Swal from 'sweetalert2';

// Tipos
interface Prospecto {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    municipio: string;
    uf: string;
    telefone1: string | null;
    telefone2: string | null;
    email: string | null;
    cnaePrincipalDesc: string | null;
    porte: string | null;
    situacaoCadastral: string | null;
    status: string;
    prioridade: number;
    observacoes: string | null;
    dataImportacao: string;
    ultimoContato: string | null;
    clienteId: string | null;
}

interface Estatisticas {
    total: number;
    novo: number;
    em_contato: number;
    qualificado: number;
    descartado: number;
    convertido: number;
}

interface ProspectosResponse {
    prospectos: Prospecto[];
    estatisticas: Estatisticas;
    paginacao: {
        total: number;
        limit: number;
        offset: number;
    };
}

const STATUS_OPTIONS = [
    { value: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'em_contato', label: 'Em Contato', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'qualificado', label: 'Qualificado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'descartado', label: 'Descartado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    { value: 'convertido', label: 'Convertido', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
];

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
            confirmButtonColor: '#9333ea', // purple-600
            cancelButtonColor: '#6b7280', // gray-500
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
            confirmButtonColor: '#ef4444', // red-500
            cancelButtonColor: '#6b7280', // gray-500
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

    const getStatusConfig = (status: string) => {
        return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prospecção</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Gerencie seus prospectos importados
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => fetchProspectos()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Estatísticas */}
            {estatisticas && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.total}</p>
                    </div>
                    {STATUS_OPTIONS.slice(0, -1).map(status => (
                        <div
                            key={status.value}
                            onClick={() => setStatusFilter(statusFilter === status.value ? '' : status.value)}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition-all ${statusFilter === status.value ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                                }`}
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400">{status.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {estatisticas[status.value as keyof Estatisticas] || 0}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CNPJ ou cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todos os Status</option>
                            {STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Prospectos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-600 dark:text-red-400">
                        {error}
                    </div>
                ) : filteredProspectos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Nenhum prospecto encontrado</p>
                        <p className="text-sm mt-1">Importe leads da aba Leads para começar</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredProspectos.map(prospecto => (
                            <div key={prospecto.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Info Principal */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {prospecto.nomeFantasia || prospecto.razaoSocial}
                                            </h3>

                                            {/* Prioridade (estrelas) */}
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => handlePrioridadeChange(prospecto.id, star === prospecto.prioridade ? 0 : star)}
                                                        className="focus:outline-none"
                                                    >
                                                        <Star
                                                            className={`w-4 h-4 ${star <= prospecto.prioridade
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300 dark:text-gray-600'
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {prospecto.nomeFantasia && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                                                {prospecto.razaoSocial}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {prospecto.municipio}/{prospecto.uf}
                                            </span>

                                            {prospecto.telefone1 && (
                                                <a href={`tel:${prospecto.telefone1}`} className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {prospecto.telefone1}
                                                </a>
                                            )}

                                            {prospecto.email && (
                                                <a href={`mailto:${prospecto.email}`} className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 truncate max-w-[200px]">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    {prospecto.email}
                                                </a>
                                            )}

                                            {prospecto.porte && (
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    {prospecto.porte}
                                                </span>
                                            )}
                                        </div>

                                        {prospecto.observacoes && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                                &quot;{prospecto.observacoes}&quot;
                                            </p>
                                        )}
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-2">
                                        {/* Status Dropdown */}
                                        <div className="relative">
                                            <select
                                                value={prospecto.status}
                                                onChange={(e) => handleStatusChange(prospecto.id, e.target.value)}
                                                disabled={prospecto.status === 'convertido'}
                                                className={`appearance-none px-3 py-1.5 pr-8 rounded-full text-xs font-semibold cursor-pointer ${getStatusConfig(prospecto.status).color} border-0 focus:ring-2 focus:ring-purple-500`}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                                        </div>

                                        {/* Menu de ações */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === prospecto.id ? null : prospecto.id)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>

                                            {openMenuId === prospecto.id && (
                                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(prospecto.id);
                                                            setEditingObs(prospecto.observacoes || '');
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                        Adicionar Observação
                                                    </button>

                                                    {prospecto.status !== 'convertido' && (
                                                        <button
                                                            onClick={() => {
                                                                handleConverter(prospecto.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                            Converter em Cliente
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => {
                                                            handleDelete(prospecto.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Observações */}
            {editingId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingId(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Observações
                        </h3>
                        <textarea
                            value={editingObs}
                            onChange={(e) => setEditingObs(e.target.value)}
                            placeholder="Digite suas observações sobre este prospecto..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveObs}
                                disabled={savingObs}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                            >
                                {savingObs && <Loader2 className="w-4 h-4 animate-spin" />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fechar menu ao clicar fora */}
            {openMenuId && (
                <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />
            )}
        </div>
    );
}
