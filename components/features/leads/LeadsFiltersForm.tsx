/**
 * Formulário de filtros para busca de leads
 */
'use client';

import { Search, Filter, Loader2 } from 'lucide-react';
import CnaeSelector from './CnaeSelector';
import type { LeadsSearchFilters } from '@/types/leads';

interface Estado {
    sigla: string;
    total_cidades: number;
}

interface Cidade {
    nome: string;
}

interface LeadsFiltersFormProps {
    filters: LeadsSearchFilters;
    onFiltersChange: (filters: LeadsSearchFilters) => void;
    onSearch: (e: React.FormEvent) => void;
    estados: Estado[];
    cidades: Cidade[];
    estadosLoading: boolean;
    cidadesLoading: boolean;
    searchLoading: boolean;
    searchError: string | null;
}

export function LeadsFiltersForm({
    filters,
    onFiltersChange,
    onSearch,
    estados,
    cidades,
    estadosLoading,
    cidadesLoading,
    searchLoading,
    searchError,
}: LeadsFiltersFormProps) {
    const handleCnaePrincipalChange = (cnaes: string[]) => {
        onFiltersChange({ ...filters, cnae_principal: cnaes[0] || '' });
    };

    const handleCnaeSecundarioChange = (cnaes: string[]) => {
        onFiltersChange({ ...filters, cnaes_secundarios: cnaes });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Filtros de Busca</h2>
            </div>

            <form onSubmit={onSearch} className="space-y-4">
                {/* Linha 1: Estado e Cidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado *
                        </label>
                        <select
                            value={filters.estado}
                            onChange={(e) => onFiltersChange({ ...filters, estado: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={estadosLoading}
                            required
                        >
                            <option value="">Selecione um estado</option>
                            {estados.map((est) => (
                                <option key={est.sigla} value={est.sigla}>
                                    {est.sigla} ({est.total_cidades} cidades)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cidade
                        </label>
                        <select
                            value={filters.cidade}
                            onChange={(e) => onFiltersChange({ ...filters, cidade: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={!filters.estado || cidadesLoading}
                        >
                            <option value="">Todas as cidades</option>
                            {cidades.map((cidade) => (
                                <option key={cidade.nome} value={cidade.nome}>
                                    {cidade.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Linha 2: CNAE Principal */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CNAE Principal (Atividade Principal da Empresa)
                    </label>
                    <CnaeSelector
                        selectedCnaes={filters.cnae_principal ? [filters.cnae_principal] : []}
                        onSelectionChange={handleCnaePrincipalChange}
                        multiple={false}
                    />
                </div>

                {/* Linha 3: CNAE Secundário */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CNAEs Secundários (Atividades Secundárias da Empresa)
                    </label>
                    <CnaeSelector
                        selectedCnaes={filters.cnaes_secundarios || []}
                        onSelectionChange={handleCnaeSecundarioChange}
                        multiple={true}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Por padrão, aceita empresas com qualquer CNAE secundário. Selecione CNAEs específicos para filtrar.
                    </p>

                    {/* Modo de Correspondência - Aparece apenas se houver CNAEs selecionados */}
                    {filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0 && (
                        <div className="mt-3 p-3 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Modo de correspondência ({filters.cnaes_secundarios.length} CNAE{filters.cnaes_secundarios.length > 1 ? 's' : ''} selecionado{filters.cnaes_secundarios.length > 1 ? 's' : ''}):
                            </p>
                            <div className="space-y-2">
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!filters.exigir_todos_secundarios}
                                        onChange={() => onFiltersChange({ ...filters, exigir_todos_secundarios: false })}
                                        className="mr-2 mt-0.5"
                                    />
                                    <div>
                                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Qualquer um dos CNAEs selecionados</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            A empresa deve ter pelo menos uma das atividades secundárias selecionadas (OR lógico)
                                        </p>
                                    </div>
                                </label>
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={filters.exigir_todos_secundarios || false}
                                        onChange={() => onFiltersChange({ ...filters, exigir_todos_secundarios: true })}
                                        className="mr-2 mt-0.5"
                                    />
                                    <div>
                                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Todos os CNAEs selecionados</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            A empresa deve ter TODAS as atividades secundárias selecionadas (AND lógico)
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Linha 4: Situação e Porte */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Situação Cadastral
                        </label>
                        <select
                            value={filters.situacao}
                            onChange={(e) => onFiltersChange({ ...filters, situacao: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todas</option>
                            <option value="ATIVA">Ativa</option>
                            <option value="INAPTA">Inapta</option>
                            <option value="BAIXADA">Baixada</option>
                            <option value="SUSPENSA">Suspensa</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Porte da Empresa
                        </label>
                        <select
                            value={filters.porte}
                            onChange={(e) => onFiltersChange({ ...filters, porte: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todos</option>
                            <option value="MICRO EMPRESA">Micro Empresa</option>
                            <option value="PEQUENA EMPRESA">Pequena Empresa</option>
                            <option value="MÉDIA EMPRESA">Média Empresa</option>
                            <option value="GRANDE EMPRESA">Grande Empresa</option>
                        </select>
                    </div>
                </div>

                {/* Linha 5: Limite de Visualização */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Limite de Visualização
                    </label>
                    <select
                        value={filters.limit}
                        onChange={(e) => onFiltersChange({ ...filters, limit: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value={50}>50 resultados</option>
                        <option value={100}>100 resultados</option>
                        <option value={500}>500 resultados</option>
                        <option value={1000}>1000 resultados</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Limite apenas para visualização na tabela. A exportação completa inclui todos os leads encontrados.
                    </p>
                </div>

                {/* Botão de Busca */}
                <button
                    type="submit"
                    disabled={searchLoading || !filters.estado}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                    {searchLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Buscando...
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4" />
                            Buscar Leads
                        </>
                    )}
                </button>
            </form>

            {/* Erro */}
            {searchError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {searchError}
                </div>
            )}
        </div>
    );
}
