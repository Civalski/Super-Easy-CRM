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
        cnae_secundario: '',
        exigir_secundario: false,
        qualquer_secundario: false,
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
        setFilters({ ...filters, cnae_secundario: cnaes[0] || '' });
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
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Filtros de Busca</h2>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    {/* Linha 1: Estado e Cidade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado *
                            </label>
                            <select
                                value={filters.estado}
                                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cidade
                            </label>
                            <select
                                value={filters.cidade}
                                onChange={(e) => setFilters({ ...filters, cidade: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CNAE Principal (Atividade Principal da Empresa)
                        </label>
                        <CnaeSelector
                            selectedCnaes={filters.cnae_principal ? [filters.cnae_principal] : []}
                            onSelectionChange={handleCnaePrincipalChange}
                            multiple={false}
                        />
                    </div>

                    {/* Linha 3: Filtro de CNAE Secundário Avançado */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="mb-3">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.exigir_secundario || false}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        exigir_secundario: e.target.checked,
                                        qualquer_secundario: false,
                                        cnae_secundario: ''
                                    })}
                                    className="mr-2 h-4 w-4"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Exigir CNAE Secundário (filtro combinado)
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                                Marque para filtrar empresas que têm a atividade principal ACIMA e também uma atividade secundária
                            </p>
                        </div>

                        {filters.exigir_secundario && (
                            <div className="space-y-3 pl-6 border-l-2 border-blue-400">
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipo_secundario"
                                            checked={filters.qualquer_secundario || false}
                                            onChange={() => setFilters({
                                                ...filters,
                                                qualquer_secundario: true,
                                                cnae_secundario: ''
                                            })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Qualquer CNAE secundário</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipo_secundario"
                                            checked={!filters.qualquer_secundario}
                                            onChange={() => setFilters({ ...filters, qualquer_secundario: false })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">CNAE secundário específico</span>
                                    </label>
                                </div>

                                {!filters.qualquer_secundario && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Selecione o CNAE Secundário
                                        </label>
                                        <CnaeSelector
                                            selectedCnaes={filters.cnae_secundario ? [filters.cnae_secundario] : []}
                                            onSelectionChange={handleCnaeSecundarioChange}
                                            multiple={false}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Linha 4: Situação e Porte */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Situação Cadastral
                            </label>
                            <select
                                value={filters.situacao}
                                onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todas</option>
                                <option value="ATIVA">Ativa</option>
                                <option value="INAPTA">Inapta</option>
                                <option value="BAIXADA">Baixada</option>
                                <option value="SUSPENSA">Suspensa</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Porte da Empresa
                            </label>
                            <select
                                value={filters.porte}
                                onChange={(e) => setFilters({ ...filters, porte: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Limite de Resultados
                        </label>
                        <select
                            value={filters.limit}
                            onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {searchError}
                    </div>
                )}
            </div>

            {/* Resultados */}
            {searchData && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Resultados da Busca
                            </h2>
                            <p className="text-sm text-gray-600">
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
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Razão Social</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nome Fantasia</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cidade</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Atividade</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Situação</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Telefone</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchData.resultados.map((empresa, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-900">
                                            {empresa['RAZAO SOCIAL / NOME EMPRESARIAL']}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">
                                            {empresa['NOME FANTASIA'] || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">
                                            {empresa.MUNICIPIO}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 text-xs">
                                            {empresa['ATIVIDADE PRINCIPAL']}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${empresa['SITUAÇÃO CADASTRAL'] === 'ATIVA'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {empresa['SITUAÇÃO CADASTRAL']}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">
                                            {empresa['TELEFONE 1'] || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 text-xs">
                                            {empresa['CORREIO ELETRONICO'] || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {searchData.resultados.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Nenhuma empresa encontrada com os filtros selecionados
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
