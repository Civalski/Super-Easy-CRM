/**
 * Card individual de prospecto
 */
'use client'

import {
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
} from 'lucide-react';
import { STATUS_OPTIONS, getStatusConfig, type Prospecto } from './ProspectarTypes';

interface ProspectoCardProps {
    prospecto: Prospecto;
    openMenuId: string | null;
    onMenuToggle: (id: string | null) => void;
    onStatusChange: (id: string, status: string) => void;
    onPrioridadeChange: (id: string, prioridade: number) => void;
    onEditObservacao: (id: string, observacoes: string) => void;
    onConverter: (id: string) => void;
    onDelete: (id: string) => void;
}

export function ProspectoCard({
    prospecto,
    openMenuId,
    onMenuToggle,
    onStatusChange,
    onPrioridadeChange,
    onEditObservacao,
    onConverter,
    onDelete,
}: ProspectoCardProps) {
    return (
        <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                                    onClick={() => onPrioridadeChange(prospecto.id, star === prospecto.prioridade ? 0 : star)}
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
                            onChange={(e) => onStatusChange(prospecto.id, e.target.value)}
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
                            onClick={() => onMenuToggle(openMenuId === prospecto.id ? null : prospecto.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {openMenuId === prospecto.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button
                                    onClick={() => {
                                        onEditObservacao(prospecto.id, prospecto.observacoes || '');
                                        onMenuToggle(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Adicionar Observação
                                </button>

                                {prospecto.status !== 'convertido' && (
                                    <button
                                        onClick={() => {
                                            onConverter(prospecto.id);
                                            onMenuToggle(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
    );
}
