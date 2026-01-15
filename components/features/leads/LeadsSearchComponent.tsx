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
 * v2.2: Adicionada exportação de TODOS os leads para aba Prospectar
 */
'use client';

import { useState, useEffect } from 'react';
import { useLeadsSearch, useLeadsCount, useEstados, useCidades, useBairros, type LeadsCountResponse } from '@/lib/hooks/useLeadsSearch';
import { LeadsFiltersForm, LeadsTable, ImportResultAlert, BairroFilter, type ImportResult } from './index';
import type { LeadsSearchFilters, EmpresaParquet } from '@/types/leads';
import Swal from 'sweetalert2';

export function LeadsSearchComponent() {
    // Estados dos filtros
    const [filters, setFilters] = useState<LeadsSearchFilters>({
        estado: '',
        cidade: '',
        cnaes_principais: [],
        cnaes_secundarios: [],
        exigir_todos_secundarios: false,
        filtrar_telefones_invalidos: true, // Ativado por padrão
        adicionar_nono_digito: false,
        apenas_celular: false,
        situacao: '',
        porte: '',
        limit: 20, // Limite fixo de 20 para visualização
    });

    // Estados de seleção para importação
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // Estado para exportação
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingXlsx, setIsExportingXlsx] = useState(false);
    const [isExportingProspectar, setIsExportingProspectar] = useState(false);

    // Hooks
    const { loading: searchLoading, error: searchError, data: searchData, searchLeads } = useLeadsSearch();
    const { loading: countLoading, error: countError, count: countData, countLeads } = useLeadsCount();
    const { loading: estadosLoading, estados, fetchEstados } = useEstados();
    const { loading: cidadesLoading, cidades, fetchCidades } = useCidades();
    const { loading: bairrosLoading, bairros: bairrosDisponiveis, totalRegistros: bairrosTotalRegistros, fetchBairros, clearBairros } = useBairros();

    // Estado para pós-filtro de bairros
    const [selectedBairros, setSelectedBairros] = useState<string[]>([]);
    const [bairroFilterApplied, setBairroFilterApplied] = useState(false);

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
            // Limpar filtro de bairros anterior
            setSelectedBairros([]);
            setBairroFilterApplied(false);
            clearBairros();

            // Criar filtros sem bairros para a busca inicial
            const filtrosSemBairro = { ...filters, bairros: undefined };

            // Buscar amostra para exibição e contar total em paralelo
            await Promise.all([
                searchLeads(filtrosSemBairro),
                countLeads(filtrosSemBairro)
            ]);

            // Buscar bairros disponíveis para o pós-filtro
            fetchBairros(filtrosSemBairro).catch(console.error);
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
            if (filters.cnaes_principais && filters.cnaes_principais.length > 0) {
                queryParams.append('cnaes_principais', filters.cnaes_principais.join(','));
            }
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.filtrar_telefones_invalidos) queryParams.append('filtrar_telefones_invalidos', 'true');
            if (filters.adicionar_nono_digito) queryParams.append('adicionar_nono_digito', 'true');
            if (filters.apenas_celular) queryParams.append('apenas_celular', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);
            if (filters.capital_min !== undefined && filters.capital_min !== null) {
                queryParams.append('capital_min', filters.capital_min.toString());
            }
            if (filters.capital_max !== undefined && filters.capital_max !== null) {
                queryParams.append('capital_max', filters.capital_max.toString());
            }
            if (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null) {
                queryParams.append('ano_inicio_min', filters.ano_inicio_min.toString());
            }
            if (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null) {
                queryParams.append('ano_inicio_max', filters.ano_inicio_max.toString());
            }
            if (filters.mes_inicio !== undefined && filters.mes_inicio !== null) {
                queryParams.append('mes_inicio', filters.mes_inicio.toString());
            }
            // Incluir bairros selecionados se houver
            if (selectedBairros.length > 0) {
                queryParams.append('bairros', selectedBairros.join(','));
            }

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
            if (filters.cnaes_principais && filters.cnaes_principais.length > 0) {
                queryParams.append('cnaes_principais', filters.cnaes_principais.join(','));
            }
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.filtrar_telefones_invalidos) queryParams.append('filtrar_telefones_invalidos', 'true');
            if (filters.adicionar_nono_digito) queryParams.append('adicionar_nono_digito', 'true');
            if (filters.apenas_celular) queryParams.append('apenas_celular', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);
            if (filters.capital_min !== undefined && filters.capital_min !== null) {
                queryParams.append('capital_min', filters.capital_min.toString());
            }
            if (filters.capital_max !== undefined && filters.capital_max !== null) {
                queryParams.append('capital_max', filters.capital_max.toString());
            }
            if (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null) {
                queryParams.append('ano_inicio_min', filters.ano_inicio_min.toString());
            }
            if (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null) {
                queryParams.append('ano_inicio_max', filters.ano_inicio_max.toString());
            }
            if (filters.mes_inicio !== undefined && filters.mes_inicio !== null) {
                queryParams.append('mes_inicio', filters.mes_inicio.toString());
            }
            // Incluir bairros selecionados se houver
            if (selectedBairros.length > 0) {
                queryParams.append('bairros', selectedBairros.join(','));
            }

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

    // NOVO: Exportar TODOS os leads diretamente para a aba Prospectar
    const handleExportAllProspectar = async () => {
        if (!filters.estado) {
            Swal.fire({
                icon: 'warning',
                title: 'Estado não selecionado',
                text: 'Por favor, selecione um estado primeiro.',
                confirmButtonColor: '#6366f1',
            });
            return;
        }

        // Confirmar antes de importar com SweetAlert2
        const totalLeads = countData?.total_encontrado?.toLocaleString('pt-BR') || 'todos os';

        const result = await Swal.fire({
            title: 'Confirmar Importação',
            html: `
                <div style="text-align: left; padding: 10px 0;">
                    <p style="margin-bottom: 12px;">Você está prestes a importar <strong>${totalLeads}</strong> leads para a aba <strong>Prospectar</strong>.</p>
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-top: 8px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            ⚠️ Isso pode demorar alguns minutos dependendo da quantidade de registros.
                        </p>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '🚀 Sim, importar!',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        setIsExportingProspectar(true);
        setImportResult(null);

        try {
            // Construir query params
            const queryParams = new URLSearchParams();
            queryParams.append('estado', filters.estado);
            if (filters.cidade) queryParams.append('cidade', filters.cidade);
            if (filters.cnaes_principais && filters.cnaes_principais.length > 0) {
                queryParams.append('cnaes_principais', filters.cnaes_principais.join(','));
            }
            if (filters.cnaes_secundarios && filters.cnaes_secundarios.length > 0) {
                queryParams.append('cnaes_secundarios', filters.cnaes_secundarios.join(','));
            }
            if (filters.exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
            if (filters.filtrar_telefones_invalidos) queryParams.append('filtrar_telefones_invalidos', 'true');
            if (filters.adicionar_nono_digito) queryParams.append('adicionar_nono_digito', 'true');
            if (filters.apenas_celular) queryParams.append('apenas_celular', 'true');
            if (filters.situacao) queryParams.append('situacao', filters.situacao);
            if (filters.porte) queryParams.append('porte', filters.porte);
            if (filters.capital_min !== undefined && filters.capital_min !== null) {
                queryParams.append('capital_min', filters.capital_min.toString());
            }
            if (filters.capital_max !== undefined && filters.capital_max !== null) {
                queryParams.append('capital_max', filters.capital_max.toString());
            }
            if (filters.ano_inicio_min !== undefined && filters.ano_inicio_min !== null) {
                queryParams.append('ano_inicio_min', filters.ano_inicio_min.toString());
            }
            if (filters.ano_inicio_max !== undefined && filters.ano_inicio_max !== null) {
                queryParams.append('ano_inicio_max', filters.ano_inicio_max.toString());
            }
            if (filters.mes_inicio !== undefined && filters.mes_inicio !== null) {
                queryParams.append('mes_inicio', filters.mes_inicio.toString());
            }
            // Incluir bairros selecionados se houver
            if (selectedBairros.length > 0) {
                queryParams.append('bairros', selectedBairros.join(','));
            }

            // Chamar API para importar
            const response = await fetch(`/api/leads/export-prospectar?${queryParams.toString()}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao importar para prospectar');
            }

            // Mostrar resultado com SweetAlert2
            const importados = data.importados || 0;
            const duplicados = data.duplicados || 0;

            await Swal.fire({
                icon: 'success',
                title: 'Importação Concluída!',
                html: `
                    <div style="text-align: left; padding: 10px 0;">
                        <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 16px;">
                            <div style="background: #dcfce7; padding: 16px 24px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${importados}</div>
                                <div style="font-size: 12px; color: #15803d;">Importados</div>
                            </div>
                            <div style="background: #fef3c7; padding: 16px 24px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #d97706;">${duplicados}</div>
                                <div style="font-size: 12px; color: #b45309;">Duplicados</div>
                            </div>
                        </div>
                        <p style="text-align: center; color: #6b7280; font-size: 14px;">
                            Os leads foram adicionados à aba Prospectar.
                        </p>
                    </div>
                `,
                confirmButtonColor: '#6366f1',
                confirmButtonText: 'Ir para Prospectar',
                showCancelButton: true,
                cancelButtonText: 'Continuar aqui',
                cancelButtonColor: '#6b7280',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/prospectar';
                }
            });

            setImportResult({
                success: true,
                importados: importados,
                duplicados: duplicados,
                erros: data.erros || [],
                mensagem: data.mensagem || `${importados} prospectos importados com sucesso!`
            });

        } catch (error) {
            console.error('Erro ao exportar para prospectar:', error);

            await Swal.fire({
                icon: 'error',
                title: 'Erro na Importação',
                text: error instanceof Error ? error.message : 'Erro desconhecido ao importar leads.',
                confirmButtonColor: '#ef4444',
            });

            setImportResult({
                success: false,
                importados: 0,
                duplicados: 0,
                erros: [error instanceof Error ? error.message : 'Erro desconhecido'],
                mensagem: 'Erro ao importar leads para prospectar'
            });
        } finally {
            setIsExportingProspectar(false);
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

            {/* Pós-Filtro de Bairros */}
            {searchData && bairrosDisponiveis.length > 0 && (
                <BairroFilter
                    bairros={bairrosDisponiveis}
                    selectedBairros={selectedBairros}
                    onBairrosChange={setSelectedBairros}
                    onApplyFilter={async () => {
                        if (selectedBairros.length === 0) return;

                        try {
                            const filtrosComBairro = { ...filters, bairros: selectedBairros };
                            await Promise.all([
                                searchLeads(filtrosComBairro),
                                countLeads(filtrosComBairro)
                            ]);
                            setBairroFilterApplied(true);
                        } catch (error) {
                            console.error('Erro ao aplicar filtro de bairro:', error);
                        }
                    }}
                    onClearFilter={async () => {
                        setSelectedBairros([]);
                        setBairroFilterApplied(false);
                        const filtrosSemBairro = { ...filters, bairros: undefined };
                        try {
                            await Promise.all([
                                searchLeads(filtrosSemBairro),
                                countLeads(filtrosSemBairro)
                            ]);
                        } catch (error) {
                            console.error('Erro ao limpar filtro de bairro:', error);
                        }
                    }}
                    loading={searchLoading || countLoading}
                    totalRegistros={bairrosTotalRegistros}
                />
            )}

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
                    isExportingProspectar={isExportingProspectar}
                    isCountLoading={countLoading}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onImport={handleImport}
                    onExportAllCSV={handleExportAllCSV}
                    onExportAllXlsx={handleExportAllXlsx}
                    onExportAllProspectar={handleExportAllProspectar}
                    displayLimit={20}
                />
            )}
        </div>
    );
}
