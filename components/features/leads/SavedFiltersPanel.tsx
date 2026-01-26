/**
 * Painel para gerenciar filtros salvos
 * Permite salvar, carregar e excluir filtros de busca de leads
 */
'use client';

import { useState } from 'react';
import { useLeadsFilters, type SavedFilter } from '@/lib/context';
import {
    Save,
    FolderOpen,
    Trash2,
    ChevronDown,
    ChevronUp,
    Clock,
    X,
    Check,
    Edit2,
    BookmarkPlus
} from 'lucide-react';
import Swal from 'sweetalert2';

// Formatar data para exibição
function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Gerar resumo dos filtros
function getFilterSummary(filters: SavedFilter['filters']): string {
    const parts: string[] = [];

    if (filters.brasil_inteiro) {
        parts.push('🗺️ Brasil Inteiro');
    } else if (filters.estados && filters.estados.length > 0) {
        parts.push(`📍 ${filters.estados.join(', ')}`);
    } else if (filters.estado) {
        parts.push(`📍 ${filters.estado}`);
    }

    if (filters.cnaes_principais && filters.cnaes_principais.length > 0) {
        parts.push(`🏢 ${filters.cnaes_principais.length} CNAE(s)`);
    }

    if (filters.situacao) {
        parts.push(`📋 ${filters.situacao}`);
    }

    if (filters.porte) {
        parts.push(`📊 ${filters.porte}`);
    }

    if (filters.apenas_celular) {
        parts.push('📱 Celulares');
    }

    return parts.length > 0 ? parts.join(' • ') : 'Filtro vazio';
}

export function SavedFiltersPanel() {
    const {
        filters,
        savedFilters,
        saveFilter,
        loadFilter,
        deleteFilter,
    } = useLeadsFilters();

    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [filterName, setFilterName] = useState('');

    // Verificar se há filtros válidos para salvar
    const hasValidFilters = filters.brasil_inteiro ||
        filters.estado ||
        (filters.estados && filters.estados.length > 0) ||
        (filters.cnaes_principais && filters.cnaes_principais.length > 0);

    // Salvar filtro atual
    const handleSave = async () => {
        if (!filterName.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Nome obrigatório',
                text: 'Por favor, digite um nome para o filtro.',
                confirmButtonColor: '#6366f1',
                background: '#1f2937',
                color: '#f3f4f6',
            });
            return;
        }

        const savedFilter = saveFilter(filterName.trim());
        setFilterName('');
        setIsSaving(false);

        await Swal.fire({
            icon: 'success',
            title: 'Filtro salvo!',
            text: `"${savedFilter.name}" foi salvo com sucesso.`,
            confirmButtonColor: '#6366f1',
            background: '#1f2937',
            color: '#f3f4f6',
            timer: 2000,
            showConfirmButton: false,
        });
    };

    // Carregar filtro
    const handleLoad = async (filter: SavedFilter) => {
        const result = await Swal.fire({
            title: 'Carregar filtro?',
            html: `
                <p style="color: #e5e7eb; margin-bottom: 8px;">Filtro: <strong style="color: #a78bfa;">${filter.name}</strong></p>
                <p style="color: #9ca3af; font-size: 14px;">${getFilterSummary(filter.filters)}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Carregar',
            cancelButtonText: 'Cancelar',
            background: '#1f2937',
            color: '#f3f4f6',
        });

        if (result.isConfirmed) {
            loadFilter(filter.id);
            setIsOpen(false);
        }
    };

    // Excluir filtro
    const handleDelete = async (filter: SavedFilter, e: React.MouseEvent) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Excluir filtro?',
            html: `<p style="color: #e5e7eb;">Tem certeza que deseja excluir "<strong style="color: #f87171;">${filter.name}</strong>"?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            background: '#1f2937',
            color: '#f3f4f6',
        });

        if (result.isConfirmed) {
            deleteFilter(filter.id);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                        <BookmarkPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </span>
                    <div className="text-left">
                        <span className="font-medium text-gray-800 dark:text-white">Filtros Salvos</span>
                        {savedFilters.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
                                {savedFilters.length}
                            </span>
                        )}
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* Content */}
            {isOpen && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                    {/* Salvar novo filtro */}
                    <div className="mb-4">
                        {isSaving ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    placeholder="Nome do filtro..."
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave();
                                        if (e.key === 'Escape') {
                                            setIsSaving(false);
                                            setFilterName('');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    title="Salvar"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSaving(false);
                                        setFilterName('');
                                    }}
                                    className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    title="Cancelar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsSaving(true)}
                                disabled={!hasValidFilters}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                <Save className="w-4 h-4" />
                                Salvar Filtro Atual
                            </button>
                        )}
                        {!hasValidFilters && !isSaving && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                Configure pelo menos um filtro para poder salvar
                            </p>
                        )}
                    </div>

                    {/* Lista de filtros salvos */}
                    {savedFilters.length === 0 ? (
                        <div className="text-center py-6">
                            <FolderOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Nenhum filtro salvo ainda
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Configure seus filtros e clique em &quot;Salvar Filtro Atual&quot;
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {savedFilters.map((filter) => (
                                <div
                                    key={filter.id}
                                    onClick={() => handleLoad(filter)}
                                    className="group p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-all border border-transparent hover:border-purple-300 dark:hover:border-purple-700"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-800 dark:text-white text-sm truncate group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                                {filter.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {getFilterSummary(filter.filters)}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(filter.updatedAt)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(filter, e)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="Excluir filtro"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
