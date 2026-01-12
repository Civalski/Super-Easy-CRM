/**
 * Componente de busca e filtro de leads dos arquivos .parquet
 * Com funcionalidade de seleção e importação para prospecção
 * 
 * Refatorado para usar subcomponentes:
 * - LeadsFiltersForm: Formulário de filtros
 * - LeadsTable: Tabela de resultados com seleção
 * - ImportResultAlert: Feedback de importação
 * 
 * v2.0: Adicionada contagem total e exportação completa para CSV
 * v2.1: Adicionada exportação para Excel (.xlsx)
 */
'use client';

import { useState, useEffect } from 'react';
import { useLeadsSearch, useLeadsCount, useEstados, useCidades, type LeadsCountResponse } from '@/lib/hooks/useLeadsSearch';
import { LeadsFiltersForm, LeadsTable, ImportResultAlert, type ImportResult } from './index';
import type { LeadsSearchFilters, EmpresaParquet } from '@/types/leads';

export function LeadsSearchComponent() {
    // Estados dos filtros
    const [filters, setFilters] = useState<LeadsSearchFilters>({
        estado: '',
        cidade: '',
        cnae_principal: '',
        cnaes_secundarios: [],
        exigir_todos_secundarios: false,
        situacao: '',
        porte: '',
        limit: 100,
    });

    // Estados de seleção para importação
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // Estado para exportação
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingXlsx, setIsExportingXlsx] = useState(false);

    // Hooks
    const { loading: searchLoading, error: searchError, data: searchData, searchLeads } = useLeadsSearch();
    const { loading: countLoading, error: countError, count: countData, countLeads } = useLeadsCount();
    const { loading: estadosLoading, estados, fetchEstados } = useEstados();
    const { loading: cidadesLoading, cidades, fetchCidades } = useCidades();

    // Carregar estados ao montar
    useEffect(() => {
        fetchEstados();
    }, [fetchEstados]);

    // Carregar cidades quando estado mudar
    useEffect(() => {
        if (filters.estado) {
            // Usamos uma IIFE para garantir que o estado é capturado corretamente
            const estadoAtual = filters.estado;
            fetchCidades(estadoAtual);
            setFilters(prev => ({ ...prev, cidade: '' }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.estado]);

    // Limpar seleção quando novos resultados chegarem
    useEffect(() => {
        setSelectedIndices(new Set());
        setImportResult(null);
    }, [searchData]);

    // Handlers
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!filters.estado) {
            alert('Por favor, selecione um estado');
            return;
        }

        try {
            // Buscar amostra para exibição e contar total em paralelo
            await Promise.all([
                searchLeads(filters),
                countLeads(filters)
            ]);
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
        }
    };

    const handleSelectAll = () => {
        if (!searchData?.resultados) return;

        if (selectedIndices.size === searchData.resultados.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(searchData.resultados.map((_, idx) => idx)));
        }
    };

    const handleSelectOne = (idx: number) => {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(idx)) {
            newSelected.delete(idx);
        } else {
            newSelected.add(idx);
        }
        setSelectedIndices(newSelected);
    };

    const handleImport = async () => {
        if (!searchData?.resultados || selectedIndices.size === 0) return;

        const empresasSelecionadas = Array.from(selectedIndices)
            .map(idx => searchData.resultados[idx])
            .filter(Boolean);

        setIsImporting(true);
        setImportResult(null);

        try {
            const response = await fetch('/api/prospectos/importar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresas: empresasSelecionadas }),
            });

            const data = await response.json();

            const result: ImportResult = {
                success: data.success ?? response.ok,
                importados: data.importados ?? 0,
                duplicados: data.duplicados ?? 0,
                erros: data.erros ?? [],
                mensagem: data.mensagem ?? data.error ?? 'Operação concluída'
            };

            setImportResult(result);

            if (result.success) {
                setSelectedIndices(new Set());
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            setImportResult({
                success: false,
                importados: 0,
                duplicados: 0,
                erros: ['Erro de conexão com o servidor'],
                mensagem: 'Erro ao importar prospectos'
            });
        } finally {
            setIsImporting(false);
        }
    };

    // Exportar apenas os resultados exibidos (comportamento anterior)
    const handleExportCSV = () => {
        if (!searchData?.resultados || searchData.resultados.length === 0) {
            alert('Nenhum resultado para exportar');
            return;
        }

        const headers = Object.keys(searchData.resultados[0]);
        const csvContent = [
            headers.join(','),
            ...searchData.resultados.map(empresa =>
                headers.map(header => {
                    const value = empresa[header as keyof EmpresaParquet];
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${filters.estado}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // NOVO: Exportar TODOS os leads que correspondem ao filtro via streaming
    const handleExportAllCSV = async () => {
        if (!filters.estado) {
            alert('Por favor, selecione um estado primeiro');
            return;
        }

        setIsExporting(true);

        try {
            // Construir query params
            const queryParams = new URLSearchParams();
            queryParams.append('estado', filters.estado);
            if (filters.cidade) queryParams.append('cidade', filters.cidade);
            if (filters.cnae_principal) queryParams.append('cnae_principal', filters.cnae_principal);
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);

            // Fazer download via streaming
            const response = await fetch(`/api/leads/export?${queryParams.toString()}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao exportar');
            }

            // Pegar o blob da resposta
            const blob = await response.blob();

            // Extrair nome do arquivo do header ou gerar um
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `leads_${filters.estado}_completo_${new Date().toISOString().split('T')[0]}.csv`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            // Criar link de download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert(error instanceof Error ? error.message : 'Erro ao exportar leads');
        } finally {
            setIsExporting(false);
        }
    };

    // NOVO: Exportar TODOS os leads em formato Excel (.xlsx)
    const handleExportAllXlsx = async () => {
        if (!filters.estado) {
            alert('Por favor, selecione um estado primeiro');
            return;
        }

        setIsExportingXlsx(true);

        try {
            // Construir query params
            const queryParams = new URLSearchParams();
            queryParams.append('estado', filters.estado);
            if (filters.cidade) queryParams.append('cidade', filters.cidade);
            if (filters.cnae_principal) queryParams.append('cnae_principal', filters.cnae_principal);
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);

            // Fazer download via streaming
            const response = await fetch(`/api/leads/export-xlsx?${queryParams.toString()}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao exportar');
            }

            // Pegar o blob da resposta
            const blob = await response.blob();

            // Extrair nome do arquivo do header ou gerar um
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `leads_${filters.estado}_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            // Criar link de download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            alert(error instanceof Error ? error.message : 'Erro ao exportar leads para Excel');
        } finally {
            setIsExportingXlsx(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Formulário de Filtros */}
            <LeadsFiltersForm
                filters={filters}
                onFiltersChange={setFilters}
                onSearch={handleSearch}
                estados={estados}
                cidades={cidades}
                estadosLoading={estadosLoading}
                cidadesLoading={cidadesLoading}
                searchLoading={searchLoading || countLoading}
                searchError={searchError || countError}
            />

            {/* Resultado da Importação */}
            {importResult && <ImportResultAlert result={importResult} />}

            {/* Resultados */}
            {searchData && (
                <LeadsTable
                    resultados={searchData.resultados}
                    totalEncontrado={countData?.total_encontrado ?? searchData.total_encontrado}
                    totalLidos={countData?.total_lidos ?? searchData.total_lidos}
                    selectedIndices={selectedIndices}
                    isImporting={isImporting}
                    isExporting={isExporting}
                    isExportingXlsx={isExportingXlsx}
                    isCountLoading={countLoading}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onImport={handleImport}
                    onExportCSV={handleExportCSV}
                    onExportAllCSV={handleExportAllCSV}
                    onExportAllXlsx={handleExportAllXlsx}
                    displayLimit={filters.limit || 100}
                />
            )}
        </div>
    );
}
