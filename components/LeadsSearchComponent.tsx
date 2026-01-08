/**
 * Componente de busca e filtro de leads dos arquivos .parquet
 */
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Loader2 } from 'lucide-react';
import { useLeadsSearch, useEstados, useCidades } from '@/lib/hooks/useLeadsSearch';
import CnaeSelector from '@/components/CnaeSelector';
import type { LeadsSearchFilters, EmpresaParquet } from '@/types/leads';

export function LeadsSearchComponent() {
    // Estados dos filtros
    const [filters, setFilters] = useState<LeadsSearchFilters>({
        estado: '',
        cidade: '',
        cnae_principal: '',
        cnaes_secundarios: [],
        exigir_todos_secundarios: false, // false = qualquer um, true = todos
        situacao: '',
        porte: '',
        limit: 100,
    });

    // Hooks
    const { loading: searchLoading, error: searchError, data: searchData, searchLeads } = useLeadsSearch();
    const { loading: estadosLoading, estados, fetchEstados } = useEstados();
    const { loading: cidadesLoading, cidades, fetchCidades } = useCidades();

    // Carregar estados ao montar
    useEffect(() => {
        fetchEstados();
    }, [fetchEstados]);

    // Carregar cidades quando estado mudar
    useEffect(() => {
        if (filters.estado) {
            fetchCidades(filters.estado);
            setFilters(prev => ({ ...prev, cidade: '' })); // Reset cidade
        }
    }, [filters.estado, fetchCidades]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!filters.estado) {
            alert('Por favor, selecione um estado');
            return;
        }

        try {
            await searchLeads(filters);
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
        }
    };

    const handleCnaePrincipalChange = (cnaes: string[]) => {
        setFilters({ ...filters, cnae_principal: cnaes[0] || '' });
    };

    const handleCnaeSecundarioChange = (cnaes: string[]) => {
        setFilters({ ...filters, cnaes_secundarios: cnaes });
    };

    const handleExportCSV = () => {
        if (!searchData?.resultados || searchData.resultados.length === 0) {
            alert('Nenhum resultado para exportar');
            return;
        }

        // Preparar CSV
        const headers = Object.keys(searchData.resultados[0]);
        const csvContent = [
            headers.join(','),
            ...searchData.resultados.map(empresa =>
                headers.map(header => {
                    const value = empresa[header as keyof EmpresaParquet];
                    // Escapar vírgulas e aspas
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            ),
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${filters.estado}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Formulário de Filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Filtros de Busca</h2>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    {/* Linha 1: Estado e Cidade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Estado *
                            </label>
                            <select
                                value={filters.estado}
                                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
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
                                onChange={(e) => setFilters({ ...filters, cidade: e.target.value })}
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
                                            onChange={() => setFilters({ ...filters, exigir_todos_secundarios: false })}
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
                                            onChange={() => setFilters({ ...filters, exigir_todos_secundarios: true })}
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
                                onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
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
                                onChange={(e) => setFilters({ ...filters, porte: e.target.value })}
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

                    {/* Linha 4: Limite de Resultados */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Limite de Resultados
                        </label>
                        <select
                            value={filters.limit}
                            onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value={50}>50 resultados</option>
                            <option value={100}>100 resultados</option>
                            <option value={500}>500 resultados</option>
                            <option value={1000}>1000 resultados</option>
                        </select>
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

            {/* Resultados */}
            {searchData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Resultados da Busca
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {searchData.total_encontrado} empresas encontradas
                                {searchData.total_lidos > searchData.total_encontrado &&
                                    ` (de ${searchData.total_lidos} registros analisados)`
                                }
                            </p>
                        </div>

                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Exportar CSV
                        </button>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Razão Social</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Nome Fantasia</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Cidade</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Atividade</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Situação</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Telefone</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchData.resultados.map((empresa, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                            {empresa['RAZAO SOCIAL / NOME EMPRESARIAL']}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                            {empresa['NOME FANTASIA'] || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                            {empresa.MUNICIPIO}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs">
                                            {empresa['ATIVIDADE PRINCIPAL']}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${empresa['SITUAÇÃO CADASTRAL'] === 'ATIVA'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                {empresa['SITUAÇÃO CADASTRAL']}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                            {empresa['TELEFONE 1'] || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs">
                                            {empresa['CORREIO ELETRONICO'] || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {searchData.resultados.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Nenhuma empresa encontrada com os filtros selecionados
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
