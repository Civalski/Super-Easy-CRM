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
 * v2.3: Persistência de filtros entre navegações via Context
 */
'use client';

import { useState, useEffect } from 'react';
import { useLeadsSearch, useLeadsCount, useEstados, useCidades, useBairros } from '@/lib/hooks/useLeadsSearch';
import { useLeadsFilters } from '@/lib/context';
import { LeadsFiltersForm, LeadsTable, ImportResultAlert, BairroFilter, SavedFiltersPanel, type ImportResult } from './index';
import type { EmpresaParquet } from '@/types/leads';
import Swal from 'sweetalert2';

export function LeadsSearchComponent() {
    // Estado dos filtros do contexto (persistido entre navegações)
    const {
        filters,
        setFilters,
        searchData,
        setSearchData,
        countData,
        setCountData,
        selectedIndices,
        setSelectedIndices,
        selectedBairros,
        setSelectedBairros,
        bairroFilterApplied,
        setBairroFilterApplied,
        hasSearched,
        setHasSearched,
    } = useLeadsFilters();

    // Estados locais que não precisam persistir
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // Estado para exportação
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingXlsx, setIsExportingXlsx] = useState(false);
    const [isExportingProspectar, setIsExportingProspectar] = useState(false);

    // Hooks
    const { loading: searchLoading, error: searchError, searchLeads } = useLeadsSearch();
    const { loading: countLoading, error: countError, countLeads } = useLeadsCount();
    const { loading: estadosLoading, estados, fetchEstados } = useEstados();
    const { loading: loadingCidadesApi, fetchCidades } = useCidades();
    const [cidadesDisplay, setCidadesDisplay] = useState<any[]>([]);
    const [loadingCidades, setLoadingCidades] = useState(false);

    const { loading: bairrosLoading, bairros: bairrosDisponiveis, totalRegistros: bairrosTotalRegistros, fetchBairros, clearBairros } = useBairros();

    // Carregar estados ao montar
    useEffect(() => {
        fetchEstados();
    }, [fetchEstados]);

    // Carregar cidades quando estados mudarem (suporte multi-estado)
    useEffect(() => {
        const loadCidades = async () => {
            const estadosParaCarregar = filters.estados && filters.estados.length > 0
                ? filters.estados
                : (filters.estado ? [filters.estado] : []);

            if (estadosParaCarregar.length === 0) {
                setCidadesDisplay([]);
                return;
            }

            setLoadingCidades(true);
            try {
                const promises = estadosParaCarregar.map(uf => fetchCidades(uf));
                const results = await Promise.all(promises);

                const todasCidades = results.flatMap((lista, i) => {
                    const uf = estadosParaCarregar[i];
                    return lista.map(c => ({
                        nome: c.nome,
                        value: `${uf}:${c.nome}`,
                        group: uf
                    }));
                }).sort((a, b) => {
                    // Ordenar por UF primeiro, depois por nome da cidade
                    const groupCompare = (a.group || '').localeCompare(b.group || '');
                    if (groupCompare !== 0) return groupCompare;
                    return a.nome.localeCompare(b.nome);
                });


                setCidadesDisplay(todasCidades);
            } catch (error) {
                console.error("Erro ao carregar cidades", error);
            } finally {
                setLoadingCidades(false);
            }
        };

        loadCidades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.estados, filters.estado]);




    // Handlers
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar localização
        if (!filters.brasil_inteiro && !filters.estado && (!filters.estados || filters.estados.length === 0)) {
            alert('Por favor, selecione um estado ou ative "Brasil Inteiro"');
            return;
        }

        try {
            // Limpar estados anteriores
            setSelectedIndices(new Set());
            setImportResult(null);
            setSelectedBairros([]);
            setBairroFilterApplied(false);
            clearBairros();

            // Criar filtros sem bairros para a busca inicial
            const filtrosSemBairro = { ...filters, bairros: undefined };

            // Buscar amostra para exibição e contar total em paralelo
            const [searchResult, countResult] = await Promise.all([
                searchLeads(filtrosSemBairro),
                countLeads(filtrosSemBairro)
            ]);

            // Salvar resultados no contexto para persistir entre navegações
            if (searchResult) {
                setSearchData(searchResult);
            }
            if (countResult) {
                setCountData(countResult);
            }
            setHasSearched(true);

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
        if (!filters.brasil_inteiro && !filters.estado && (!filters.estados || filters.estados.length === 0)) {
            alert('Por favor, selecione uma localização primeiro');
            return;
        }


        setIsExporting(true);

        try {
            // Construir query params
            const queryParams = new URLSearchParams();

            // Parâmetros de localização
            if (filters.brasil_inteiro) {
                queryParams.append('brasil_inteiro', 'true');
            } else if (filters.cidades && filters.cidades.length > 0) {
                // Cidades já vêm no formato ESTADO:CIDADE do seletor
                queryParams.append('cidades', filters.cidades.join(','));
            } else if (filters.estados && filters.estados.length > 0) {
                queryParams.append('estados', filters.estados.join(','));
            } else if (filters.estado) {
                queryParams.append('estado', filters.estado);
                if (filters.cidade) queryParams.append('cidade', filters.cidade);
            }

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
        if (!filters.brasil_inteiro && !filters.estado && (!filters.estados || filters.estados.length === 0)) {
            alert('Por favor, selecione uma localização primeiro');
            return;
        }


        setIsExportingXlsx(true);

        try {
            // Construir query params
            const queryParams = new URLSearchParams();

            // Parâmetros de localização
            if (filters.brasil_inteiro) {
                queryParams.append('brasil_inteiro', 'true');
            } else if (filters.cidades && filters.cidades.length > 0) {
                // Cidades já vêm no formato ESTADO:CIDADE do seletor
                queryParams.append('cidades', filters.cidades.join(','));
            } else if (filters.estados && filters.estados.length > 0) {
                queryParams.append('estados', filters.estados.join(','));
            } else if (filters.estado) {
                queryParams.append('estado', filters.estado);
                if (filters.cidade) queryParams.append('cidade', filters.cidade);
            }

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
        if (!filters.brasil_inteiro && !filters.estado && (!filters.estados || filters.estados.length === 0)) {
            Swal.fire({
                icon: 'warning',
                title: 'Localização não selecionada',
                text: 'Por favor, selecione um estado ou ative "Brasil Inteiro".',
                confirmButtonColor: '#6366f1',
                background: '#1f2937',
                color: '#f3f4f6',
            });
            return;
        }



        // Confirmar antes de importar com SweetAlert2
        const totalLeads = countData?.total_encontrado?.toLocaleString('pt-BR') || 'todos os';

        const result = await Swal.fire({
            title: 'Confirmar Importação',
            html: `
                <div style="text-align: left; padding: 10px 0;">
                    <p style="margin-bottom: 12px; color: #e5e7eb;">Você está prestes a importar <strong style="color: #a78bfa;">${totalLeads}</strong> leads para a aba <strong style="color: #a78bfa;">Prospectar</strong>.</p>
                    
                    <div style="margin: 16px 0;">
                        <label style="display: block; color: #9ca3af; font-size: 14px; margin-bottom: 6px;">Organizar em lotes:</label>
                        <select id="swal-tamanho-lote" style="width: 100%; padding: 10px 12px; background: #374151; border: 1px solid #4b5563; border-radius: 8px; color: #f3f4f6; font-size: 14px;">
                            <option value="0">Sem lote (todos juntos)</option>
                            <option value="30" selected>Lotes de 30 (A, B, C...)</option>
                            <option value="50">Lotes de 50</option>
                            <option value="100">Lotes de 100</option>
                        </select>
                        <p style="margin-top: 6px; color: #6b7280; font-size: 12px;">
                            Lotes ajudam a organizar grandes quantidades de leads (ex: Lote A, Lote B...)
                        </p>
                    </div>
                    
                    <div style="background: #374151; border: 1px solid #4b5563; border-radius: 8px; padding: 12px; margin-top: 8px;">
                        <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                            Atenção: Isso pode demorar alguns minutos dependendo da quantidade de registros.
                        </p>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Sim, importar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            background: '#1f2937',
            color: '#f3f4f6',
            preConfirm: () => {
                const select = document.getElementById('swal-tamanho-lote') as HTMLSelectElement;
                return { tamanhoLote: select?.value || '0' };
            }
        });

        if (!result.isConfirmed) return;

        const tamanhoLote = result.value?.tamanhoLote || '0';

        setIsExportingProspectar(true);
        setImportResult(null);

        try {
            // Construir query params
            const queryParams = new URLSearchParams();

            // Parâmetros de localização
            if (filters.brasil_inteiro) {
                queryParams.append('brasil_inteiro', 'true');
            } else if (filters.cidades && filters.cidades.length > 0) {
                // Cidades já vêm no formato ESTADO:CIDADE do seletor
                queryParams.append('cidades', filters.cidades.join(','));
            } else if (filters.estados && filters.estados.length > 0) {
                queryParams.append('estados', filters.estados.join(','));
            } else if (filters.estado) {
                queryParams.append('estado', filters.estado);
                if (filters.cidade) queryParams.append('cidade', filters.cidade);
            }

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


            // Adicionar tamanho do lote se selecionado
            if (tamanhoLote && tamanhoLote !== '0') {
                queryParams.append('tamanho_lote', tamanhoLote);
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
            const lotes = data.lotes || [];

            // Montar HTML dos lotes se existirem
            const lotesHtml = lotes.length > 0
                ? `<div style="margin-top: 12px; padding: 12px; background: #1e3a5f; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #93c5fd; font-size: 13px; font-weight: 500;">Lotes criados:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${lotes.slice(0, 10).map((l: string) => `<span style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">Lote ${l}</span>`).join('')}
                            ${lotes.length > 10 ? `<span style="color: #93c5fd; font-size: 12px; padding: 4px;">+${lotes.length - 10} mais</span>` : ''}
                        </div>
                    </div>`
                : '';

            await Swal.fire({
                icon: 'success',
                title: 'Importação Concluída',
                html: `
                    <div style="text-align: left; padding: 10px 0;">
                        <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 16px;">
                            <div style="background: #065f46; padding: 16px 24px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #34d399;">${importados}</div>
                                <div style="font-size: 12px; color: #6ee7b7;">Importados</div>
                            </div>
                            <div style="background: #78350f; padding: 16px 24px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #fbbf24;">${duplicados}</div>
                                <div style="font-size: 12px; color: #fcd34d;">Duplicados</div>
                            </div>
                            ${lotes.length > 0 ? `
                            <div style="background: #1e3a5f; padding: 16px 24px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #60a5fa;">${lotes.length}</div>
                                <div style="font-size: 12px; color: #93c5fd;">Lotes</div>
                            </div>
                            ` : ''}
                        </div>
                        ${lotesHtml}
                        <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 12px;">
                            Os leads foram adicionados à aba Prospectar.
                        </p>
                    </div>
                `,
                confirmButtonColor: '#6366f1',
                confirmButtonText: 'Ir para Prospectar',
                showCancelButton: true,
                cancelButtonText: 'Continuar aqui',
                cancelButtonColor: '#4b5563',
                background: '#1f2937',
                color: '#f3f4f6',
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
                background: '#1f2937',
                color: '#f3f4f6',
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
                cidades={cidadesDisplay}
                estadosLoading={estadosLoading}
                cidadesLoading={loadingCidades}

                searchLoading={searchLoading || countLoading}
                searchError={searchError || countError}
            />

            {/* Painel de Filtros Salvos */}
            <SavedFiltersPanel />

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
                            const [searchResult, countResult] = await Promise.all([
                                searchLeads(filtrosComBairro),
                                countLeads(filtrosComBairro)
                            ]);

                            // Salvar resultados no contexto
                            if (searchResult) setSearchData(searchResult);
                            if (countResult) setCountData(countResult);

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
                            const [searchResult, countResult] = await Promise.all([
                                searchLeads(filtrosSemBairro),
                                countLeads(filtrosSemBairro)
                            ]);

                            // Salvar resultados no contexto
                            if (searchResult) setSearchData(searchResult);
                            if (countResult) setCountData(countResult);
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
