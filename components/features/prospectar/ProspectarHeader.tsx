/**
 * Header da página de Leads (leads frios importados)
 */
'use client'

import { Target, RefreshCw, Send, Loader2 } from 'lucide-react';

interface ProspectarHeaderProps {
    loading: boolean;
    isSending?: boolean;
    totalLeadsFrios?: number;
    selectedCount?: number;
    loteFilter?: string;
    onRefresh: () => void;
    onImport: (file: File) => void;
    onEnviarAoFunil?: (opcao: 'selecionados' | 'lote' | 'todos') => void;
}

export function ProspectarHeader({
    loading,
    isSending = false,
    totalLeadsFrios = 0,
    selectedCount = 0,
    loteFilter = '',
    onRefresh,
    onImport,
    onEnviarAoFunil,
}: ProspectarHeaderProps) {
    const whatsappCompraLeadsUrl =
        'https://wa.me/5519998205608?text=Ol%C3%A1%2C%20gostaria%20de%20adquirir%20leads%20para%20minha%20empresa';

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(file);
        }
        event.target.value = '';
    };

    const showEnviarBtn = onEnviarAoFunil && totalLeadsFrios > 0;

    return (
        <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl shadow-lg shadow-sky-500/25">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Leads
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Leads frios importados aguardando envio ao funil
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href={whatsappCompraLeadsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20"
                    >
                        Comprar Leads
                    </a>

                    <label className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors cursor-pointer shadow-md shadow-sky-500/20">
                        <Target className="w-4 h-4" />
                        <span>Importar XLSX</span>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Barra de ações de envio ao funil */}
            {showEnviarBtn && (
                <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sky-800 dark:text-sky-200">
                            <Send className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {totalLeadsFrios.toLocaleString('pt-BR')} lead(s) frio(s) prontos para enviar ao funil
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {selectedCount > 0 && (
                                <button
                                    onClick={() => onEnviarAoFunil('selecionados')}
                                    disabled={isSending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-300 dark:border-purple-600 shadow-sm text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                    Enviar {selectedCount} selecionados
                                </button>
                            )}
                            {loteFilter && (
                                <button
                                    onClick={() => onEnviarAoFunil('lote')}
                                    disabled={isSending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                    Enviar lote {loteFilter}
                                </button>
                            )}
                            <button
                                onClick={() => onEnviarAoFunil('todos')}
                                disabled={isSending}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {isSending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                Enviar todos ao funil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

