/**
 * Tabela de resultados de busca de leads
 * Exibe empresas com seleção para importação
 * 
 * v2.0: Melhorada exibição do total real e exportação completa
 */
'use client';

import { CheckSquare, Square, UserPlus, Users, FileDown, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import type { EmpresaParquet } from '@/types/leads';

interface LeadsTableProps {
    resultados: EmpresaParquet[];
    totalEncontrado: number;
    totalLidos: number;
    selectedIndices: Set<number>;
    isImporting: boolean;
    isExporting?: boolean;
    isExportingXlsx?: boolean;
    isExportingProspectar?: boolean;
    isCountLoading?: boolean;
    onSelectAll: () => void;
    onSelectOne: (idx: number) => void;
    onImport: () => void;
    onExportAllCSV?: () => void;
    onExportAllXlsx?: () => void;
    onExportAllProspectar?: () => void;
    displayLimit?: number;
}

// Função para formatar números grandes
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2).replace('.', ',') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.', ',') + 'K';
    }
    return num.toLocaleString('pt-BR');
}

export function LeadsTable({
    resultados,
    totalEncontrado,
    totalLidos,
    selectedIndices,
    isImporting,
    isExporting = false,
    isExportingXlsx = false,
    isExportingProspectar = false,
    isCountLoading = false,
    onSelectAll,
    onSelectOne,
    onImport,
    onExportAllCSV,
    onExportAllXlsx,
    onExportAllProspectar,
    displayLimit = 20,
}: LeadsTableProps) {
    const isAllSelected = resultados.length > 0 && selectedIndices.size === resultados.length;
    const hasMoreResults = totalEncontrado > resultados.length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {/* Cabeçalho com estatísticas */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Resultados da Busca
                        </h2>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {/* Botão Importar - aparece quando há seleção */}
                        {selectedIndices.size > 0 && (
                            <button
                                onClick={onImport}
                                disabled={isImporting}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Importar {selectedIndices.size} para Prospecção
                                    </>
                                )}
                            </button>
                        )}

                        {/* Botões exportar TODOS - CSV e Excel */}
                        {onExportAllCSV && (
                            <button
                                onClick={onExportAllCSV}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                                title={`Exportar todos os ${formatNumber(totalEncontrado)} registros em CSV`}
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        CSV...
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        CSV (
                                        {isCountLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : (
                                            formatNumber(totalEncontrado)
                                        )}
                                        )
                                    </>
                                )}
                            </button>
                        )}

                        {/* Botão exportar TODOS em Excel */}
                        {onExportAllXlsx && (
                            <button
                                onClick={onExportAllXlsx}
                                disabled={isExportingXlsx}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                                title={`Exportar todos os ${formatNumber(totalEncontrado)} registros em Excel`}
                            >
                                {isExportingXlsx ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Excel...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Excel (
                                        {isCountLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : (
                                            formatNumber(totalEncontrado)
                                        )}
                                        )
                                    </>
                                )}
                            </button>
                        )}

                        {/* Botão exportar TODOS para Prospectar */}
                        {onExportAllProspectar && (
                            <button
                                onClick={onExportAllProspectar}
                                disabled={isExportingProspectar}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                                title={`Importar todos os ${formatNumber(totalEncontrado)} leads para a aba Prospectar`}
                            >
                                {isExportingProspectar ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-4 h-4" />
                                        Prospectar (
                                        {isCountLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : (
                                            formatNumber(totalEncontrado)
                                        )}
                                        )
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Total encontrado */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Encontrado</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {isCountLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Contando...
                                        </span>
                                    ) : (
                                        formatNumber(totalEncontrado)
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Exibindo agora */}
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Exibindo Agora</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {formatNumber(resultados.length)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Selecionados */}
                    <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                                <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Selecionados</p>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                    {formatNumber(selectedIndices.size)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aviso sobre mais resultados */}
                {hasMoreResults && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                Existem mais resultados disponíveis
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                A tabela exibe apenas <strong>{formatNumber(resultados.length)}</strong> de <strong>{formatNumber(totalEncontrado)}</strong> leads encontrados.
                                Use os botões <strong>"CSV"</strong> ou <strong>"Excel"</strong> para baixar todos os registros.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="py-3 px-3 w-10">
                                <button
                                    onClick={onSelectAll}
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    title={isAllSelected ? "Desselecionar todos" : "Selecionar todos"}
                                >
                                    {isAllSelected ? (
                                        <CheckSquare className="w-5 h-5" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                            </th>
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
                        {resultados.map((empresa, idx) => (
                            <tr
                                key={idx}
                                onClick={() => onSelectOne(idx)}
                                className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${selectedIndices.has(idx)
                                    ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <td className="py-3 px-3">
                                    <div className="flex items-center justify-center">
                                        {selectedIndices.has(idx) ? (
                                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </td>
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

            {resultados.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhuma empresa encontrada com os filtros selecionados
                </div>
            )}
        </div>
    );
}
