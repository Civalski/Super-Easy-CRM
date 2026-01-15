/**
 * Formulário de filtros para busca de leads
 * Interface redesenhada para facilitar uso e preparada para novos filtros
 */
'use client';

import { useState } from 'react';
import { Search, Filter, Loader2, ChevronDown, ChevronUp, MapPin, Building2, Briefcase, Users, DollarSign, Calendar } from 'lucide-react';
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

// Componente de seção colapsável
interface FilterSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string | number;
}

function FilterSection({ title, icon, children, defaultOpen = true, badge }: FilterSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-purple-500 dark:text-purple-400">{icon}</span>
                    <span className="font-medium text-gray-800 dark:text-white">{title}</span>
                    {badge !== undefined && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>
            {isOpen && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
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
    // Handler para CNAEs principais (agora múltiplos)
    const handleCnaesPrincipaisChange = (cnaes: string[]) => {
        onFiltersChange({ ...filters, cnaes_principais: cnaes });
    };

    // Handler para CNAEs secundários
    const handleCnaesSecundariosChange = (cnaes: string[]) => {
        onFiltersChange({ ...filters, cnaes_secundarios: cnaes });
    };

    // Calcular quantos filtros estão ativos em cada seção
    const activeLocationFilters = [filters.estado, filters.cidade].filter(Boolean).length;
    const activeCnaeFilters = (filters.cnaes_principais?.length || 0) + (filters.cnaes_secundarios?.length || 0);
    const activeBusinessFilters = [filters.situacao, filters.porte].filter(Boolean).length +
        (filters.filtrar_telefones_invalidos ? 1 : 0) +
        (filters.adicionar_nono_digito ? 1 : 0) +
        (filters.apenas_celular ? 1 : 0) +
        (filters.capital_min !== undefined && filters.capital_min !== null ? 1 : 0) +
        (filters.capital_max !== undefined && filters.capital_max !== null ? 1 : 0) +
        (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null ? 1 : 0) +
        (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null ? 1 : 0) +
        (filters.mes_inicio !== undefined && filters.mes_inicio !== null ? 1 : 0);

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Filter className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Filtros de Busca</h2>
                        <p className="text-purple-100 text-sm">Configure os critérios para encontrar leads qualificados</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSearch} className="p-6 space-y-4">
                {/* Seção: Localização */}
                <FilterSection
                    title="Localização"
                    icon={<MapPin className="w-5 h-5" />}
                    badge={activeLocationFilters > 0 ? activeLocationFilters : undefined}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Estado <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={filters.estado}
                                onChange={(e) => onFiltersChange({ ...filters, estado: e.target.value, cidade: '' })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cidade
                            </label>
                            <select
                                value={filters.cidade}
                                onChange={(e) => onFiltersChange({ ...filters, cidade: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!filters.estado || cidadesLoading}
                            >
                                <option value="">Todas as cidades</option>
                                {cidades.map((cidade) => (
                                    <option key={cidade.nome} value={cidade.nome}>
                                        {cidade.nome}
                                    </option>
                                ))}
                            </select>
                            {cidadesLoading && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Carregando cidades...
                                </p>
                            )}
                        </div>
                    </div>
                </FilterSection>

                {/* Seção: Atividade Econômica (CNAE) */}
                <FilterSection
                    title="Atividade Econômica (CNAE)"
                    icon={<Building2 className="w-5 h-5" />}
                    badge={activeCnaeFilters > 0 ? activeCnaeFilters : undefined}
                >
                    {/* CNAEs Principais */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                CNAEs Principais
                            </label>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                Atividade principal da empresa
                            </span>
                        </div>
                        <CnaeSelector
                            selectedCnaes={filters.cnaes_principais || []}
                            onSelectionChange={handleCnaesPrincipaisChange}
                            multiple={true}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold">i</span>
                            Empresas com qualquer um dos CNAEs selecionados serão incluídas (lógica OU)
                        </p>
                    </div>

                    {/* Separador visual */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-gray-800 px-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Filtros adicionais
                            </span>
                        </div>
                    </div>

                    {/* CNAEs Secundários */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                CNAEs Secundários
                            </label>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                Atividades secundárias
                            </span>
                        </div>
                        <CnaeSelector
                            selectedCnaes={filters.cnaes_secundarios || []}
                            onSelectionChange={handleCnaesSecundariosChange}
                            multiple={true}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Opcional: Filtre por atividades secundárias da empresa
                        </p>

                        {/* Modo de Correspondência para CNAEs Secundários */}
                        {filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0 && (
                            <div className="mt-3 p-4 border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-900/20">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                        {filters.cnaes_secundarios.length}
                                    </span>
                                    Modo de correspondência
                                </p>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="radio"
                                                checked={!filters.exigir_todos_secundarios}
                                                onChange={() => onFiltersChange({ ...filters, exigir_todos_secundarios: false })}
                                                className="w-4 h-4 text-purple-600 bg-white border-gray-300 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                Qualquer um dos CNAEs
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                A empresa deve ter pelo menos um dos CNAEs selecionados
                                            </p>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="radio"
                                                checked={filters.exigir_todos_secundarios || false}
                                                onChange={() => onFiltersChange({ ...filters, exigir_todos_secundarios: true })}
                                                className="w-4 h-4 text-purple-600 bg-white border-gray-300 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                Todos os CNAEs
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                A empresa deve ter TODOS os CNAEs selecionados
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </FilterSection>

                {/* Seção: Perfil da Empresa */}
                <FilterSection
                    title="Perfil da Empresa"
                    icon={<Briefcase className="w-5 h-5" />}
                    badge={activeBusinessFilters > 0 ? activeBusinessFilters : undefined}
                    defaultOpen={false}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Situação Cadastral
                            </label>
                            <select
                                value={filters.situacao}
                                onChange={(e) => onFiltersChange({ ...filters, situacao: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
                            >
                                <option value="">Todas as situações</option>
                                <option value="ATIVA">✅ Ativa</option>
                                <option value="INAPTA">⚠️ Inapta</option>
                                <option value="BAIXADA">🔴 Baixada</option>
                                <option value="SUSPENSA">⏸️ Suspensa</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Porte da Empresa
                            </label>
                            <select
                                value={filters.porte}
                                onChange={(e) => onFiltersChange({ ...filters, porte: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
                            >
                                <option value="">Todos os portes</option>
                                <option value="MICRO EMPRESA">🏠 Micro Empresa</option>
                                <option value="PEQUENA EMPRESA">🏢 Pequena Empresa</option>
                                <option value="MÉDIA EMPRESA">🏗️ Média Empresa</option>
                                <option value="GRANDE EMPRESA">🏛️ Grande Empresa</option>
                            </select>
                        </div>
                    </div>

                    {/* Filtro de Telefones Inválidos */}
                    {/* Filtro de Telefones Inválidos */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.filtrar_telefones_invalidos || false}
                                onChange={(e) => onFiltersChange({ ...filters, filtrar_telefones_invalidos: e.target.checked })}
                                className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Apenas telefones válidos
                            </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.adicionar_nono_digito || false}
                                onChange={(e) => onFiltersChange({ ...filters, adicionar_nono_digito: e.target.checked })}
                                className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Adicionar 9º dígito em celulares
                            </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.apenas_celular || false}
                                onChange={(e) => onFiltersChange({ ...filters, apenas_celular: e.target.checked })}
                                className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Apenas celulares
                            </span>
                        </label>
                    </div>

                    {/* Filtro de Capital Social */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Capital Social
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Mínimo (R$)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="Ex: 10000"
                                    value={filters.capital_min ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                        onFiltersChange({ ...filters, capital_min: value });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Máximo (R$)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="Ex: 1000000"
                                    value={filters.capital_max ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                        onFiltersChange({ ...filters, capital_max: value });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full text-[10px] font-bold">i</span>
                            Filtre empresas por faixa de capital social (de R$ 0 até milhões)
                        </p>
                    </div>

                    {/* Filtro de Data de Início de Atividade */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Data de Início de Atividade
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Ano Mínimo
                                </label>
                                <input
                                    type="number"
                                    min="1900"
                                    max="2100"
                                    placeholder="Ex: 2018"
                                    value={filters.ano_inicio_min ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                                        onFiltersChange({ ...filters, ano_inicio_min: value });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Ano Máximo
                                </label>
                                <input
                                    type="number"
                                    min="1900"
                                    max="2100"
                                    placeholder="Ex: 2023"
                                    value={filters.ano_inicio_max ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                                        onFiltersChange({ ...filters, ano_inicio_max: value });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Mês (opcional)
                                </label>
                                <select
                                    value={filters.mes_inicio ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                                        onFiltersChange({ ...filters, mes_inicio: value });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-purple-400"
                                >
                                    <option value="">Todos os meses</option>
                                    <option value="1">🗓️ Janeiro</option>
                                    <option value="2">🗓️ Fevereiro</option>
                                    <option value="3">🗓️ Março</option>
                                    <option value="4">🗓️ Abril</option>
                                    <option value="5">🗓️ Maio</option>
                                    <option value="6">🗓️ Junho</option>
                                    <option value="7">🗓️ Julho</option>
                                    <option value="8">🗓️ Agosto</option>
                                    <option value="9">🗓️ Setembro</option>
                                    <option value="10">🗓️ Outubro</option>
                                    <option value="11">🗓️ Novembro</option>
                                    <option value="12">🗓️ Dezembro</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold">i</span>
                            Filtre por ano e mês de abertura da empresa (ex: empresas abertas entre 2020 e 2023)
                        </p>
                    </div>
                </FilterSection>

                {/* Botão de Busca */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={searchLoading || !filters.estado}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                    >
                        {searchLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Buscando leads...</span>
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                <span>Buscar Leads</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Mensagem de Erro */}
                {searchError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                        <div className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">!</div>
                        <div>
                            <p className="font-medium">Erro na busca</p>
                            <p className="text-red-600 dark:text-red-300">{searchError}</p>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
