/**
 * Lista de prospectos
 */
'use client'

import {
    Loader2,
    Target,
    CheckSquare,
    Square,
    Phone,
    Mail,
    MapPin,
    Star,
    MoreVertical,
    UserCheck,
    Trash2,
    MessageSquare,
    ChevronDown,
    CheckCircle2,
    Eye,
} from '@/lib/icons';
import Link from 'next/link';
import { STATUS_OPTIONS, getStatusConfig, type Prospecto } from './ProspectarTypes';

interface ProspectosListProps {
    prospectos: Prospecto[];
    loading: boolean;
    error: string | null;
    openMenuId: string | null;
    selectedIds: Set<string>;
    onMenuToggle: (id: string | null) => void;
    onStatusChange: (id: string, status: string) => void;
    onPrioridadeChange: (id: string, prioridade: number) => void;
    onEditObservacao: (id: string, observacoes: string) => void;
    onConverter: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleSelect: (id: string) => void;
    onToggleContato: (id: string, contatado: boolean) => void;
    onQualificar: (id: string) => void;
}

export function ProspectosList({
    prospectos,
    loading,
    error,
    openMenuId,
    selectedIds,
    onMenuToggle,
    onStatusChange,
    onPrioridadeChange,
    onEditObservacao,
    onConverter,
    onDelete,
    onToggleSelect,
    onToggleContato,
    onQualificar,
}: ProspectosListProps) {
    if (loading) {
        return (
            <div className="crm-card-soft">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="crm-card-soft">
                <div className="text-center py-12 text-red-600 dark:text-red-400">
                    {error}
                </div>
            </div>
        );
    }

    if (prospectos.length === 0) {
        return (
            <div className="crm-card-soft">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum lead encontrado</p>
                    <p className="text-sm mt-1">Importe um arquivo CSV para adicionar leads frios</p>
                </div>
            </div>
        );
    }

    const formatDate = (value: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="crm-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed">
                    <thead className="crm-table-head">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[48px]">
                                Sel.
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[30%]">
                                Empresa
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[22%]">
                                Contato
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[12%]">
                                Contatado
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[16%]">
                                Status
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">
                                A??es
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {prospectos.map(prospecto => {
                            const isSelected = selectedIds.has(prospecto.id);
                            const isLeadFrio = prospecto.status === 'lead_frio';
                            const isContacted = prospecto.status !== 'novo' && !isLeadFrio;
                            const canToggleContato = prospecto.status === 'novo' || prospecto.status === 'em_contato';
                            const canQualificar = prospecto.status === 'novo' || prospecto.status === 'em_contato';

                            return (
                                <tr
                                    key={prospecto.id}
                                    className={`transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                                        }`}
                                >
                                    <td className="px-3 py-3">
                                        <button
                                            onClick={() => onToggleSelect(prospecto.id)}
                                            className="shrink-0 focus:outline-hidden"
                                            aria-label={isSelected ? 'Desmarcar' : 'Selecionar'}
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-purple-500" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={prospecto.nomeFantasia || prospecto.razaoSocial}>
                                                    {prospecto.nomeFantasia || prospecto.razaoSocial}
                                                </div>
                                                {prospecto.nomeFantasia && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={prospecto.razaoSocial}>
                                                        {prospecto.razaoSocial}
                                                    </div>
                                                )}
                                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {prospecto.municipio}/{prospecto.uf}
                                                    </span>
                                                    <span className="text-gray-300 dark:text-gray-600">?</span>
                                                    <span className="truncate">{prospecto.cnpj}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => onPrioridadeChange(prospecto.id, star === prospecto.prioridade ? 0 : star)}
                                                        className="focus:outline-hidden"
                                                        aria-label={`Prioridade ${star}`}
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
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="space-y-1 min-w-0">
                                            {prospecto.telefone1 && (
                                                <a href={`tel:${prospecto.telefone1}`} className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                                                    <Phone className="w-3.5 h-3.5 mr-1 shrink-0" />
                                                    <span className="truncate">{prospecto.telefone1}</span>
                                                </a>
                                            )}
                                            {prospecto.email && (
                                                <a href={`mailto:${prospecto.email}`} className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                                                    <Mail className="w-3.5 h-3.5 mr-1 shrink-0" />
                                                    <span className="truncate" title={prospecto.email}>{prospecto.email}</span>
                                                </a>
                                            )}
                                            {!prospecto.telefone1 && !prospecto.email && (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                            {prospecto.ultimoContato && (
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    ?ltimo contato: {formatDate(prospecto.ultimoContato)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleContato(prospecto.id, prospecto.status === 'novo');
                                            }}
                                            disabled={!canToggleContato}
                                            className={`flex items-center justify-center w-full transition-opacity ${!canToggleContato ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                                                }`}
                                            title={isContacted ? 'Contatado' : 'Marcar como contatado'}
                                            aria-label={isContacted ? 'Contatado' : 'Marcar como contatado'}
                                        >
                                            {isContacted ? (
                                                <CheckSquare className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="relative">
                                            <select
                                                value={prospecto.status}
                                                onChange={(e) => onStatusChange(prospecto.id, e.target.value)}
                                                disabled={prospecto.status === 'convertido'}
                                                className={`appearance-none w-full px-3 py-1.5 pr-8 rounded-full text-[11px] font-semibold cursor-pointer ${getStatusConfig(prospecto.status).color} border-0 focus:ring-2 focus:ring-purple-500`}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option
                                                        key={s.value}
                                                        value={s.value}
                                                        className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                                    >
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/clientes/${prospecto.id}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                                                title="Ver detalhes"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Ver
                                            </Link>
                                            <button
                                                onClick={() => onQualificar(prospecto.id)}
                                                disabled={!canQualificar}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 transition-colors"
                                                title={canQualificar ? 'Mover para em potencial' : 'Marque como contatado primeiro'}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Em potencial
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() => onMenuToggle(openMenuId === prospecto.id ? null : prospecto.id)}
                                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                                                    aria-label="Abrir menu"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                                </button>

                                                {openMenuId === prospecto.id && (
                                                    <div className="absolute right-0 mt-1 w-48 min-w-[140px] max-w-[calc(100vw-2rem)] crm-card-soft z-10">
                                                        <button
                                                            onClick={() => {
                                                                onEditObservacao(prospecto.id, prospecto.observacoes || '');
                                                                onMenuToggle(null);
                                                            }}
                                                            className="w-full flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            Adicionar Observa??o
                                                        </button>

                                                        {prospecto.status !== 'convertido' && (
                                                            <button
                                                                onClick={() => {
                                                                    onConverter(prospecto.id);
                                                                    onMenuToggle(null);
                                                                }}
                                                                className="w-full flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
                                                            >
                                                                <UserCheck className="w-4 h-4" />
                                                                Converter em Cliente
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                onDelete(prospecto.id);
                                                                onMenuToggle(null);
                                                            }}
                                                            className="w-full flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

