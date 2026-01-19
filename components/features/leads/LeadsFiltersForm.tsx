/**
 * Formulário de filtros para busca de leads
 * Interface redesenhada para facilitar uso e preparada para novos filtros
 */
'use client';

import { useState } from 'react';
import { Search, Filter, Loader2, ChevronDown, ChevronUp, MapPin, Building2, Briefcase, Users, DollarSign, Calendar, AlertTriangle, Phone, Star, ListPlus } from 'lucide-react';




import CnaeSelector from './CnaeSelector';
import { MultiSelect } from '@/components/common/MultiSelect';
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
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200 bg-white dark:bg-gray-800">

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isOpen ? 'rounded-t-xl border-b border-gray-200 dark:border-gray-700' : 'rounded-xl'}`}
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
                <div className="p-4 rounded-b-xl animate-in slide-in-from-top-2 duration-200">
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
    const activeLocationFilters = [filters.estado, filters.cidade].filter(Boolean).length + (filters.brasil_inteiro ? 1 : 0);
    const activeCnaeFilters = (filters.cnaes_principais?.length || 0) + (filters.cnaes_secundarios?.length || 0);
    const activeBusinessFilters = [filters.situacao, filters.porte].filter(Boolean).length +
        (filters.capital_min !== undefined && filters.capital_min !== null ? 1 : 0) +
        (filters.capital_max !== undefined && filters.capital_max !== null ? 1 : 0) +
        (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null ? 1 : 0) +
        (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null ? 1 : 0) +
        (filters.mes_inicio !== undefined && filters.mes_inicio !== null ? 1 : 0);
    const activeCleanupFilters =
        (filters.filtrar_telefones_invalidos ? 1 : 0) +
        (filters.adicionar_nono_digito ? 1 : 0) +
        (filters.apenas_celular ? 1 : 0);

    // Opções para MultiSelect
    const estadoOptions = estados.map(e => ({
        label: e.sigla,
        value: e.sigla,
        description: `${e.total_cidades || 0} cidades disponíveis`
    }));

    const cidadeOptions = cidades.map(c => ({
        label: c.nome,
        value: (c as any).value || c.nome, // Suporte a value composto se existir
        group: (c as any).group
    }));



    // Handlers de Localização
    const handleEstadosChange = (novosEstados: string[]) => {
        const estadoSingular = novosEstados.length === 1 ? novosEstados[0] : '';

        // Se remover todos os estados, limpa cidades também
        const limparCidades = novosEstados.length === 0;

        onFiltersChange({
            ...filters,
            estados: novosEstados,
            estado: estadoSingular,
            cidades: limparCidades ? [] : filters.cidades,
            cidade: limparCidades ? '' : filters.cidade,
            brasil_inteiro: false // Desativa Brasil Inteiro se mexer nos estados
        });
    };

    const handleCidadesChange = (novasCidades: string[]) => {
        const cidadeSingular = novasCidades.length === 1 ? novasCidades[0] : '';
        onFiltersChange({
            ...filters,
            cidades: novasCidades,
            cidade: cidadeSingular,
            brasil_inteiro: false
        });
    };



    return (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 rounded-t-2xl">
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
                    {/* Toggle Brasil Inteiro */}
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800/50 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        Brasil Inteiro
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Buscar em todos os estados
                                    </p>
                                </div>
                            </div>
                            {/* Toggle Switch */}
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={filters.brasil_inteiro || false}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onFiltersChange({
                                                ...filters,
                                                brasil_inteiro: true,
                                                estado: '',
                                                cidade: '',
                                                estados: undefined,
                                                cidades: undefined
                                            });
                                        } else {
                                            onFiltersChange({
                                                ...filters,
                                                brasil_inteiro: false
                                            });
                                        }
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </div>
                        </label>
                    </div>

                    {/* Aviso quando Brasil inteiro está ativado */}
                    {filters.brasil_inteiro && (
                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong>Atenção:</strong> Grande volume de dados. A operação pode demorar.
                                    Excel suporta até ~1 milhão de linhas.
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Dropdowns de Estado e Cidade */}
                    {!filters.brasil_inteiro && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                            <div>
                                <MultiSelect
                                    label="Estado(s)"
                                    options={estadoOptions}
                                    value={filters.estados || (filters.estado ? [filters.estado] : [])}
                                    onChange={handleEstadosChange}
                                    placeholder="Selecione os estados..."
                                    searchPlaceholder="Buscar estado..."
                                    loading={estadosLoading}
                                />
                            </div>
                            <div>
                                <MultiSelect
                                    label="Cidade(s)"
                                    options={cidadeOptions}
                                    value={filters.cidades || (filters.cidade ? [filters.cidade] : [])}
                                    onChange={handleCidadesChange}
                                    placeholder={cidadesLoading ? "Carregando cidades..." : "Selecione as cidades..."}
                                    searchPlaceholder="Buscar cidade..."
                                    loading={cidadesLoading}
                                    disabled={(!filters.estados || filters.estados.length === 0) && !filters.estado}
                                />
                            </div>
                        </div>
                    )}
                </FilterSection>




                {/* Seção: Atividade Econômica (CNAE) */}
                <FilterSection
                    title="Atividade Econômica (CNAE)"
                    icon={<Building2 className="w-5 h-5" />}
                    badge={activeCnaeFilters > 0 ? activeCnaeFilters : undefined}
                    defaultOpen={false}
                >

                    {/* CNAEs Principais */}
                    <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/50 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-800 rounded-lg">
                                <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-white">
                                    CNAEs Principais
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Atividade principal da empresa
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <CnaeSelector
                                selectedCnaes={filters.cnaes_principais || []}
                                onSelectionChange={handleCnaesPrincipaisChange}
                                multiple={true}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 pl-1">
                                <span className="inline-flex items-center justify-center w-3 h-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-bold">i</span>
                                Empresas com qualquer um dos CNAEs selecionados serão incluídas
                            </p>
                        </div>
                    </div>

                    {/* CNAEs Secundários */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                <ListPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-white">
                                    CNAEs Secundários
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Atividades adicionais (Opcional)
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <CnaeSelector
                                selectedCnaes={filters.cnaes_secundarios || []}
                                onSelectionChange={handleCnaesSecundariosChange}
                                multiple={true}
                            />

                            {/* Modo de Correspondência para CNAEs Secundários */}
                            {filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0 && (
                                <div className="mt-3 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-blue-900/10">
                                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                                        Modo de correspondência
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer border transition-all ${!filters.exigir_todos_secundarios ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                            <div className="mt-0.5">
                                                <input
                                                    type="radio"
                                                    checked={!filters.exigir_todos_secundarios}
                                                    onChange={() => onFiltersChange({ ...filters, exigir_todos_secundarios: false })}
                                                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    Qualquer um (OU)
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                                    Pelo menos um dos CNAEs listados
                                                </p>
                                            </div>
                                        </label>

                                        <label className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer border transition-all ${filters.exigir_todos_secundarios ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                            <div className="mt-0.5">
                                                <input
                                                    type="radio"
                                                    checked={filters.exigir_todos_secundarios || false}
                                                    onChange={() => onFiltersChange({ ...filters, exigir_todos_secundarios: true })}
                                                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    Todos (E)
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                                    Possui TODOS os CNAEs listados
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                <option value="ATIVA">Ativa</option>
                                <option value="INAPTA">Inapta</option>
                                <option value="BAIXADA">Baixada</option>
                                <option value="SUSPENSA">Suspensa</option>
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
                                <option value="MICRO EMPRESA">Micro Empresa</option>
                                <option value="PEQUENA EMPRESA">Pequena Empresa</option>
                                <option value="MÉDIA EMPRESA">Média Empresa</option>
                                <option value="GRANDE EMPRESA">Grande Empresa</option>
                            </select>
                        </div>
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
                                    min="1998"
                                    max="2025"
                                    placeholder="Ex: 1998"
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
                                    min="1998"
                                    max="2025"
                                    placeholder="Ex: 2025"
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
                                    <option value="1">Janeiro</option>
                                    <option value="2">Fevereiro</option>
                                    <option value="3">Março</option>
                                    <option value="4">Abril</option>
                                    <option value="5">Maio</option>
                                    <option value="6">Junho</option>
                                    <option value="7">Julho</option>
                                    <option value="8">Agosto</option>
                                    <option value="9">Setembro</option>
                                    <option value="10">Outubro</option>
                                    <option value="11">Novembro</option>
                                    <option value="12">Dezembro</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold">i</span>
                            Filtre por ano e mês de abertura da empresa (ex: empresas abertas entre 2020 e 2023)
                        </p>
                    </div>
                </FilterSection>

                {/* Seção: Limpeza de Dados */}
                <FilterSection
                    title="Limpeza de Dados"
                    icon={<Phone className="w-5 h-5" />}
                    badge={activeCleanupFilters > 0 ? activeCleanupFilters : undefined}
                    defaultOpen={false}
                >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Configure opções para filtrar e formatar telefones nos resultados.
                    </p>

                    <div className="space-y-4">
                        {/* Filtrar telefones inválidos */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.filtrar_telefones_invalidos || false}
                                    onChange={(e) => onFiltersChange({ ...filters, filtrar_telefones_invalidos: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        Remover telefones inválidos
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Remove números como 00000000, 99999999, telefones em branco, etc.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Adicionar nono dígito */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.adicionar_nono_digito || false}
                                    onChange={(e) => onFiltersChange({ ...filters, adicionar_nono_digito: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        Adicionar 9º dígito em celulares
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Converte celulares de 8 dígitos para o formato atual com 9 dígitos.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Apenas celulares */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.apenas_celular || false}
                                    onChange={(e) => onFiltersChange({ ...filters, apenas_celular: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        Apenas celulares
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Retorna apenas empresas com números de celular (9, 8, 7 ou 6 após DDD).
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </FilterSection>

                {/* Botão de Busca */}

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={searchLoading || (!filters.brasil_inteiro && !filters.estado && (!filters.estados || filters.estados.length === 0))}


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
